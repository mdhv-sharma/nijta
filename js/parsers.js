/*
 * Nijta: parsers.js
 * ------------------
 * Reads the official "Export data" files from AI apps and turns them into
 * one simple shape:
 *
 *   { source: "ChatGPT", conversations: [
 *       { id, title, created, messages: [ { role: "user"|"assistant", text, time } ] } ] }
 *
 * Supported today: ChatGPT export (.zip or conversations.json),
 *                  Claude export (.zip or conversations.json).
 * Nothing is uploaded: everything happens inside this browser.
 */
(function (root) {
  "use strict";

  function toMs(t) {
    if (t == null) return null;
    if (typeof t === "number") return t < 1e12 ? t * 1000 : t;   // seconds -> ms
    var d = Date.parse(t);
    return isNaN(d) ? null : d;
  }

  // ---------------- ChatGPT ----------------
  // Each conversation has a "mapping": a tree of message nodes.
  function isChatGPT(data) {
    return Array.isArray(data) && data.length > 0 && data[0] && typeof data[0].mapping === "object";
  }

  function countChatGPTAttachments(m) {
    var n = 0;
    var parts = (m.content && m.content.parts) || [];
    parts.forEach(function (p) { if (p && typeof p === "object" && /image|asset|file/i.test(p.content_type || "")) n++; });
    if (m.metadata && Array.isArray(m.metadata.attachments)) n = Math.max(n, m.metadata.attachments.length);
    return n;
  }

  function textFromChatGPTContent(c) {
    if (!c) return "";
    if (Array.isArray(c.parts)) {
      return c.parts.map(function (p) {
        if (typeof p === "string") return p;
        if (p && typeof p.text === "string") return p.text;
        return "";
      }).join("\n").trim();
    }
    if (typeof c.text === "string") return c.text;
    return "";
  }

  function parseChatGPT(data) {
    var convs = data.map(function (conv, ci) {
      var nodes = [];
      var mapping = conv.mapping || {};
      // Follow the chosen branch from the last message back to the start,
      // so edited / regenerated messages are not counted twice.
      var path = [];
      var cur = conv.current_node;
      var guard = 0;
      while (cur && mapping[cur] && guard++ < 100000) { path.push(mapping[cur]); cur = mapping[cur].parent; }
      if (path.length) nodes = path.reverse();
      else nodes = Object.keys(mapping).map(function (k) { return mapping[k]; });

      var msgs = [];
      nodes.forEach(function (n) {
        var m = n && n.message;
        if (!m || !m.author) return;
        var role = m.author.role;
        if (role !== "user" && role !== "assistant") return;
        var text = textFromChatGPTContent(m.content);
        var att = role === "user" ? countChatGPTAttachments(m) : 0;
        if (!text && !att) return;
        msgs.push({ role: role, text: text || "", time: toMs(m.create_time), attachments: att });
      });
      if (!conv.current_node) msgs.sort(function (a, b) { return (a.time || 0) - (b.time || 0); });
      var cid = conv.conversation_id || conv.id || null;
      return {
        id: cid || "c" + ci,
        link: cid ? "https://chatgpt.com/c/" + cid : null,
        title: conv.title || "Untitled chat",
        created: toMs(conv.create_time) || (msgs[0] && msgs[0].time) || null,
        messages: msgs
      };
    });
    return { source: "ChatGPT", conversations: convs };
  }

  // ---------------- Claude ----------------
  function isClaude(data) {
    return Array.isArray(data) && data.length > 0 && data[0] && Array.isArray(data[0].chat_messages);
  }

  function parseClaude(data) {
    var convs = data.map(function (conv, ci) {
      var msgs = (conv.chat_messages || []).map(function (m) {
        var text = m.text;
        if (!text && Array.isArray(m.content)) {
          text = m.content.filter(function (c) { return c && c.type === "text"; })
            .map(function (c) { return c.text; }).join("\n");
        }
        var att = 0;
        (m.attachments || []).forEach(function (a) {
          if (a && a.extracted_content) text = (text || "") + "\n[Attached file: " + (a.file_name || "file") + "]\n" + a.extracted_content;
          else att++;
        });
        att += (m.files || m.files_v2 || []).length;
        return { role: m.sender === "human" ? "user" : "assistant", text: (text || "").trim(), time: toMs(m.created_at),
          attachments: m.sender === "human" ? att : 0 };
      }).filter(function (m) { return m.text || m.attachments; });
      return { id: conv.uuid || "c" + ci, link: conv.uuid ? "https://claude.ai/chat/" + conv.uuid : null,
        title: conv.name || "Untitled chat", created: toMs(conv.created_at), messages: msgs };
    });
    return { source: "Claude", conversations: convs };
  }

  // ---------------- Gemini (Google Takeout, JSON format) ----------------
  function isGemini(data) {
    if (!Array.isArray(data) || !data.length) return false;
    // Look at the first few entries: some Takeout files start with other products.
    return data.slice(0, 20).some(function (a) {
      return a && (/gemini|bard/i.test(a.header || "") || (Array.isArray(a.products) && a.products.some(function (p) { return /gemini|bard/i.test(p); })));
    });
  }

  // Google's export lists every prompt separately. We group prompts sent
  // within 30 minutes of each other into one "session".
  var SESSION_GAP = 30 * 60 * 1000;

  function stripHtml(h) {
    return h.replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, "\n").replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n").trim();
  }

  // Describes the SHAPE of an export (field names and types only, never the values),
  // so it can be shared safely when a new export format needs support.
  function describe(v, depth) {
    depth = depth || 0;
    if (v === null) return "null";
    if (Array.isArray(v)) return v.length ? "list of " + v.length + " × " + describe(v[0], depth + 1) : "empty list";
    if (typeof v === "object") {
      if (depth >= 4) return "{…}";
      var keys = Object.keys(v).slice(0, 25);
      return "{ " + keys.map(function (k) { return (/^[0-9a-f-]{20,}$/i.test(k) ? "<id>" : k) + ": " + describe(v[k], depth + 1); }).join(", ") + (Object.keys(v).length > 25 ? ", …" : "") + " }";
    }
    return typeof v === "string" ? "text(" + v.length + ")" : typeof v;
  }
  var shapes = [];

  function geminiAttachments(a) {
    var n = 0;
    Object.keys(a).forEach(function (k) {
      if (/attach|image|file/i.test(k) && Array.isArray(a[k])) n += a[k].length;
    });
    return n;
  }

  function parseGemini(data) {
    var prompts = data.filter(function (a) {
      return a && a.title && (/gemini|bard/i.test(a.header || "") || (a.products || []).some(function (p) { return /gemini|bard/i.test(p); }));
    }).map(function (a) {
      var text = String(a.title).replace(/^(Prompted|Asked|You said:?)\s+/i, "");
      // Some exports also carry Gemini's answer as HTML; keep it as plain text if it is there.
      var reply = "";
      [a.safeHtmlItem, a.details, a.subtitles].forEach(function (list) {
        (Array.isArray(list) ? list : []).forEach(function (it) {
          var h = it && (it.html || it.name || it.text);
          if (h && typeof h === "string") reply += stripHtml(h) + "\n";
        });
      });
      var url = typeof a.titleUrl === "string" && /gemini\.google\.com\/(app|share)\//.test(a.titleUrl) ? a.titleUrl : null;
      var att = geminiAttachments(a);
      // Google puts the chat's own address and the uploaded file IDs inside the reply text. Pull them out.
      var um = /https?:\/\/gemini\.google\.com\/app\/[A-Za-z0-9_-]{6,}/.exec(reply);
      if (um) { url = url || um[0]; reply = reply.replace(um[0], ""); }
      var am = /Attached (\d+) files?\.?/i.exec(reply);
      if (am) att = Math.max(att, +am[1]);
      reply = reply.replace(/Attached \d+ files?\.?/gi, "")
        .replace(/^[\s\-•]*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*$/gim, "")
        .replace(/^\s*\.\s*$/gm, "").replace(/\n{3,}/g, "\n\n");
      return { role: "user", text: text, time: toMs(a.time), attachments: att, reply: reply.trim(), url: url };
    }).filter(function (p) { return p.text && !/^(Used|Gave feedback|Created|Selected|Shared|Deleted)\b/i.test(p.text) || p.attachments; });
    prompts.sort(function (a, b) { return (a.time || 0) - (b.time || 0); });

    var convs = [], cur = null;
    prompts.forEach(function (p) {
      var sameChat = cur && p.url && cur.chatUrl && p.url === cur.chatUrl;
      var otherChat = cur && p.url && cur.chatUrl && p.url !== cur.chatUrl;
      if (!cur || otherChat || (!sameChat && (!p.time || !cur.lastTime || p.time - cur.lastTime > SESSION_GAP))) {
        cur = { id: "g" + convs.length, link: "https://myactivity.google.com/product/gemini", title: "", created: p.time,
          messages: [], lastTime: p.time, isSession: true };
        convs.push(cur);
      }
      cur.messages.push({ role: "user", text: p.text, time: p.time, attachments: p.attachments });
      if (p.reply) cur.messages.push({ role: "assistant", text: p.reply, time: p.time });
      if (p.url && !cur.chatUrl) cur.chatUrl = p.url;
      cur.lastTime = p.time;
    });
    convs.forEach(function (c) {
      // A link to Google's My Activity page limited to this session's time window (microseconds).
      var t1 = c.created, t2 = c.lastTime || c.created;
      if (t1) c.activityLink = "https://myactivity.google.com/product/gemini?min=" + (t1 - 120000) * 1000 + "&max=" + (t2 + 120000) * 1000;
      if (c.chatUrl) c.link = c.chatUrl;
      var first = c.messages[0].text || "(image)";
      c.title = first.length > 60 ? first.slice(0, 57) + "…" : first;
      delete c.lastTime;
    });
    convs.reverse(); // newest first, like the Gemini app
    return { source: "Gemini", conversations: convs };
  }

  function parseJSON(data) {
    try { shapes.push(describe(Array.isArray(data) ? data.slice(0, 1) : data)); if (shapes.length > 6) shapes.shift(); } catch (e) { }
    if (data && !Array.isArray(data) && typeof data === "object") {
      if (Array.isArray(data.conversations)) data = data.conversations;
      else if (Array.isArray(data.data)) data = data.data;
      else if (data.uuid && Array.isArray(data.chat_messages)) data = [data];
      else if (data.mapping) data = [data];
    }
    if (isChatGPT(data)) return parseChatGPT(data);
    if (isClaude(data)) return parseClaude(data);
    if (isGemini(data)) return parseGemini(data);
    return null;
  }

  // Text -> JSON. Also accepts "JSON Lines" (one JSON object per line).
  function parseText(t) {
    try { return JSON.parse(t); } catch (e) {
      var lines = t.split(/\r?\n/).filter(function (l) { return l.trim(); });
      try { return lines.map(function (l) { return JSON.parse(l); }); } catch (e2) { throw e; }
    }
  }

  // Claude's new export first gives a small "manifest" file with download links.
  function isManifest(data) {
    return data && !Array.isArray(data) && Array.isArray(data.data_files) &&
      data.data_files.some(function (f) { return f && f.export_url; });
  }

  // If an app gives no title (e.g. "Untitled"), use the first thing you typed.
  function fixTitles(r) {
    r.conversations.forEach(function (c) {
      if (!c.title || /^(untitled|new chat|untitled chat)$/i.test(c.title.trim())) {
        var first = c.messages.filter(function (m) { return m.role === "user" && m.text; })[0];
        var t = first ? first.text.replace(/\s+/g, " ").trim() : "";
        c.title = t ? (t.length > 60 ? t.slice(0, 57) + "…" : t) : "Untitled chat";
        c.untitled = true;
      }
    });
    return r;
  }

  function merge(results) {
    results = results.map(function (r) { return r ? fixTitles(r) : r; });
    var out = { source: "", conversations: [] };
    var sources = [];
    results.forEach(function (r) {
      if (!r) return;
      if (sources.indexOf(r.source) < 0) sources.push(r.source);
      r.conversations.forEach(function (c) { c.source = r.source; out.conversations.push(c); });
    });
    out.source = sources.join(" + ");
    return out;
  }

  // Reads a File object (.zip or .json). Returns a Promise.
  function readFile(file) {
    var name = (file.name || "").toLowerCase();
    if (name.endsWith(".json")) {
      return file.text().then(function (t) {
        var data = parseText(t);
        if (isManifest(data)) {
          var err = new Error("This is Claude's list of download links, not your chats.");
          err.manifest = data.data_files;
          throw err;
        }
        var r = parseJSON(data);
        if (!r) throw new Error("This JSON file doesn't look like a ChatGPT, Claude or Gemini export.");
        return merge([r]);
      });
    }
    if (name.endsWith(".zip")) {
      if (!root.JSZip) return Promise.reject(new Error("ZIP reader not loaded."));
      return root.JSZip.loadAsync(file).then(function (zip) {
        var jsonFiles = [];
        zip.forEach(function (path, entry) {
          if (!entry.dir && /(^|\/)(conversations[^\/]*|MyActivity|activity)\.jsonl?$/i.test(path)) jsonFiles.push(entry);
        });
        if (!jsonFiles.length) {
          var names = Object.keys(zip.files).join(" ");
          if (/metadata|users\.json|projects/i.test(names)) throw new Error("This ZIP has account details but no chats. For Claude, use the file named conversations-000.zip.");
          throw new Error("No conversations file found inside this ZIP. Is it the export from ChatGPT, Claude or Gemini?");
        }
        return Promise.all(jsonFiles.map(function (e) {
          return e.async("string").then(function (t) { try { return parseJSON(parseText(t)); } catch (err) { return null; } });
        })).then(function (results) {
          var merged = merge(results);
          if (!merged.conversations.length) throw new Error("Couldn't read any chats from this ZIP.");
          return merged;
        });
      });
    }
    return Promise.reject(new Error("Please choose the .zip (or conversations.json) file from your AI app's export."));
  }

  // Several files at once (e.g. Claude's two zips, or ChatGPT + Gemini together).
  function readFiles(files) {
    files = Array.prototype.slice.call(files);
    if (files.length === 1) return readFile(files[0]);
    var errors = [];
    return Promise.all(files.map(function (f) {
      return readFile(f).catch(function (e) { errors.push(f.name + ": " + e.message); return null; });
    })).then(function (rs) {
      var ok = rs.filter(Boolean);
      if (!ok.length) { var err = new Error(errors.join(" · ")); throw err; }
      var all = []; ok.forEach(function (r) { all = all.concat(r.conversations); });
      var sources = []; ok.forEach(function (r) { r.source.split(" + ").forEach(function (x) { if (sources.indexOf(x) < 0) sources.push(x); }); });
      return { source: sources.join(" + "), conversations: all };
    });
  }

  var API = { readFile: readFile, readFiles: readFiles, parseJSON: parseJSON, parseText: parseText, merge: merge, shapes: shapes };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.NijtaParse = API;
})(typeof window !== "undefined" ? window : globalThis);
