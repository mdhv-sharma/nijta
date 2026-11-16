/*
 * Nijta: topics.js
 * -----------------
 * Finds SENSITIVE TOPICS you talked about (not numbers): health, mental
 * health, relationships, family problems, money trouble, beliefs, sexual
 * topics, and risky / embarrassing requests.
 *
 * How it works (no AI, works offline):
 *   1. Split the message into sentences.
 *   2. A sentence counts only if it is PERSONAL: it has a word like
 *      "I / my / mujhe / mera" or a family word ("my mother ...").
 *      So "explain how cancer spreads" is ignored, but
 *      "my mother has cancer" is flagged.
 *   3. Some phrases are strong enough to count on their own
 *      ("bypass turnitin", "doctor prescribed").
 *
 * English + Hinglish keywords. Keyword lists are never perfect:
 * the search box and the "Possible" tier cover what these miss.
 */
(function (root) {
  "use strict";
  var D = root.NijtaDetect || (typeof require !== "undefined" ? require("./detectors.js") : null);

  var CUE = /\b(i|i'm|im|i've|ive|i'll|my|me|mine|myself|we|our|us|mujhe|mujhko|mera|meri|mere|mai|main|hum|humara|humari|apna|apni|apne)\b/i;
  var REL_CUE = /\b(mom|mummy|mumma|mother|maa|dad|daddy|papa|father|brother|bhai|bhaiya|sister|didi|wife|husband|son|daughter|uncle|aunty|aunt|chacha|mama|friend|dost|girlfriend|boyfriend|gf|bf|nana|nani|dada|dadi|grandfather|grandmother|cousin|roommate)\b/i;

  var SELF_HARM = /\b(suicid\w*|kill myself|want to die|end my life|don'?t want to live|self[- ]?harm|jeene ka (?:mann|man) nahi|mar jana chahta|marna chahta|marna chahti)\b/i;

  // ownerMode "who": the topic can be about someone else ("my mother has ...").
  // ownerMode "self": it is about you.
  var TOPICS = [
    {
      id: "t_health", label: "Health / medical", icon: "🩺", weight: 3, ownerMode: "who",
      strong: /\bdoctor (?:said|told|prescribed|advised)|\bprescribed (?:me|him|her)\b|\bmy (?:blood|sugar|thyroid|mri|ct scan|x-?ray|medical|lab) (?:test|report|result|level)s?\b/i,
      terms: /\b(cancer|tumou?r|diabet\w+|sugar level|blood pressure|thyroid|asthma|tuberculosis|hiv|pcos|pcod|migraine|epilepsy|seizures?|stroke|heart (?:attack|disease|problem)|kidney (?:stone|problem|failure|disease)|liver (?:problem|disease|damage)|jaundice|dengue|malaria|typhoid|covid|pneumonia|ulcer|h\.? ?pylori|gastric|acidity|piles|hemorrhoids?|haemorrhoids?|fissure|fistula|allerg\w+|surgery|chemo\w*|dialysis|pregnan\w+|miscarriage|fever|headache|chest pain|stomach (?:pain|ache)|back pain|throat (?:pain|problem|cancer)|dry throat|vomiting|symptoms?|diagnos\w+|suffering from|medicines?|tablets?|dosage|prescription|hospitali[sz]ed|admitted in hospital|bimar|bimaar|bimari|bukhar|bukhaar|dawai|ilaaj|tabiyat|sugar hai|sugar ki|bp hai|bp high|bp low|high bp|low bp|thyroid hai|pathri|khansi|zukam)\b/i
    },
    {
      id: "t_mental", label: "Mental health / feeling low", icon: "🧠", weight: 4, ownerMode: "who",
      strong: SELF_HARM,
      terms: /\b(depress\w+|anxiety|anxious|panic attacks?|hopeless|worthless|lonely|loneliness|can'?t sleep|cannot sleep|insomnia|overthink\w*|burn(?:t|ed)? ?out|mental health|therapist|psychotherapy|counsell?ing|counsell?or|cbt|psychiatrist|antidepressants?|stress(?:ed)?(?! test)|crying|cried|breakdown|trauma|feel(?:ing)? (?:low|empty|numb|sad|lost)|no one (?:cares|understands)|akela|akelapan|tension|rona aa|udaas)\b/i
    },
    {
      id: "t_relationship", label: "Relationships / breakup", icon: "💔", weight: 2, ownerMode: "self",
      strong: null,
      terms: /\b(break ?-?up|broke up|breaking up|my ex|ex[- ]?(?:girlfriend|boyfriend|gf|bf)|girlfriend|boyfriend|gf|bf|crush|cheated on|cheating on me|divorce\w*|heart ?broken|heartbreak|situationship|one[- ]sided love|toxic relationship|long distance relationship|propose (?:her|him|to)|pyaar|pyar|dhoka|move on from)\b/i
    },
    {
      id: "t_family", label: "Family problems", icon: "🏠", weight: 2, ownerMode: "self",
      strong: /\b(?:fight|fought|argument|problem) with (?:my )?(?:parents|mom|mummy|mother|dad|papa|father|family|brother|sister)\b|\b(?:papa|dad|mom|mummy|parents|father|mother) (?:doesn'?t|don'?t|does not|do not) know\b|\bparents (?:don'?t|do not|never) understand\b|\b(?:family|ghar ki) problems?\b|\bfamily pressure\b|\bdomestic violence\b|\bghar ?wale (?:nahi|nahin)\b/i,
      terms: null
    },
    {
      id: "t_money", label: "Money trouble", icon: "💸", weight: 2, ownerMode: "who",
      strong: null,
      terms: /\b(in debt|can'?t (?:pay|afford)|cannot (?:pay|afford)|no money|broke(?! up)|financial (?:problem|crisis|trouble|condition)s?|lost (?:my |all )?(?:money|savings)|got scammed|scammed me|fraud hua|udhaar|udhar|karz|karza|paise nahi|fees? (?:nahi|not paid|pending))\b/i
    },
    {
      id: "t_beliefs", label: "Religion / caste / politics", icon: "🕊️", weight: 3, ownerMode: "self",
      strong: /\bmy (?:caste|religion|gotra)\b|\bi(?: am|'m) (?:a |an )?(?:hindu|muslim|sikh|christian|buddhist|jain|atheist|brahmin|rajput|dalit|obc|sc|st)\b|\b(?:sc|st|obc|ews) (?:category|certificate|quota)\b|\bi (?:vote|voted|support|will vote) (?:for )?(?:bjp|congress|aap|nc|pdp|inc|modi|rahul)\b/i,
      terms: null
    },
    {
      id: "t_sexual", label: "Sexual / intimate topics", icon: "🔞", weight: 4, ownerMode: "self",
      strong: /\bi(?: am|'m) (?:gay|lesbian|bisexual|bi|trans|transgender|asexual)\b|\bmy (?:sexuality|sexual orientation)\b/i,
      terms: /\b(sex|sexual|sexually|porn\w*|masturbat\w+|virgin\w*|condoms?|nudes?|hook ?up|std|intimate|intimacy)\b/i
    },
    {
      id: "t_legal", label: "Legal / police matters", icon: "⚖️", weight: 4, ownerMode: "who",
      strong: null,
      terms: /\b(fir|f\.i\.r|court case|legal notice|police (?:complaint|case|station|verification)|arrested|bail|lawsuit|sued|charge ?sheet|summons|challan|cyber ?crime complaint|divorce case|custody case|harass(?:ed|ment|ing)|blackmail\w*|ragging|suspended|rusticated|debarred)\b/i
    },
    {
      id: "t_risky", label: "Risky / embarrassing requests", icon: "⚠️", weight: 3, ownerMode: "self",
      strong: new RegExp([
        // academic dishonesty
        "\\b(?:do|write|complete|solve|finish) my (?:assignment|homework|thesis|project report|lab (?:file|report)|exam|quiz)\\b",
        "\\bcheat(?:ing)? (?:in|on|during) (?:the |my |an? )?(?:exam|test|quiz|paper|interview)\\b",
        "\\b(?:bypass|avoid|beat|remove|fool|escape|pass) (?:the )?(?:turnitin|plagiarism|ai[- ]?detect\\w*|gptzero|proctor\\w*)\\b",
        "\\bundetectable (?:by )?(?:ai|turnitin)\\b|\\bproxy attendance\\b|\\bleaked (?:paper|question)s?\\b|\\bcopy (?:in|during) (?:the )?exam\\b",
        // illegal or harmful to others
        "\\bhack(?:ing)? (?:into )?(?:my |his |her |their |someone'?s |a )?(?:friend'?s |gf'?s |bf'?s |girlfriend'?s |boyfriend'?s |ex'?s |neighbou?r'?s )?(?:instagram|insta|whatsapp|facebook|snapchat|account|wi-?fi|phone|email|gmail)\\b",
        "\\bfake (?:certificate|degree|marksheet|medical|id|aadhaa?r|pan|documents?|bill|invoice|experience letter|salary slip)s?\\b",
        "\\b(?:cracked|pirated) (?:version|software|game|windows|copy)\\b|\\bcrack for\\b",
        "\\b(?:spy|spying) on\\b|\\bstalk(?:ing)?\\b|\\btrack (?:her|his|someone'?s|my (?:gf|bf|girlfriend|boyfriend)'?s) (?:phone|location)\\b",
        "\\bwithout (?:a )?(?:driving )?licen[cs]e\\b|\\bbribe\\w*\\b|\\brishwat\\b|\\btax evasion\\b|\\brevenge on\\b"
      ].join("|"), "i"),
      terms: /\b(weed|ganja|charas|cocaine|mdma|lsd|drugs|drunk|daru|sharab|hangover|betting|satta|gambling|casino)\b(?!\s+(?:app|apps|website|site|platform|business|startup|company|industry|market|law|laws|ban|regulation))/i
    }
  ];

  var META = {};
  TOPICS.forEach(function (t) { META[t.id] = { label: t.label, icon: t.icon, weight: t.weight }; });

  function snippet(sent, idx, len) {
    var s = Math.max(0, idx - 70), e = Math.min(sent.length, idx + len + 70);
    return (s > 0 ? "…" : "") + sent.slice(s, e).replace(/\s+/g, " ").trim() + (e < sent.length ? "…" : "");
  }

  var ANIMAL = /\b(dog|dogs|puppy|puppies|cat|cats|kitten|pet|pets|cow|stray|animal|animals|bird|parrot|vet|veterinar\w*|maggots?|kutta|kutte|billi)\b/i;
  var SELF_HEALTH = /\b(i have|i've|i had|i am suffering|i'm suffering|i feel|i felt|my body|my head|my stomach|my skin|my throat|my chest|mujhe|meri tabiyat|my (?:mom|mother|mummy|dad|father|papa|brother|sister|wife|husband|son|daughter|grand\w+|nana|nani|dada|dadi))\b/i;

  // opts.animalChat: the conversation is about an animal (set by scan.js).
  function scanTopics(text, opts) {
    if (!text || typeof text !== "string" || text.length < 8) return [];
    var out = [], counts = {};
    var re = /[^.!?\n]+[.!?]*/g, m;
    while ((m = re.exec(text))) {
      var sent = m[0], base = m.index;
      if (sent.trim().length < 8) continue;
      if (/[{};]|=>|==|\b(?:def |import |const |#include)/.test(sent)) continue;     // program code
      for (var i = 0; i < TOPICS.length; i++) {
        var t = TOPICS[i];
        if ((counts[t.id] || 0) >= 3) continue;                 // enough from this message
        var hit = t.strong ? t.strong.exec(sent) : null, strong = !!hit, loose = false;
        if (!hit && t.terms) {
          hit = t.terms.exec(sent);
          if (hit) {
            // The keyword must sit near a personal word (I / my / mother ...).
            var near = sent.slice(Math.max(0, hit.index - 120), hit.index + hit[0].length + 80);
            if (!CUE.test(near) && !REL_CUE.test(near)) { if (opts && opts.loose) loose = true; else hit = null; }
          }
        }
        if (!hit) continue;
        if (t.id === "t_health" && !strong) {
          var pre = sent.slice(Math.max(0, hit.index - 30), hit.index).toLowerCase();
          // "doesn't cause headache", "to avoid fever": hypothetical, not a symptom.
          if (/\b(cause|causes|causing|doesn'?t|does not|won'?t|avoid|prevent|no|without|give|gives)\s+(?:a |any )?$/.test(pre)) continue;
          // Pets / street animals: "my dog has fever", "I gave him 400 mg tablet" in a chat about a dog.
          if (ANIMAL.test(sent) || (opts && opts.animalChat && !SELF_HEALTH.test(sent))) continue;
        }
        var start = base + hit.index, end = start + hit[0].length;
        var owner = "self", relation = null;
        if (t.ownerMode === "who" && D) {
          var w = D.whoseData(text, start, end);
          if (w.owner === "other") {
            // "my girlfriend and I fought about MY stress": the nearest word decides.
            var before = sent.slice(Math.max(0, hit.index - 40), hit.index), lastSelf = -1, lastRel = -1, mm;
            var selfRe = /\b(my|i|i'm|i am|mera|meri|mujhe)\b/gi, relRe = new RegExp(REL_CUE.source, "gi");
            while ((mm = selfRe.exec(before))) lastSelf = mm.index;
            while ((mm = relRe.exec(before))) lastRel = mm.index;
            if (lastSelf > lastRel) owner = "self";
            else if (w.relation === "someone else") owner = "unknown";
            else { owner = "other"; relation = w.relation; }
          }
        }
        var note = null;
        if (t.id === "t_mental" && SELF_HARM.test(sent)) {
          note = "If you still feel this way, please talk to someone you trust. In India you can call Tele-MANAS on 14416 (free, 24x7).";
        }
        counts[t.id] = (counts[t.id] || 0) + 1;
        out.push({
          type: t.id, label: t.label, category: loose ? "possible" : "sensitive", weight: loose ? 0.5 : t.weight,
          value: snippet(sent, hit.index, hit[0].length), start: start, end: end,
          confidence: loose ? 0.35 : strong ? 0.8 : 0.65,
          note: loose ? "Keyword found, but the sentence doesn't look personal. Shown because Maximum sensitivity is on." : note,
          owner: loose ? "unknown" : owner, relation: loose ? null : relation
        });
      }
    }
    return out;
  }

  var API = { scanTopics: scanTopics, TOPICS: TOPICS, META: META, ANIMAL: ANIMAL };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.NijtaTopics = API;
})(typeof window !== "undefined" ? window : globalThis);
