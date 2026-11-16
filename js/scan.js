/*
 * Nijta: scan.js
 * ---------------
 * Runs the detectors over every message YOU sent to the AI and builds the
 * numbers shown on the dashboard.
 */
(function (root) {
  "use strict";
  var D = root.NijtaDetect || (typeof require !== "undefined" ? require("./detectors.js") : null);
  var T = root.NijtaTopics || (typeof require !== "undefined" ? require("./topics.js") : null);

  // Which finding types are trusted inside an AI reply (exact numbers only).
  var AI_REPLY_TYPES = { aadhaar: 1, vid: 1, pan: 1, passport: 1, voter: 1, dl: 1, card: 1, cvv: 1, ifsc: 1, bank: 1, upi: 1, iban: 1,
    ssn: 1, gstin: 1, abha: 1, uan: 1, phone: 1, email: 1, dob: 1, vehicle: 1, password: 1, pin: 1, otp: 1, apikey: 1, genericid: 1 };
  var IMG_CTX = /\b(image|photo|picture|screenshot|scan(?:ned)?|upload(?:ed)?|attach(?:ed|ment)|document you|i can see|i see|shows|reads|extracted|visible|transcri\w+)\b/i;

  // Documents people photograph and upload. [name, pattern, is it an ID / bank document?]
  var DOCS = [
    ["Aadhaar card", /aadhaa?r|aadhar|आधार/i, true], ["PAN card", /\bpan card\b/i, true],
    ["Driving licence", /driving licen[cs]e|\bdl\b|learner'?s licen[cs]e/i, true], ["Passport", /passport/i, true],
    ["Voter ID", /voter id|epic card/i, true], ["Bank card", /debit card|credit card|atm card/i, true],
    ["Bank passbook / statement / cheque", /passbook|bank statement|cheque|cancelled check/i, true],
    ["ID card", /\bid card\b|identity card|college id/i, true],
    ["Marksheet / certificate", /mark ?sheet|certificate|admit card|result card|transcript/i, false],
    ["Medical report / prescription", /prescription|medical report|lab report|blood report|x-?ray|mri|discharge summary/i, false],
    ["Salary slip / offer letter", /salary slip|pay ?slip|offer letter|form 16/i, false],
    ["Bill with your address", /electricity bill|phone bill|gas bill|rent agreement/i, false]
  ];

  function docMentions(userText, aiReply) {
    var out = [];
    DOCS.forEach(function (d) {
      var mu = d[1].exec(userText || ""), ma = mu ? null : d[1].exec(aiReply || "");
      if (!mu && !ma) return;
      out.push({
        type: "doc_image", label: "Photo / file of a document", category: d[2] ? "id" : "sensitive", weight: d[2] ? 9 : 6,
        value: d[0] + " (uploaded image or file)", start: mu ? mu.index : 0, end: mu ? mu.index + mu[0].length : 0,
        confidence: mu ? 0.85 : 0.7, owner: "unknown", relation: null,
        note: mu ? "You uploaded a file in this message and mentioned this document. Nijta can't see inside the file."
                 : "You uploaded a file and the AI's reply mentions this document. Nijta can't see inside the file."
      });
    });
    return out;
  }

  function monthKey(ms) {
    var d = new Date(ms);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  // onProgress(fraction) is called while scanning so the screen can show a progress bar.
  function scanAll(data, onProgress, options) {
    var loose = !!(options && options.maximum);
    var convs = data.conversations;
    var total = 0;
    convs.forEach(function (c) { total += c.messages.length; });
    var done = 0, findings = [];
    var ci = 0;

    return new Promise(function (resolve) {
      function step() {
        var t0 = Date.now();
        // Work in small slices so the page never freezes on big exports.
        while (ci < convs.length && Date.now() - t0 < 30) {
          var conv = convs[ci];
          var animalChat = !!(T && conv.messages.some(function (mm) { return mm.role === "user" && T.ANIMAL.test(mm.text || ""); }));
          conv.messages.forEach(function (msg, mi) {
            done++;
            var add = function (f) {
              f.conv = ci; f.msg = mi;
              f.time = msg.time || conv.created || null;
              f.convTitle = conv.title;
              f.link = conv.link || null;
              f.source = conv.source || data.source;
              findings.push(f);
            };
            if (msg.role === "user") {
              // 1. Everything YOU typed.
              // "Possible" (low-confidence) items only appear when Maximum sensitivity is on.
              D.scanText(msg.text).concat(T ? T.scanTopics(msg.text, { animalChat: animalChat, loose: loose }) : [])
                .filter(function (f) { return loose || f.category !== "possible"; }).forEach(add);
              // 2. Photos / files of documents you uploaded.
              if (msg.attachments) {
                var reply = "";
                for (var k = mi + 1; k < conv.messages.length; k++) { if (conv.messages[k].role === "assistant") { reply = conv.messages[k].text.slice(0, 800); break; } }
                docMentions(msg.text, reply).forEach(add);
              }
            } else {
              // 3. The AI's REPLY: if it read an ID out of your image or repeated your data, that is stored too.
              var prev = null;
              for (var j = mi - 1; j >= 0; j--) { if (conv.messages[j].role === "user") { prev = conv.messages[j]; break; } }
              var afterUpload = !!(prev && prev.attachments);
              D.scanText(msg.text).forEach(function (f) {
                if (!AI_REPLY_TYPES[f.type] || f.confidence < 0.5) return;
                var near = msg.text.slice(Math.max(0, f.start - 250), f.start);
                if (!afterUpload && !IMG_CTX.test(near)) return;      // skip examples the AI invented
                f.fromAI = true; f.owner = "unknown"; f.relation = null;
                f.note = "Seen in the AI's reply" + (afterUpload ? ", right after you uploaded an image or file." : " about an image or document.");
                add(f);
              });
            }
          });
          ci++;
        }
        if (onProgress) onProgress(total ? done / total : 1);
        if (ci < convs.length) setTimeout(step, 0);
        else resolve(summarise(data, findings));
      }
      step();
    });
  }

  function summarise(data, findings) {
    // Unique items: the same phone number typed 5 times counts once.
    var uniq = {};
    findings.forEach(function (f) {
      // A sensitive topic counts once per chat, however many times it comes up there.
      var k = f.type === "doc_image" ? "doc:" + f.value + ":conv" + f.conv
        : (f.category === "sensitive" || /^t_/.test(f.type)) ? f.type + ":" + f.category + ":conv" + f.conv : D.normalise(f);
      if (!uniq[k]) uniq[k] = { key: k, type: f.type, label: f.label, category: f.category, weight: f.weight,
        value: f.value, confidence: f.confidence, owner: f.owner, relation: f.relation, occurrences: [] };
      var u = uniq[k];
      u.occurrences.push(f);
      u.confidence = Math.max(u.confidence, f.confidence);
      if (u.owner !== "other" && f.owner === "other") { u.owner = "other"; u.relation = f.relation; }
      else if (u.owner === "unknown" && f.owner === "self") u.owner = "self";
    });
    var items = Object.keys(uniq).map(function (k) { return uniq[k]; });
    items.sort(function (a, b) { return b.weight - a.weight || b.occurrences.length - a.occurrences.length; });

    var byType = {}, byCategory = {};
    items.forEach(function (u) {
      byType[u.type] = byType[u.type] || { type: u.type, label: u.label, category: u.category, count: 0, weight: u.weight };
      byType[u.type].count++;
      byCategory[u.category] = (byCategory[u.category] || 0) + 1;
    });

    var timeline = {};
    findings.forEach(function (f) { if (f.time) { var k = monthKey(f.time); timeline[k] = (timeline[k] || 0) + 1; } });

    var userMsgs = 0, totalMsgs = 0, first = null, last = null, attachTotal = 0, attachChats = [];
    data.conversations.forEach(function (c, ci) {
      var a = 0;
      c.messages.forEach(function (m) { if (m.role === "user" && m.attachments) a += m.attachments; });
      if (a) { attachTotal += a; attachChats.push({ conv: ci, count: a }); }
      c.messages.forEach(function (m) {
        totalMsgs++;
        if (m.role === "user") userMsgs++;
        if (m.time) { if (!first || m.time < first) first = m.time; if (!last || m.time > last) last = m.time; }
      });
    });

    var chatsWithData = {};
    findings.forEach(function (f) { chatsWithData[f.conv] = (chatsWithData[f.conv] || 0) + 1; });

    return {
      source: data.source,
      stats: { conversations: data.conversations.length, userMessages: userMsgs, totalMessages: totalMsgs,
        first: first, last: last, chatsWithData: Object.keys(chatsWithData).length,
        attachments: attachTotal, attachmentChats: attachChats,
        sessions: data.conversations.length > 0 && data.conversations.every(function (c) { return c.isSession; }) },
      findings: findings,
      items: items,
      byType: Object.keys(byType).map(function (k) { return byType[k]; }).sort(function (a, b) { return b.weight - a.weight; }),
      byCategory: byCategory,
      others: items.filter(function (u) { return u.owner === "other"; }),
      // Name + college/city together can identify a person even without any ID number.
      identityCombo: (function () {
        var has = function (t) { return items.some(function (u) { return u.type === t; }); };
        var parts = [];
        if (has("name")) parts.push("name");
        if (has("institution")) parts.push("college / workplace");
        if (has("city") || has("address")) parts.push("city");
        if (has("phone")) parts.push("phone number");
        if (has("email")) parts.push("email");
        return has("name") && parts.length >= 2 ? parts : null;
      })(),
      timeline: timeline,
      // For topics, the first 3 chats count fully; more of the same topic adds only a little.
      // Two kinds of risk, scored separately:
      //   fraud     = things that let someone impersonate you or take money (IDs, bank, passwords, contact)
      //   sensitive = things that can embarrass you or be used against you (health, relationships, beliefs, identity)
      risk: (function () {
        var FRAUD = { id: 1, money: 1, secret: 1, contact: 1 }, seen = {}, f = [], sv = [];
        items.forEach(function (u) {
          var w = u.weight;
          if (u.category === "sensitive" && u.type !== "doc_image") { seen[u.type] = (seen[u.type] || 0) + 1; if (seen[u.type] > 3) w *= 0.15; }
          var it = { weight: w, confidence: u.confidence };
          if (FRAUD[u.category] || u.type === "doc_image") f.push(it); else if (u.category !== "possible") sv.push(it);
        });
        return { fraud: D.exposureScore(f), sensitive: D.exposureScore(sv) };
      })(),
      exposure: (function () {
        var seen = {};
        return D.exposureScore(items.map(function (u) {
          if (u.category === "possible") return { weight: 0, confidence: 0 };      // "Possible" items never change the score
          if (u.category !== "sensitive" || u.type === "doc_image") return u;
          seen[u.type] = (seen[u.type] || 0) + 1;
          return { weight: seen[u.type] <= 3 ? u.weight : u.weight * 0.15, confidence: u.confidence };
        }));
      })()
    };
  }

  var API = { scanAll: scanAll, summarise: summarise };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.NijtaScan = API;
})(typeof window !== "undefined" ? window : globalThis);
