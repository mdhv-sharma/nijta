// Nijta policy watcher. Run:  node tools/policy_watch.js
// (GitHub Actions runs it once a day: see .github/workflows/policy-watch.yml)
//
// For every page in data/policy_sources.json it:
//   1. downloads the page and turns it into plain sentences
//   2. makes a SHA-256 fingerprint (hash). Same hash as last time = nothing changed, stop.
//   3. otherwise finds which sentences were ADDED and which were REMOVED
//   4. sorts those sentences into topics (training, retention, sharing, ads ...) with js/policy_kb.js
//   5. adds an entry to data/policy_changes.js, which the app shows in the "Understand it" tab
// The first run only saves a snapshot (there is nothing to compare with yet).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const KB = require("../js/policy_kb.js");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data", "policy_sources.json");
const OUT = path.join(ROOT, "data", "policy_changes.js");
const SNAP = path.join(ROOT, "data", "snapshots");

function htmlToSentences(html) {
  const text = html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)[^>]*>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ").replace(/([.!?])(\s*\.)+/g, "$1");
  const seen = new Set(), out = [];
  for (const raw of text.split(/(?<=[.!?])\s+/)) {
    const s = raw.replace(/^[\s.]+/, "").trim();
    if (s.length < 40 || s.length > 600) continue;        // skip menus, buttons and giant blobs
    const key = s.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    if (!seen.has(key)) { seen.add(key); out.push(s); }
  }
  return out;
}
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const short = (s) => (s.length > 180 ? s.slice(0, 177) + "…" : s);

function readChanges() {
  if (!fs.existsSync(OUT)) return { updated: "", changes: [] };
  const txt = fs.readFileSync(OUT, "utf8");
  return JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
}
function writeChanges(data) {
  fs.writeFileSync(OUT,
    "// Privacy-policy changes shown in the \"Understand it\" tab.\n" +
    "// \"curated\" entries were written by the team from public sources. \"auto\" entries are added by\n" +
    "// tools/policy_watch.js (run daily by GitHub Actions) when a policy page changes.\n" +
    "window.NIJTA_POLICY = " + JSON.stringify(data, null, 1) + ";\n");
}

// RSS feed (data/feed.xml): anyone can follow policy changes in a news-reader app.
function writeFeed(data) {
  const x = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const items = data.changes.slice(0, 30).map((c) => {
    const desc = c.kind === "auto" ? c.topics.map((t) => KB.byId(t).label + ": " + KB.byId(t).affect).join(" ") : c.what + " " + c.affect;
    return `  <item>\n    <title>${x(c.app + ": " + c.title)}</title>\n    <link>${x(c.source.url)}</link>\n    <guid isPermaLink="false">${x(c.id)}</guid>\n    <pubDate>${new Date(c.date + "T09:00:00Z").toUTCString()}</pubDate>\n    <description>${x(desc)}</description>\n  </item>`;
  }).join("\n");
  fs.writeFileSync(path.join(ROOT, "data", "feed.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Nijta: AI privacy policy changes</title>\n  <link>https://github.com/</link>\n  <description>Changes in the privacy policies of AI chat apps, explained simply.</description>\n${items}\n</channel>\n</rss>\n`);
}

async function main() {
  const sources = JSON.parse(fs.readFileSync(SRC, "utf8"));
  fs.mkdirSync(SNAP, { recursive: true });
  const data = readChanges();
  const today = new Date().toISOString().slice(0, 10);
  let added = 0;

  for (const src of sources) {
    let html;
    try {
      const res = await fetch(src.url, { headers: { "User-Agent": "Mozilla/5.0 (Nijta policy watcher; student project)", "Accept-Language": "en" }, redirect: "follow" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      html = await res.text();
    } catch (e) {
      console.log(`SKIP   ${src.id}: could not download (${e.message}). Some sites block automatic visitors.`);
      continue;
    }
    const sentences = htmlToSentences(html);
    if (sentences.length < 15) { console.log(`SKIP   ${src.id}: page had too little text (${sentences.length} sentences); probably a blocked or script-only page.`); continue; }
    const hash = crypto.createHash("sha256").update(sentences.map(norm).join("\n")).digest("hex");
    const file = path.join(SNAP, src.id + ".json");
    const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
    fs.writeFileSync(file, JSON.stringify({ url: src.url, checked: today, hash, sentences }, null, 1));

    if (!old) { console.log(`FIRST  ${src.id}: snapshot saved (${sentences.length} sentences).`); continue; }
    if (old.hash === hash) { console.log(`SAME   ${src.id}`); continue; }

    const oldSet = new Set(old.sentences.map(norm)), newSet = new Set(sentences.map(norm));
    const plus = sentences.filter((s) => !oldSet.has(norm(s)));
    const minus = old.sentences.filter((s) => !newSet.has(norm(s)));
    // Only sentences about a privacy topic matter; cookie banners and typos are ignored.
    const topics = {};
    for (const [list, key] of [[plus, "added"], [minus, "removed"]]) {
      for (const s of list) for (const t of KB.classify(s)) {
        topics[t] = topics[t] || { added: [], removed: [] };
        if (topics[t][key].length < 2) topics[t][key].push(short(s));
      }
    }
    const ids = Object.keys(topics);
    if (!ids.length) { console.log(`MINOR  ${src.id}: wording changed (${plus.length} added, ${minus.length} removed) but nothing about a privacy topic.`); continue; }

    data.changes = data.changes.filter((c) => c.id !== src.id + "-" + today);
    data.changes.push({
      id: src.id + "-" + today, kind: "auto", company: src.company, app: src.app, date: today,
      title: `${src.company} changed its ${src.name}: ${ids.map((t) => KB.byId(t).label.toLowerCase()).join(", ")}`,
      topics: ids, details: topics, counts: { added: plus.length, removed: minus.length },
      source: { name: src.name, url: src.url }
    });
    added++;
    console.log(`CHANGE ${src.id}: ${ids.join(", ")} (${plus.length} sentences added, ${minus.length} removed)`);
  }
  data.updated = today;
  data.changes.sort((a, b) => (a.date < b.date ? 1 : -1));
  writeChanges(data);
  writeFeed(data);
  // A short summary for the GitHub workflow, which turns it into an issue (GitHub emails watchers).
  const NOTE = path.join(ROOT, "policy_alert.md");
  const fresh = data.changes.filter((c) => c.kind === "auto" && c.date === today);
  if (fresh.length) {
    fs.writeFileSync(NOTE, fresh.map((c) => {
      const lines = [`### ${c.title}`, ""];
      for (const t of c.topics) {
        const k = KB.byId(t), d = c.details[t];
        lines.push(`**${k.label}**: ${k.affect}`);
        d.removed.forEach((s) => lines.push(`- ~~${s}~~`));
        d.added.forEach((s) => lines.push(`- **New:** ${s}`));
        lines.push("", "What you can do: " + k.action.join("; ") + ".", "");
      }
      lines.push(`Full policy: ${c.source.url}`, "");
      return lines.join("\n");
    }).join("\n---\n\n"));
  } else if (fs.existsSync(NOTE)) fs.unlinkSync(NOTE);
  console.log(`Done. ${added} new change(s) recorded.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
