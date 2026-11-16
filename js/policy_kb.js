/*
 * Nijta: policy_kb.js
 * --------------------
 * A small "knowledge base": for each privacy topic, the words that signal it in a
 * policy, what it means for you, and what you can do. Used by the app AND by
 * tools/policy_watch.js (the daily checker), so both explain changes the same way.
 */
(function (root) {
  "use strict";
  var TOPICS = [
    { id: "training", label: "AI training", icon: "🧠",
      re: /\b(train(?:ing|s|ed)?|improve (?:our|the|its) (?:models?|services?|products?)|model (?:improvement|development)|develop (?:our|new) models?)\b/i,
      affect: "What you type or upload may be used to teach the AI. Private details in your chats can end up as training material.",
      action: ["Turn off the model-training setting in the app (steps are below on this page)", "Use temporary chats for sensitive questions", "Delete old chats that contain personal data"] },
    { id: "retention", label: "How long data is kept", icon: "🗄️",
      re: /\b(retain(?:ed|s|ing)?|retention|kept for|keep (?:your|the) (?:data|information|chats|conversations)|stored? for|delete(?:d)? (?:after|within)|\d+ (?:days|months|years))\b/i,
      affect: "Your chats may stay on the company's servers for longer (or shorter) than before. The longer they are kept, the longer they can leak.",
      action: ["Turn on auto-delete where the app offers it", "Delete chats you no longer need", "Ask for erasure in the “Take it back” tab"] },
    { id: "sharing", label: "Sharing with others", icon: "🤝",
      re: /\b(share(?:d|s)? (?:your|personal|with)|third[- ]part(?:y|ies)|affiliates?|vendors?|service providers?|partners?|law enforcement|legal (?:request|process|obligation)|government)\b/i,
      affect: "More organisations may be able to see or receive your data, such as partner companies, contractors or authorities.",
      action: ["Don't put IDs, bank details or other people's data in chats", "Use the “Take it back” tab to ask who your data was shared with (Section 11)"] },
    { id: "ads", label: "Ads and personalisation", icon: "📢",
      re: /\b(advertis\w+|ads?\b|marketing|personali[sz]ed? (?:content|ads|experience|recommendations))\b/i,
      affect: "What you tell the AI may be used to decide which ads and posts you see. Private worries can turn into ad targeting.",
      action: ["Avoid personal topics with that assistant", "Check the app's ad or personalisation settings", "Use a different assistant for sensitive questions"] },
    { id: "humans", label: "Human review", icon: "👀",
      re: /\b(human review\w*|reviewers?|reviewed by|annotat\w+|quality raters?)\b/i,
      affect: "Real people (employees or contractors) may read some of your chats.",
      action: ["Never type anything you wouldn't want a stranger to read", "Turn off chat history or activity saving"] },
    { id: "memory", label: "Memory about you", icon: "💾",
      re: /\b(memor(?:y|ies)|remember(?:s|ed)?|past (?:chats|conversations)|personal context)\b/i,
      affect: "The AI may keep facts about you between chats and build a profile over time.",
      action: ["Open the app's memory settings and delete what it has saved", "Turn memory off if you don't need it"] },
    { id: "sensitive", label: "Sensitive data", icon: "🩺",
      re: /\b(health|biometric|precise location|location data|sensitive (?:personal )?(?:data|information)|financial information)\b/i,
      affect: "The policy now says more about health, location or other sensitive data. Check whether it collects more than before.",
      action: ["Don't upload medical reports or ID photos", "Turn off location access for the app"] },
    { id: "children", label: "Children and teens", icon: "🧒",
      re: /\b(child(?:ren)?|minors?|teens?|under (?:13|16|18)|parental|age (?:verification|assurance))\b/i,
      affect: "Rules for younger users changed. This matters if a child in your family uses the app.",
      action: ["Check the minimum age and parental controls", "Supervise younger users' accounts"] },
    { id: "rights", label: "Your controls and rights", icon: "🛠️",
      re: /\b(opt[- ]?out|opt[- ]?in|your (?:rights|choices|controls)|delete your|access your|export your|withdraw (?:your )?consent|object to)\b/i,
      affect: "The ways you can control, export or delete your data changed. This can be good news or bad news.",
      action: ["Re-check your privacy settings in the app", "Use the “Take it back” tab if you want your data erased"] }
  ];

  function classify(text) {
    var out = [];
    TOPICS.forEach(function (t) { if (t.re.test(text)) out.push(t.id); });
    return out;
  }
  function byId(id) { for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === id) return TOPICS[i]; return null; }

  var API = { TOPICS: TOPICS, classify: classify, byId: byId };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.NijtaPolicyKB = API;
})(typeof window !== "undefined" ? window : globalThis);
