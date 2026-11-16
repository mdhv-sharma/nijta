/*
 * Nijta: rights.js  ("Take it back" tab)
 * --------------------------------------
 * Drafts a request under India's Digital Personal Data Protection Act, 2023:
 *   Section 11   right to access information about your personal data
 *   Section 12   right to correction and erasure
 *   Section 6(4) right to withdraw consent
 *   Section 13   right to grievance redressal
 *   Rule 14(3) of the DPDP Rules, 2025: reply within a reasonable period, not more than 90 days
 * These rights come into force on 13 May 2027. Not legal advice.
 * Nothing here is sent anywhere: the user copies the letter and sends it themselves.
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var REPLY_DAYS = 90;

  var COMPANIES = {
    openai: { name: "OpenAI", product: "ChatGPT", email: "",
      where: 'Send it through OpenAI\'s <a target="_blank" rel="noopener" href="https://privacy.openai.com">Privacy Portal ↗</a> (Make a Privacy Request), and paste this text where it asks for details.' },
    google: { name: "Google", product: "Gemini", email: "",
      where: 'First delete your Gemini activity at <a target="_blank" rel="noopener" href="https://myactivity.google.com/product/gemini">My Activity ↗</a>. For a formal request, use the contact form linked in Google\'s Privacy Policy and paste this text.' },
    anthropic: { name: "Anthropic", product: "Claude", email: "privacy@anthropic.com",
      where: "Email it to <b>privacy@anthropic.com</b> from the email address on your Claude account." },
    other: { name: "", product: "", email: "",
      where: "Look for “Grievance Officer”, “Data Protection Officer” or “Contact us” in the company's Privacy Policy and send it there." }
  };

  var TYPES = {
    erase: { subject: "Erasure of my personal data",
      body: "Under Section 12 of the Act, I request that you erase my personal data, including my conversation history, uploaded files and any copies kept for improving or training your models, and that you confirm to me in writing once this is done.\n\nUnder Section 6(4) of the Act, I also withdraw my consent for my conversations to be used to train or improve your models." },
    access: { subject: "Access to information about my personal data",
      body: "Under Section 11 of the Act, I request (a) a summary of the personal data of mine that you are processing and the processing activities carried out on it, and (b) the identities of all other Data Fiduciaries and Data Processors with whom my personal data has been shared, with a description of the data shared." },
    correct: { subject: "Correction of my personal data",
      body: "Under Section 12 of the Act, I request that you correct, complete and update the personal data you hold about me. The details that are wrong or incomplete are:\n\n[write what is wrong and what it should be]" },
    withdraw: { subject: "Withdrawal of consent for model training",
      body: "Under Section 6(4) of the Act, I withdraw my consent for my conversations and uploaded files to be used to train or improve your models. Under Section 6(6), please stop this processing, and have your Data Processors stop it, within a reasonable time, and confirm to me in writing." }
  };

  function today() { return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }

  // Categories found by the scan (names only, never the values).
  function categories() {
    var app = window.NijtaApp, r = app && app.state.result;
    if (!r || !r.items.length) return null;
    var seen = {}, out = [];
    r.items.forEach(function (u) {
      if (u.category === "possible") return;
      var label = (u.label || u.type).replace(/^Your /, "");
      if (!seen[label]) { seen[label] = 1; out.push(label); }
    });
    return { list: out.slice(0, 14), others: r.others.length };
  }

  function company() {
    var k = $("tbCompany").value, c = COMPANIES[k];
    if (k !== "other") return c;
    var n = $("tbOther").value.trim() || "[Company name]";
    return { name: n, product: n, email: "", where: c.where };
  }

  function makeLetter() {
    var c = company(), t = TYPES[$("tbType").value];
    var name = $("tbName").value.trim() || "[Your full name]", email = $("tbEmail").value.trim() || "[your account email]";
    var cats = categories();
    var lines = [
      "Subject: Request under the Digital Personal Data Protection Act, 2023: " + t.subject,
      "",
      "To,",
      "The Grievance Officer / Data Protection Officer",
      c.name,
      "",
      "Date: " + today(),
      "",
      "Dear Sir or Madam,",
      "",
      "I use " + c.product + " with the account registered to " + email + ". I am writing as a Data Principal under India's Digital Personal Data Protection Act, 2023 (\"the Act\").",
      "",
      t.body,
      ""
    ];
    if (cats) {
      lines.push("From my own review of my exported conversations, they contain these categories of personal data: " + cats.list.join(", ") + "." +
        (cats.others ? " They also include personal data of other people (family members and friends), who did not consent to this." : ""), "");
    }
    lines.push(
      "Please reply within a reasonable period, and in any case within ninety days, as provided in Rule 14(3) of the Digital Personal Data Protection Rules, 2025.",
      "",
      "I understand that Sections 11 to 14 of the Act come into force on 13 May 2027. I ask you to act on this request now under your own privacy policy and any other data-protection law that applies to you.",
      "",
      "If I do not receive a satisfactory reply, I will use the grievance redressal route under Section 13 of the Act, including approaching the Data Protection Board of India once it is able to hear complaints.",
      "",
      "Please confirm that you have received this request.",
      "",
      "Yours faithfully,",
      name,
      email
    );
    return { text: lines.join("\n"), subject: lines[0].replace(/^Subject: /, ""), c: c };
  }

  $("tbCompany").addEventListener("change", function () { $("tbOtherWrap").hidden = this.value !== "other"; });
  $("tbMake").addEventListener("click", function () {
    var L = makeLetter();
    $("tbResult").hidden = false;
    $("tbLetter").value = L.text;
    $("tbWhere").innerHTML = "<b>Where to send it:</b> " + L.c.where;
    var m = $("tbMail");
    if (L.c.email) {
      m.hidden = false;
      m.href = "mailto:" + L.c.email + "?subject=" + encodeURIComponent(L.subject) + "&body=" + encodeURIComponent(L.text.split("\n").slice(2).join("\n"));
    } else m.hidden = true;
    // Gmail: opens a ready-to-send draft in the user's own Gmail (they only press Send).
    $("tbGmail").href = "https://mail.google.com/mail/?view=cm&fs=1" + (L.c.email ? "&to=" + encodeURIComponent(L.c.email) : "") +
      "&su=" + encodeURIComponent(L.subject) + "&body=" + encodeURIComponent(L.text.split("\n").slice(2).join("\n"));
    $("tbMsg").textContent = "You can edit the text before sending.";
  });
  $("tbCopy").addEventListener("click", function () {
    var ta = $("tbLetter"), ok = function () { $("tbMsg").textContent = "Copied ✓"; };
    try { navigator.clipboard.writeText(ta.value).then(ok, function () { ta.select(); document.execCommand("copy"); ok(); }); }
    catch (e) { ta.select(); try { document.execCommand("copy"); ok(); } catch (e2) { } }
  });

  // ---------------- Deadline tracker (saved on this device only) ----------------
  function load() { try { return JSON.parse(localStorage.getItem("nijta-requests") || "[]"); } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem("nijta-requests", JSON.stringify(list)); } catch (e) { } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }

  function render() {
    var list = load(), box = $("tbTracker");
    if (!list.length) { box.innerHTML = '<p class="muted small">Nothing yet. After you send a request, press “I sent it” and Nijta will count the 90 days for you.</p>'; return; }
    box.innerHTML = list.map(function (r, i) {
      var due = r.sent + REPLY_DAYS * 86400000, left = Math.ceil((due - Date.now()) / 86400000);
      var status = r.replied ? '<span class="due-ok">✓ Replied</span>'
        : left >= 0 ? '<span class="due-ok">' + left + " days left to reply</span>"
        : '<span class="due-late">Overdue by ' + (-left) + " days: send a reminder, then use the grievance route (Section 13)</span>";
      return '<div class="del-item' + (r.replied ? " done" : "") + '"><span>✉️</span><div><div class="del-title">' + esc(r.company) + " · " + esc(r.what) + "</div>" +
        '<div class="del-meta">Sent ' + new Date(r.sent).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
        " · reply due by " + new Date(due).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " · " + status + "</div></div>" +
        '<div class="del-actions"><button class="btn small" data-act="reply" data-i="' + i + '">' + (r.replied ? "Not replied" : "They replied") + "</button>" +
        '<button class="btn small" data-act="remove" data-i="' + i + '">Remove</button></div></div>';
    }).join("");
    box.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = load(), i = +b.dataset.i;
        if (b.dataset.act === "remove") l.splice(i, 1); else l[i].replied = !l[i].replied;
        save(l); render();
      });
    });
  }
  $("tbSave").addEventListener("click", function () {
    var L = makeLetter(), l = load();
    l.unshift({ company: L.c.name, what: TYPES[$("tbType").value].subject, sent: Date.now(), replied: false });
    save(l); render();
    $("tbMsg").textContent = "Saved. The 90-day countdown has started.";
  });
  render();
  window.NijtaRights = { makeLetter: makeLetter, REPLY_DAYS: REPLY_DAYS };
})();
