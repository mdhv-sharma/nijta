/*
 * Nijta: policy.js  ("Understand it" tab: policy changes)
 * -------------------------------------------------------
 * Shows data/policy_changes.js as a timeline. For each change:
 *   what changed · how it affects you · what you can do · source
 * "NEW" marks changes you haven't seen yet (remembered on this device).
 * If you have scanned an export from that app, it says how many items of yours are affected.
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var KB = window.NijtaPolicyKB;
  var filter = "all";
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  function seen() { try { return localStorage.getItem("nijta-policy-seen") || ""; } catch (e) { return ""; } }
  function data() { return window.NIJTA_POLICY || { updated: "", changes: [] }; }
  function isNew(c) { var s = seen(); return !s || c.date > s || (c.kind === "auto" && c.date >= s); }

  // How many of the user's findings came from this app (only if a scan is loaded).
  function yours(app) {
    var a = window.NijtaApp, r = a && a.state.result;
    if (!r || (a.state.data && a.state.data.isDemo)) return 0;
    return r.items.filter(function (u) { return u.category !== "possible" && u.occurrences.some(function (f) { return f.source === app; }); }).length;
  }

  function card(c) {
    var topics = (c.topics || []).map(function (t) { var k = KB.byId(t); return k ? '<span class="badge topic">' + k.icon + " " + esc(k.label) + "</span>" : ""; }).join("");
    var what, affect, action;
    if (c.kind === "auto") {
      // Built from the knowledge base: one line per topic, plus the actual wording that changed.
      what = (c.topics || []).map(function (t) {
        var d = (c.details || {})[t] || { added: [], removed: [] }, k = KB.byId(t);
        return "<div><b>" + esc(k.label) + "</b><ul class='diff'>" +
          d.removed.map(function (s) { return '<li class="del" title="Removed">' + esc(s) + "</li>"; }).join("") +
          d.added.map(function (s) { return '<li class="add" title="Added">' + esc(s) + "</li>"; }).join("") + "</ul></div>";
      }).join("");
      affect = "<ul>" + (c.topics || []).map(function (t) { return "<li>" + esc(KB.byId(t).affect) + "</li>"; }).join("") + "</ul>";
      var acts = [];
      (c.topics || []).forEach(function (t) { KB.byId(t).action.forEach(function (x) { if (acts.indexOf(x) < 0) acts.push(x); }); });
      action = acts.slice(0, 5);
    } else { what = esc(c.what); affect = esc(c.affect); action = c.action || []; }
    var n = yours(c.app);
    return '<div class="pol' + (isNew(c) ? " is-new" : "") + '">' +
      '<div class="pol-head"><span class="pol-app">' + esc(c.app) + "</span><span>" + esc(fmt(c.date)) + "</span>" +
      (isNew(c) ? '<span class="badge new">NEW</span>' : "") + (c.kind === "auto" ? '<span class="badge auto" title="Found by Nijta\'s daily check of the policy page">Detected automatically</span>' : "") + topics + "</div>" +
      "<h3>" + esc(c.title) + "</h3>" +
      '<div class="pol-grid"><div class="pol-box"><b class="k">What changed</b>' + what + "</div>" +
      '<div class="pol-box you"><b class="k">How it affects you</b>' + affect + "</div>" +
      '<div class="pol-box do"><b class="k">What you can do</b><ul>' + action.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul></div></div>" +
      (n ? '<div class="pol-you">⚠ Nijta found ' + n + " personal or sensitive item" + (n > 1 ? "s" : "") + " in your " + esc(c.app) + " chats, so this applies to you.</div>" : "") +
      '<div class="pol-foot">' + (c.kind === "auto" ? "Read the full policy: " : "Source: ") + '<a target="_blank" rel="noopener" href="' + esc(c.source.url) + '">' + esc(c.source.name) + " ↗</a>" +
      (c.kind === "auto" ? ' <span class="muted">· Nijta compares the page with yesterday\'s copy. Red = removed, green = added. Read the policy itself before relying on this.</span>' : "") + "</div></div>";
  }

  function render() {
    var d = data(), list = d.changes.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var apps = [];
    list.forEach(function (c) { if (apps.indexOf(c.app) < 0) apps.push(c.app); });
    $("polFilters").innerHTML = [["all", "All apps"]].concat(apps.map(function (a) { return [a, a]; })).map(function (x) {
      return '<button class="chip' + (filter === x[0] ? " active" : "") + '" data-a="' + esc(x[0]) + '">' + esc(x[1]) + "</button>";
    }).join("");
    $("polFilters").querySelectorAll(".chip").forEach(function (b) { b.addEventListener("click", function () { filter = b.dataset.a; render(); }); });
    var shown = list.filter(function (c) { return filter === "all" || c.app === filter; });
    $("polList").innerHTML = shown.length ? shown.map(card).join("") : '<p class="muted">No changes recorded for this app yet.</p>';
    $("polFoot").textContent = "Last checked: " + (d.updated ? fmt(d.updated) : "never") +
      ". Older entries were written by the team from public sources. Once Nijta is on GitHub, it re-checks the policy pages every day and adds new changes here by itself.";
    var fresh = list.filter(isNew).length, dot = $("polDot");
    dot.hidden = !fresh; dot.textContent = fresh;
  }

  // Opening the tab counts as "seen": the NEW marks stay for this visit and clear next time.
  document.querySelectorAll('.tab[data-tab="understand"]').forEach(function (t) {
    t.addEventListener("click", function () {
      render();
      try { localStorage.setItem("nijta-policy-seen", new Date().toISOString().slice(0, 10)); } catch (e) { }
      $("polDot").hidden = true;
      $("newsBanner").hidden = true;
    });
  });
  // Banner at the top when there are policy changes you haven't seen yet.
  function banner() {
    var list = data().changes.filter(isNew).sort(function (a, b) { return a.date < b.date ? 1 : -1; }), el = $("newsBanner");
    if (!list.length || !seen()) { el.hidden = true; return; }      // first visit: the tab count is enough
    var c = list[0], more = list.length > 1 ? " (+" + (list.length - 1) + " more)" : "";
    el.innerHTML = "📜 <span><b>New privacy change:</b> " + esc(c.app) + ": " + esc(c.title) + more + "</span>" +
      '<button id="newsGo">See what it means</button><button class="x" id="newsX" aria-label="Dismiss">✕</button>';
    el.hidden = false;
    $("newsGo").addEventListener("click", function () { el.hidden = true; document.querySelector('.tab[data-tab="understand"]').click(); });
    $("newsX").addEventListener("click", function () { el.hidden = true; });
  }
  render();
  banner();
  window.NijtaPolicy = { render: render };
})();
