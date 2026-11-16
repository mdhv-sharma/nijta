/*
 * Nijta: app.js
 * --------------
 * Connects the screen to the engine: file upload -> parse -> scan -> dashboard.
 */
(function () {
  "use strict";
  var D = window.NijtaDetect, P = window.NijtaParse, S = window.NijtaScan, T = window.NijtaTopics;

  var state = { data: null, result: null, mask: false, filter: "all", shown: 25 };
  var $ = function (id) { return document.getElementById(id); };

  var PLURAL = {
    seed: ["Crypto recovery phrase", "Crypto recovery phrases"], social: ["Social profile link", "Social profile links"],
    handle: ["Username / handle", "Usernames / handles"], othername: ["Name of someone you know", "Names of people you know"],
    grades: ["Marks / rank", "Marks / ranks"], ip: ["IP address", "IP addresses"], gps: ["GPS location", "GPS locations"],
    imei: ["Phone IMEI", "Phone IMEIs"], shortnum: ["Unrecognised labelled number", "Unrecognised labelled numbers"],
    t_legal: ["Legal / police matters", "Legal / police matters"],
    doc_image: ["Photo / file of a document", "Photos / files of documents"], pin: ["PIN / passcode", "PINs / passcodes"],
    secretvar: ["Secret in code / config", "Secrets in code / config"], connstr: ["Login link with password", "Login links with password"],
    ssn: ["Social Security number", "Social Security numbers"], iban: ["IBAN", "IBANs"], gstin: ["GSTIN", "GSTINs"],
    crypto: ["Crypto wallet", "Crypto wallets"], abha: ["ABHA health ID", "ABHA health IDs"], uan: ["PF / UAN number", "PF / UAN numbers"],
    genericid: ["Other ID / reference no.", "Other IDs / reference nos."], age: ["Your age", "Ages"],
    longnum: ["Unrecognised long number", "Unrecognised long numbers"],
    t_health: ["Health / medical", "Health / medical"], t_mental: ["Mental health / feeling low", "Mental health / feeling low"],
    t_relationship: ["Relationships / breakup", "Relationships / breakup"], t_family: ["Family problems", "Family problems"],
    t_money: ["Money trouble", "Money trouble"], t_beliefs: ["Religion / caste / politics", "Religion / caste / politics"],
    t_sexual: ["Sexual / intimate topics", "Sexual / intimate topics"], t_risky: ["Risky / embarrassing requests", "Risky / embarrassing requests"],
    ai_other: ["Other personal detail", "Other personal details"],
    aadhaar: ["Aadhaar number", "Aadhaar numbers"], vid: ["Aadhaar Virtual ID", "Aadhaar Virtual IDs"],
    city: ["City / area", "Cities / areas"], name: ["Your full name", "Names"], institution: ["College / workplace", "Colleges / workplaces"], pan: ["PAN card", "PAN cards"], passport: ["Passport number", "Passport numbers"],
    voter: ["Voter ID", "Voter IDs"], dl: ["Driving licence", "Driving licences"], vehicle: ["Vehicle number", "Vehicle numbers"],
    card: ["Bank card", "Bank cards"], cvv: ["Card CVV / PIN", "Card CVVs / PINs"], ifsc: ["IFSC code", "IFSC codes"],
    bank: ["Bank account", "Bank accounts"], upi: ["UPI ID", "UPI IDs"], money: ["Money detail", "Money details"],
    phone: ["Phone number", "Phone numbers"], email: ["Email address", "Email addresses"], dob: ["Date of birth", "Dates of birth"],
    address: ["Address", "Addresses"], pincode: ["PIN code", "PIN codes"], password: ["Password", "Passwords"],
    otp: ["OTP", "OTPs"], apikey: ["API key", "API keys"], privatekey: ["Private key", "Private keys"]
  };
  var ICON = { seed: "🗝️", social: "🔗", handle: "@", othername: "👤", grades: "📝", ip: "🌐", gps: "📍", imei: "📱", shortnum: "❓", t_legal: "⚖️", doc_image: "📷", pin: "🔢", secretvar: "🗝️", connstr: "🗝️", ssn: "🪪", iban: "🏦", gstin: "🧾", crypto: "🪙", abha: "🩺",
    uan: "🪪", genericid: "🔖", age: "🎂", longnum: "❓", t_health: "🩺", t_mental: "🧠", t_relationship: "💔", t_family: "🏠", t_money: "💸", t_beliefs: "🕊️", t_sexual: "🔞", t_risky: "⚠️", ai_other: "🤖", name: "🧑", institution: "🎓", vid: "🪪", city: "🏙️", aadhaar: "🪪", pan: "🪪", passport: "🛂", voter: "🗳️", dl: "🚗", vehicle: "🏍️", card: "💳", cvv: "💳",
    ifsc: "🏦", bank: "🏦", upi: "📲", money: "💰", phone: "📞", email: "✉️", dob: "🎂", address: "🏠", pincode: "📍",
    password: "🔑", otp: "🔢", apikey: "🗝️", privatekey: "🗝️" };
  var REL = { mother: "Mother", father: "Father", brother: "Brother", sister: "Sister", spouse: "Spouse", child: "Child",
    relative: "Relative", friend: "Friend", partner: "Partner", colleague: "Colleague", "someone else": "Someone else" };

  function plural(type, n) { var p = PLURAL[type] || [type, type + "s"]; return n === 1 ? p[0] : p[1]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtMonth(ms) { return ms ? new Date(ms).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "unknown date"; }
  function fmtDate(ms) { return ms ? new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""; }
  function fmtDateTime(ms) {
    return ms ? new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "unknown time";
  }
  function appName(src) { return src || "the AI app"; }
  function realLink(link) { return link && !(state.data && state.data.isDemo) ? link : null; }
  // ChatGPT/Claude: one link to the exact chat.
  // Gemini: Google's export has no chat links, so Nijta offers (1) the exact chat if the export
  // happens to include its address, else (2) My Activity limited to that session's time,
  // (3) "Copy prompt" to paste into the search box in Gemini's sidebar, (4) the Gemini app.
  function linkButtonsFor(conv, msgIndex) {
    if (!conv) return "";
    if (state.data && state.data.isDemo) {
      // Demo: open the simulated chat page, so "go to the chat and delete it" can be shown live.
      var ci = state.data.conversations.indexOf(conv);
      return '<a class="btn small" target="_blank" rel="noopener" href="demo/chat.html?i=' + ci + (msgIndex >= 0 ? "&m=" + msgIndex : "") + '" title="Opens a simulated chat page (demo)">Go to chat ↗</a>';
    }
    var src = conv.source || (state.result && state.result.source) || "";
    var A = function (href, label, tip) { return '<a class="btn small" target="_blank" rel="noopener" href="' + esc(href) + '"' + (tip ? ' title="' + esc(tip) + '"' : "") + ">" + esc(label) + " ↗</a>"; };
    if (conv.isSession) {
      if (conv.chatUrl) return A(conv.chatUrl, "Open this chat");
      var first = (conv.messages.filter(function (m) { return m.role === "user" && m.text; })[0] || {}).text || "";
      return (conv.activityLink ? A(conv.activityLink, "My Activity (this time)", "Opens Google's activity page limited to the minutes of this session") : "") +
        (first ? '<button class="btn small copy-btn" data-copy="' + esc(first.slice(0, 80)) + '" title="Then paste it into the search box in Gemini\u2019s sidebar to jump to the chat">Copy prompt</button>' : "") +
        A("https://gemini.google.com/app", "Gemini app");
    }
    return conv.link ? A(conv.link, "Open in " + appName(src)) : "";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".copy-btn");
    if (!b) return;
    var done = function () { var t = b.textContent; b.textContent = "Copied ✓"; setTimeout(function () { b.textContent = t; }, 1500); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(done, function () { window.prompt("Copy this:", b.dataset.copy); }); }
    catch (err) { var ta = document.createElement("textarea"); ta.value = b.dataset.copy; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e2) { } ta.remove(); }
  });
  function convWord(plural) { var s = state.result && state.result.stats.sessions; return s ? (plural ? "sessions" : "session") : (plural ? "chats" : "chat"); }
  var deleted = {};
  try { deleted = JSON.parse(localStorage.getItem("nijta-deleted") || "{}"); } catch (e) { deleted = {}; }
  function delKey(conv) { return (conv.source || "") + "|" + conv.id + "|" + (conv.created || ""); }
  function reloadDeleted() {
    var before = JSON.stringify(deleted);
    try { deleted = JSON.parse(localStorage.getItem("nijta-deleted") || "{}"); } catch (e) { }
    if (state.result && JSON.stringify(deleted) !== before && typeof renderDeleteList === "function") renderDeleteList();
  }
  window.addEventListener("storage", function (e) { if (e.key === "nijta-deleted") reloadDeleted(); });
  window.addEventListener("focus", reloadDeleted);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) reloadDeleted(); });
  function saveDeleted() { try { localStorage.setItem("nijta-deleted", JSON.stringify(deleted)); } catch (e) { } }
  function shown(f) { return state.mask ? D.mask(f) : f.value; }
  function ownerBadge(u) {
    if (u.owner === "other") return '<span class="badge other">' + esc(REL[u.relation] || "Someone else") + "’s data</span>";
    if (u.owner === "self") return '<span class="badge self">Yours</span>';
    return '<span class="badge unknown">Owner unclear</span>';
  }

  // ---------------- Tabs ----------------
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { showTab(t.dataset.tab); });
  });
  function showTab(name) {
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t.dataset.tab === name); });
    document.querySelectorAll(".tabpanel").forEach(function (p) { p.hidden = p.id !== "tab-" + name; });
    window.scrollTo(0, 0);
  }

  // ---------------- Mask toggle ----------------
  try { state.mask = localStorage.getItem("nijta-mask") === "1"; } catch (e) { }
  $("maskToggle").checked = state.mask;
  $("maskToggle").addEventListener("change", function () {
    state.mask = this.checked;
    try { localStorage.setItem("nijta-mask", state.mask ? "1" : "0"); } catch (e) { }
    if (state.result) { renderOthers(); renderList(); }
    if (!$("chatModal").hidden && state.openChat) openChat(state.openChat.conv, state.openChat.focus);
  });

  // ---------------- Upload ----------------
  var dz = $("dropZone");
  ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("drag"); }); });
  dz.addEventListener("drop", function (e) { if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files); });
  $("fileInput").addEventListener("change", function () { if (this.files.length) loadFile(this.files); this.value = ""; });
  $("demoBtn").addEventListener("click", function () {
    var demo = JSON.parse(JSON.stringify(window.NIJTA_DEMO));
    var data = P.merge([P.parseJSON(demo.chatgpt), P.parseJSON(demo.claude), P.parseJSON(demo.gemini)]);
    data.isDemo = true;
    runScan(data);
  });
  $("againBtn").addEventListener("click", function () { setView("upload"); });

  function setView(v) {
    $("uploadView").hidden = v !== "upload";
    $("progressView").hidden = v !== "progress";
    $("resultsView").hidden = v !== "results";
    window.scrollTo(0, 0);
  }
  function showError(msg, html) { var b = $("errorBox"); if (html) b.innerHTML = html; else b.textContent = msg; b.hidden = !msg && !html; }

  function loadFile(files) {
    showError("");
    setView("progress");
    $("progressText").textContent = "Opening " + (files.length > 1 ? files.length + " files" : files[0].name) + "…";
    P.readFiles(files).then(runScan).catch(function (err) {
      setView("upload");
      if (err && err.manifest) {
        var conv = err.manifest.filter(function (f) { return /conversation/i.test(f.category || f.filename || ""); });
        var list = (conv.length ? conv : err.manifest);
        showError(null, "<b>📋 This is Claude's list of download links, not your chats.</b><br>" +
          "Click the button below while you're logged into claude.ai. It downloads <b>conversations-000.zip</b>. Then drop <i>that</i> file here.<br>" +
          list.map(function (f) {
            return '<a class="btn small" style="margin:8px 8px 0 0" target="_blank" rel="noopener" href="' + esc(f.export_url) + '">Download ' + esc(f.filename || "file") + " ↗</a>";
          }).join("") +
          '<div class="small" style="margin-top:8px">Links expire 24 hours after Claude creates them. If one fails, request the export again. Don’t share these links with anyone.</div>');
        return;
      }
      showError("⚠️ " + (err && err.message ? err.message : "Couldn't read that file."));
    });
  }

  function runScan(data) {
    setView("progress");
    state.data = data;
    S.scanAll(data, function (p) {
      $("progressFill").style.width = Math.round(p * 100) + "%";
      $("progressText").textContent = Math.round(p * 100) + "% of messages checked";
    }, { maximum: state.maximum }).then(function (res) {
      state.result = res; state.filter = "all"; state.shown = 25;
      $("searchInput").value = ""; $("searchOut").hidden = true;
      renderResults();
      setView("results");
    });
  }

  // ---------------- Results ----------------
  function renderResults() {
    var r = state.result, ex = r.exposure, st = r.stats;
    $("scoreNum").textContent = ex.score;
    var ring = $("ringFg");
    ring.style.strokeDashoffset = 326.7;
    requestAnimationFrame(function () { ring.style.strokeDashoffset = 326.7 * (1 - ex.score / 100); });
    ring.style.stroke = ex.level === "High" ? "var(--critical)" : ex.level === "Medium" ? "var(--serious)" : "var(--good)";
    var lb = $("levelBadge");
    lb.className = "level " + ex.level;
    lb.textContent = (ex.level === "High" ? "⚠ High exposure" : ex.level === "Medium" ? "● Medium exposure" : ex.level === "Low" ? "✓ Low exposure" : "✓ Nothing found");

    var n = r.items.length;
    $("headline").textContent = n
      ? "Found " + n + " personal or sensitive item" + (n > 1 ? "s" : "") + " in " + st.chatsWithData + " of your " + st.conversations + " " + convWord(true)
      : "No personal data found in your " + st.conversations + " " + convWord(true);
    var sub = "Checked " + st.userMessages + " messages you sent to " + (r.source || "AI") + (st.totalMessages > st.userMessages ? " and the AI's replies" : "");
    if (st.first) sub += " between " + fmtMonth(st.first) + " and " + fmtMonth(st.last);
    sub += ".";
    if (r.others.length) sub += " " + r.others.length + " of these belong to other people.";
    if (st.sessions) sub += " Gemini's export lists prompts one by one, so Nijta grouped prompts sent within 30 minutes into sessions.";
    if (state.data.isDemo) sub += " (Demo data: all values are fake.)";
    $("subline").textContent = sub;

    [["Fraud", r.risk.fraud], ["Sens", r.risk.sensitive]].forEach(function (x) {
      var sc = x[1].score, bar = $("risk" + x[0] + "Bar");
      $("risk" + x[0]).textContent = sc + "/100 · " + x[1].level;
      bar.style.background = x[1].level === "High" ? "var(--critical)" : x[1].level === "Medium" ? "var(--serious)" : "var(--good)";
      bar.style.width = "0"; requestAnimationFrame(function () { bar.style.width = sc + "%"; });
    });
    renderTypeCards();
    renderOthers();
    renderTimeline();
    renderFilters();
    renderList();
    renderImages();
    renderDeleteList();
    renderNextSteps();
    $("checkOut").innerHTML = "";
  }

  function renderTypeCards() {
    var r = state.result;
    var html = r.byType.map(function (t, i) {
      return '<button class="type-card' + (t.weight >= 10 ? " risk-top" : "") + '" data-type="' + t.type + '">' +
        '<span class="tc-icon">' + (ICON[t.type] || "•") + "</span>" +
        '<div class="tc-num">' + t.count + "</div>" +
        '<div class="tc-label">' + esc(plural(t.type, t.count)) + (t.category === "sensitive" ? '<br><span class="muted small">' + convWord(t.count > 1) + "</span>" : "") + "</div></button>";
    }).join("");
    $("typeCards").innerHTML = html || '<p class="muted">Nothing found. 🎉</p>';
    $("typeCards").querySelectorAll(".type-card").forEach(function (b) {
      b.addEventListener("click", function () {
        state.filter = state.filter === "type:" + b.dataset.type ? "all" : "type:" + b.dataset.type;
        state.shown = 25; renderFilters(); renderList();
        $("filters").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function renderCombo() {
    var c = state.result.identityCombo, box = $("comboBox");
    if (!c) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = "<b>🧩 Together, your " + esc(c.join(" + ")) + " can identify you,</b> even without any ID number. " +
      "Anyone who sees these chats knows exactly who you are. This is called <i>re-identification</i>.";
  }

  function renderOthers() {
    renderCombo();
    var o = state.result.others, box = $("othersBox");
    if (!o.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = "<b>👥 You also shared other people’s data.</b> They never agreed to this." +
      "<ul>" + o.map(function (u) {
        return "<li>" + esc(REL[u.relation] || "Someone else") + ": " + esc(PLURAL[u.type] ? PLURAL[u.type][0] : u.label) +
          ' <span class="muted">(' + esc(shown(u.occurrences[0])) + ")</span></li>";
      }).join("") + "</ul>";
  }

  // Single-series bar chart: one hue, thin bars, rounded top, hover tooltip, table view.
  function renderTimeline() {
    var tl = state.result.timeline, keys = Object.keys(tl).sort(), el = $("timeline");
    if (!keys.length) { el.innerHTML = '<p class="muted small">No dates available.</p>'; $("timelineTable").innerHTML = ""; return; }
    // Fill in empty months between first and last.
    var months = [], y = +keys[0].slice(0, 4), m = +keys[0].slice(5), end = keys[keys.length - 1];
    while (true) {
      var k = y + "-" + String(m).padStart(2, "0");
      months.push(k);
      if (k === end || months.length > 240) break;
      m++; if (m > 12) { m = 1; y++; }
    }
    var max = Math.max.apply(null, months.map(function (k) { return tl[k] || 0; }));
    var W = 900, H = 190, padL = 28, padB = 26, padT = 10, plotW = W - padL - 6, plotH = H - padB - padT;
    var slot = plotW / months.length, bw = Math.max(3, Math.min(26, slot * 0.6));
    var ticks = max <= 4 ? max : 4;
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Findings per month">';
    for (var t = 0; t <= ticks; t++) {
      var v = Math.round(max * t / (ticks || 1)), yy = padT + plotH - plotH * v / (max || 1);
      svg += '<line class="axis" x1="' + padL + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '" stroke-width="1"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + v + "</text>";
    }
    var every = Math.ceil(months.length / 10);
    months.forEach(function (k, i) {
      var v = tl[k] || 0, h = plotH * v / (max || 1), x = padL + slot * i + (slot - bw) / 2, yTop = padT + plotH - h;
      var label = new Date(+k.slice(0, 4), +k.slice(5) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      svg += '<rect class="bar-hit" x="' + (padL + slot * i) + '" y="' + padT + '" width="' + slot + '" height="' + plotH + '" data-tip="' + label + ": " + v + " item" + (v === 1 ? "" : "s") + '"/>';
      if (v > 0) {
        var r = Math.min(4, bw / 2, h);
        svg += '<path class="bar" d="M' + x + "," + (padT + plotH) + "V" + (yTop + r) + "Q" + x + "," + yTop + " " + (x + r) + "," + yTop +
          "H" + (x + bw - r) + "Q" + (x + bw) + "," + yTop + " " + (x + bw) + "," + (yTop + r) + "V" + (padT + plotH) + 'Z"/>';
      }
      if (i % every === 0) svg += '<text x="' + (padL + slot * i + slot / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + label + "</text>";
    });
    svg += "</svg>";
    el.innerHTML = svg;
    var tip = $("tooltip");
    el.querySelectorAll(".bar-hit").forEach(function (h) {
      h.addEventListener("mousemove", function (e) { tip.hidden = false; tip.textContent = h.dataset.tip; tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY - 30) + "px"; });
      h.addEventListener("mouseleave", function () { tip.hidden = true; });
      h.addEventListener("click", function (e) { tip.hidden = false; tip.textContent = h.dataset.tip; tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY - 30) + "px"; setTimeout(function () { tip.hidden = true; }, 1500); });
    });
    $("timelineTable").innerHTML = '<table class="tl-table"><tr><th>Month</th><th>Items shared</th></tr>' +
      keys.map(function (k) { return "<tr><td>" + new Date(+k.slice(0, 4), +k.slice(5) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) + "</td><td>" + tl[k] + "</td></tr>"; }).join("") + "</table>";
  }
  $("tableToggle").addEventListener("click", function () {
    var t = $("timelineTable"), showTable = t.hidden;
    t.hidden = !showTable; $("timeline").hidden = showTable;
    this.textContent = showTable ? "Show as chart" : "Show as table";
  });

  function renderFilters() {
    var r = state.result, chips = [["all", "All (" + r.items.length + ")"]];
    Object.keys(D.CATEGORIES).forEach(function (c) {
      if (r.byCategory[c]) chips.push(["cat:" + c, D.CATEGORIES[c].icon + " " + D.CATEGORIES[c].label + " (" + r.byCategory[c] + ")"]);
    });
    if (r.others.length) chips.push(["others", "👥 Other people’s (" + r.others.length + ")"]);
    if (state.filter.indexOf("type:") === 0) {
      var t = state.filter.slice(5);
      chips.push([state.filter, (ICON[t] || "") + " " + plural(t, 2) + " ✕"]);
    }
    $("filters").innerHTML = chips.map(function (c) {
      return '<button class="chip' + (state.filter === c[0] ? " active" : "") + '" data-f="' + c[0] + '">' + esc(c[1]) + "</button>";
    }).join("");
    $("filters").querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        state.filter = (state.filter === b.dataset.f && b.dataset.f.indexOf("type:") === 0) ? "all" : b.dataset.f;
        state.shown = 25; renderFilters(); renderList();
      });
    });
    document.querySelectorAll(".type-card").forEach(function (c) { c.classList.toggle("selected", state.filter === "type:" + c.dataset.type); });
  }

  function filteredItems() {
    var f = state.filter;
    return state.result.items.filter(function (u) {
      if (f === "all") return true;
      if (f === "others") return u.owner === "other";
      if (f.indexOf("cat:") === 0) return u.category === f.slice(4);
      if (f.indexOf("type:") === 0) return u.type === f.slice(5);
      return true;
    });
  }

  function renderList() {
    var items = filteredItems(), list = $("findingList");
    $("filterInfo").textContent = items.length ? "· " + items.length + " item" + (items.length > 1 ? "s" : "") : "";
    var html = items.slice(0, state.shown).map(function (u, i) {
      var f = u.occurrences[0];
      var times = u.occurrences.length > 1 ? " · mentioned " + u.occurrences.length + " times" : "";
      return '<div class="finding">' +
        '<div><div class="f-top"><span>' + (ICON[u.type] || "•") + '</span><span class="f-label">' + esc(PLURAL[u.type] ? PLURAL[u.type][0] : u.label) + "</span>" +
        ownerBadge(u) +
        (u.occurrences.every(function (o) { return o.fromAI; }) ? '<span class="badge aireply">In AI’s reply</span>'
          : u.occurrences.some(function (o) { return o.fromAI; }) ? '<span class="badge aireply">Also repeated in AI’s reply</span>' : "") +
        (u.confidence < 0.5 ? '<span class="badge possible">Possible</span>' : "") +
        '<span class="badge conf" title="How sure Nijta is">' + Math.round(u.confidence * 100) + "% sure</span></div>" +
        '<div style="margin-top:6px"><span class="f-value' + (/^t_/.test(u.type) ? " quote" : "") + '">' + esc(/^t_/.test(u.type) && !state.mask ? "“" + f.value + "”" : shown(f)) + "</span></div>" +
        (function () { var o = u.occurrences.filter(function (x) { return x.note; })[0]; return o ? '<div class="f-note">ℹ️ ' + esc(o.note) + "</div>" : ""; })() +
        '<div class="f-meta">' + esc(appName(f.source)) + " · " + convWord(false) + " “" + esc(f.convTitle) + "” · " + esc(fmtDateTime(f.time)) + esc(times) + "</div></div>" +
        '<div class="finding-actions"><button class="btn small open-chat" data-conv="' + f.conv + '" data-key="' + esc(u.key) + '">View</button>' +
        linkButtonsFor(state.data.conversations[f.conv], f.msg) +
        "</div></div>";
    }).join("");
    if (!items.length) html = '<p class="muted">Nothing in this filter.</p>';
    if (items.length > state.shown) html += '<div class="more"><button class="btn" id="moreBtn">Show ' + Math.min(25, items.length - state.shown) + " more</button></div>";
    list.innerHTML = html;
    list.querySelectorAll(".open-chat").forEach(function (b) {
      b.addEventListener("click", function () { openChat(+b.dataset.conv, b.dataset.key); });
    });
    var more = $("moreBtn");
    if (more) more.addEventListener("click", function () { state.shown += 25; renderList(); });
  }

  function renderNextSteps() {
    var r = state.result, steps = [];
    var secrets = r.items.filter(function (u) { return u.category === "secret"; });
    if (secrets.length) {
      steps.push({ urgent: true, icon: "🔑", title: "Change these passwords and revoke these keys today",
        text: "You pasted " + secrets.length + " secret" + (secrets.length > 1 ? "s" : "") + " (" +
          secrets.map(function (u) { return PLURAL[u.type][0]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(", ") +
          "). Anything typed into a chatbot should be treated as leaked." });
    }
    var hi = r.items.filter(function (u) { return u.weight >= 8; });
    if (hi.length) {
      var titles = {};
      hi.forEach(function (u) { u.occurrences.forEach(function (f) { titles[f.convTitle] = 1; }); });
      var t = Object.keys(titles);
      steps.push({ urgent: false, icon: "🗑️", title: "Delete the " + t.length + " " + convWord(t.length > 1) + " with ID or bank details",
        text: "Use the “Chats to delete” checklist above: it has a direct link to each one." });
    }
    if (r.others.length) {
      steps.push({ urgent: false, icon: "👥", title: "Remove other people’s data",
        text: "You shared data of " + r.others.length + " other " + (r.others.length > 1 ? "people" : "person") + ". Delete those chats and avoid sharing family or friends’ details with AI." });
    }
    steps.push({ urgent: false, icon: "⚙️", title: "Turn off “use my chats for training”", text: "Most AI apps train on your chats by default. The ‘Understand it’ tab will show exactly where to switch it off (coming next)." });
    steps.push({ urgent: false, icon: "✉️", title: "Ask the company to delete your data", text: "India’s DPDP Act gives you the right to request erasure. The ‘Take it back’ tab will draft the request (coming next)." });
    $("nextSteps").innerHTML = steps.map(function (s) {
      return '<div class="step' + (s.urgent ? " urgent" : "") + '"><div class="s-icon">' + s.icon + "</div><div><h4>" + esc(s.title) + "</h4><p>" + esc(s.text) + "</p></div></div>";
    }).join("");
  }

  // ---------------- Images the scanner can't read ----------------
  function renderImages() {
    var st = state.result.stats, box = $("imagesBox");
    if (!st.attachments) { box.hidden = true; return; }
    box.hidden = false;
    var convs = state.data.conversations;
    box.innerHTML = "<b>📷 You uploaded " + st.attachments + " image" + (st.attachments > 1 ? "s/files" : "/file") + " in " + st.attachmentChats.length + " " + convWord(st.attachmentChats.length > 1) +
      ".</b> Nijta can't read inside pictures, and AI exports often don't include them. If any was a photo of an Aadhaar, licence, PAN or bank card, delete those " + convWord(true) + " too. They are marked 📷 in the checklist below.";
  }

  // ---------------- Delete checklist ----------------
  function renderDeleteList() {
    var r = state.result, convs = state.data.conversations, byConv = {};
    r.findings.forEach(function (f) {
      byConv[f.conv] = byConv[f.conv] || { conv: f.conv, types: {}, maxW: 0, images: 0 };
      byConv[f.conv].types[f.type] = 1;
      byConv[f.conv].maxW = Math.max(byConv[f.conv].maxW, f.weight);
    });
    r.stats.attachmentChats.forEach(function (a) {
      byConv[a.conv] = byConv[a.conv] || { conv: a.conv, types: {}, maxW: 6, images: 0 };
      byConv[a.conv].images = a.count;
      byConv[a.conv].maxW = Math.max(byConv[a.conv].maxW, 6);
    });
    var rows = Object.keys(byConv).map(function (k) { return byConv[k]; })
      .sort(function (a, b) { return b.maxW - a.maxW || (convs[b.conv].created || 0) - (convs[a.conv].created || 0); });
    var done = rows.filter(function (x) { return deleted[delKey(convs[x.conv])]; }).length;
    $("deleteProgress").textContent = rows.length ? "· " + done + " of " + rows.length + " done" : "";
    if (!rows.length) { $("deleteList").innerHTML = '<p class="muted">Nothing to delete. 🎉</p>'; return; }
    $("deleteList").innerHTML = rows.map(function (x) {
      var c = convs[x.conv], k = delKey(c), isDone = !!deleted[k], link = realLink(c.link);
      var tags = Object.keys(x.types).map(function (t) {
        return '<span class="tag' + ((PLURAL[t] && D.RULES.some(function (rr) { return rr.id === t && rr.weight >= 8; })) ? " hi" : "") + '">' + (ICON[t] || "") + " " + esc(PLURAL[t] ? PLURAL[t][0] : t) + "</span>";
      }).join("") + (x.images ? '<span class="tag">📷 ' + x.images + " image" + (x.images > 1 ? "s" : "") + "</span>" : "");
      var gemTip = "";
      return '<div class="del-item' + (isDone ? " done" : "") + '">' +
        '<input type="checkbox" class="del-check" data-k="' + esc(k) + '"' + (isDone ? " checked" : "") + ' aria-label="Mark as deleted">' +
        '<div><div class="del-title">' + esc(c.title) + '</div><div class="del-meta">' + esc(appName(c.source) + " · " + fmtDateTime(c.created) + (c.messages.length > 1 && c.isSession ? " · " + c.messages.length + " prompts" : "") + gemTip) + "</div>" +
        '<div class="del-tags">' + tags + "</div></div>" +
        '<div class="del-actions"><button class="btn small open-chat" data-conv="' + x.conv + '">View</button>' +
        linkButtonsFor(c) +
        "</div></div>";
    }).join("");
    $("deleteList").querySelectorAll(".del-check").forEach(function (cb) {
      cb.addEventListener("change", function () {
        if (cb.checked) deleted[cb.dataset.k] = Date.now(); else delete deleted[cb.dataset.k];
        saveDeleted(); renderDeleteList();
      });
    });
    if (/Claude/.test(state.result.source)) {
      $("deleteList").insertAdjacentHTML("beforeend", '<p class="muted small">If Claude says “That chat is no longer available”, the chat was already deleted or comes from another Claude feature that the website can\u2019t open. Use <b>View</b> to read it here.</p>');
    }
    $("deleteList").querySelectorAll(".open-chat").forEach(function (b) {
      b.addEventListener("click", function () { openChat(+b.dataset.conv, null); });
    });
  }

  // ---------------- "Why wasn't this found?" checker ----------------
  $("checkBtn").addEventListener("click", function () {
    var text = $("checkInput").value, out = $("checkOut");
    if (!text.trim()) { out.innerHTML = ""; return; }
    var r = D.explain(text), html = '<div class="check-result">';
    if (r.found.length) {
      html += '<div class="ok"><b>✓ Nijta finds:</b></div><ul>' + r.found.map(function (f) {
        return "<li>" + esc(PLURAL[f.type] ? PLURAL[f.type][0] : f.label) + ": <code>" + esc(state.mask ? D.mask(f) : f.value) + "</code> (" + Math.round(f.confidence * 100) + "% sure)" +
          (f.note ? " <span class='hint'>" + esc(f.note) + "</span>" : "") + "</li>";
      }).join("") + "</ul>";
    } else html += "<div><b>Nijta finds nothing in this text.</b></div>";
    if (r.hints.length) html += '<div class="hint"><b>Why something may be missed:</b></div><ul>' + r.hints.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>";
    if (r.shapes.length) html += '<div class="muted small">Safe pattern to share with your team (A = letter, 9 = digit): ' + r.shapes.map(function (s) { return "<code>" + esc(s) + "</code>"; }).join(" ") + "</div>";
    out.innerHTML = html + "</div>";
  });

  // ---------------- Chat viewer ----------------
  function highlight(text, finds, focusKey) {
    var out = "", pos = 0;
    finds.filter(function (f) { return f.end > f.start; }).sort(function (a, b) { return a.start - b.start; }).forEach(function (f) {
      if (f.start < pos) return;
      out += esc(text.slice(pos, f.start));
      var isFocus = D.normalise(f) === focusKey;
      out += '<mark class="hit' + (isFocus ? " focus" : "") + '" title="' + esc(f.label) + '">' + esc(state.mask ? D.mask(f) : text.slice(f.start, f.end)) + "</mark>";
      pos = f.end;
    });
    return out + esc(text.slice(pos));
  }

  function openChat(convIndex, focusKey, jumpTo) {
    if (jumpTo === undefined) jumpTo = -1;
    state.openChat = { conv: convIndex, focus: focusKey };
    var conv = state.data.conversations[convIndex];
    var finds = state.result.findings.filter(function (f) { return f.conv === convIndex; });
    $("chatTitle").textContent = conv.title;
    var link = realLink(conv.link);
    $("chatMeta").innerHTML = esc((conv.source || state.result.source || "") + " · " + fmtDateTime(conv.created)) +
      (link && !conv.isSession && !state.data.isDemo ? ' · <a target="_blank" rel="noopener" href="' + esc(link) + '">Open in ' + esc(appName(conv.source || state.result.source)) + " ↗</a>" : "") +
      ((conv.isSession || state.data.isDemo) ? " · " + linkButtonsFor(conv) : "");
    $("chatBody").innerHTML = conv.messages.map(function (m, mi) {
      var mf = finds.filter(function (f) { return f.msg === mi; });
      var body = (m.role === "user" || mf.length || mi === jumpTo) ? highlight(m.text, mf, focusKey) : esc(m.text.length > 1200 ? m.text.slice(0, 1200) + "…" : m.text);
      var att = m.attachments ? '<div class="att">📷 ' + m.attachments + " image/file uploaded. Nijta can't see inside it</div>" : "";
      var when = conv.isSession && m.time ? " · " + new Date(m.time).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";
      return '<div class="msg ' + m.role + (mi === jumpTo ? " flash" : "") + '" data-mi="' + mi + '"><div class="who">' + (m.role === "user" ? "You" : "AI") + when + "</div>" + att + body + "</div>";
    }).join("");
    $("chatModal").hidden = false;
    var focus = $("chatBody").querySelector("mark.focus") || $("chatBody").querySelector(".msg.flash");
    if (focus) focus.scrollIntoView({ block: "center" });
  }
  function closeChat() { $("chatModal").hidden = true; state.openChat = null; }
  $("closeChat").addEventListener("click", closeChat);
  $("chatModal").addEventListener("click", function (e) { if (e.target === this) closeChat(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeChat(); });

  // ---------------- Maximum sensitivity + export structure ----------------
  try { state.maximum = localStorage.getItem("nijta-max") === "1"; } catch (e) { }
  $("maxToggle").checked = !!state.maximum;
  $("maxToggle").addEventListener("change", function () {
    state.maximum = this.checked;
    try { localStorage.setItem("nijta-max", state.maximum ? "1" : "0"); } catch (e) { }
    if (state.data) runScan(state.data);
  });
  $("shapeBtn").addEventListener("click", function () {
    var o = $("shapeOut");
    o.hidden = false;
    o.textContent = P.shapes.length ? P.shapes.join("\n\n") : "Load an export first (demo data has no file structure to show).";
  });

  // ---------------- Search across every chat (the safety net) ----------------
  var searchTimer = null;
  function runSearch() {
    var q = $("searchInput").value.trim(), out = $("searchOut");
    if (q.length < 2 || !state.data) { out.hidden = true; out.innerHTML = ""; return; }
    var ql = q.toLowerCase(), qd = q.replace(/\D/g, ""), useDigits = qd.length >= 4 && qd.length >= q.replace(/\s/g, "").length - 3;
    var hits = [], total = 0;
    state.data.conversations.forEach(function (c, ci) {
      c.messages.forEach(function (m, mi) {
        if (!m.text) return;
        var at = m.text.toLowerCase().indexOf(ql), len = q.length;
        if (at < 0 && useDigits) {
          // "9876543210" should also find "98765 43210" and "987-654-3210".
          var map = [], digits = "";
          for (var i = 0; i < m.text.length; i++) { var ch = m.text[i]; if (ch >= "0" && ch <= "9") { digits += ch; map.push(i); } }
          var d = digits.indexOf(qd);
          if (d >= 0) { at = map[d]; len = map[d + qd.length - 1] - at + 1; }
        }
        if (at < 0) return;
        total++;
        if (hits.length < 60) hits.push({ ci: ci, mi: mi, at: at, len: len, m: m, c: c });
      });
    });
    out.hidden = false;
    if (!total) { out.innerHTML = '<p class="muted small">No message contains “' + esc(q) + "”. Nijta searched every message you sent and every AI reply in this export.</p>"; return; }
    out.innerHTML = '<div class="muted small" style="padding:4px 0">' + total + " message" + (total > 1 ? "s" : "") + " contain “" + esc(q) + "”" + (total > 60 ? " (showing the first 60)" : "") + "</div>" +
      hits.map(function (h) {
        var t = h.m.text, s = Math.max(0, h.at - 50), e = Math.min(t.length, h.at + h.len + 60);
        var snip = state.mask ? '<span class="muted">(text hidden while Mask is on)</span>'
          : (s > 0 ? "…" : "") + esc(t.slice(s, h.at)) + "<mark>" + esc(t.slice(h.at, h.at + h.len)) + "</mark>" + esc(t.slice(h.at + h.len, e)) + (e < t.length ? "…" : "");
        return '<div class="s-row"><div><div class="s-snip">' + snip + '</div><div class="f-meta">' + (h.m.role === "user" ? "You" : "AI’s reply") + " · " +
          esc(appName(h.c.source)) + " · “" + esc(h.c.title) + "” · " + esc(fmtDateTime(h.m.time || h.c.created)) + "</div></div>" +
          '<button class="btn small s-view" data-c="' + h.ci + '" data-m="' + h.mi + '">View</button></div>';
      }).join("");
    out.querySelectorAll(".s-view").forEach(function (b) {
      b.addEventListener("click", function () { openChat(+b.dataset.c, null, +b.dataset.m); });
    });
  }
  $("searchInput").addEventListener("input", function () { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 200); });

  // ---------------- Report (PDF through the browser's print window; values are masked) ----------------
  $("reportBtn").addEventListener("click", function () {
    var was = state.mask;
    state.mask = true; renderOthers(); renderList();
    window.print();
    state.mask = was; renderOthers(); renderList();
  });

  // ---------------- Offline support (installable app) ----------------
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () { });
  }

  // Expose for testing
  window.NijtaApp = { state: state, runScan: runScan, showTab: showTab };
})();
