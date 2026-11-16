// Run with:  node tests/test_topics.js
global.window = globalThis;
require("../js/detectors.js");
const T = require("../js/topics.js");

const cases = [
  // [text, expected topic ids, description]
  ["I have diabetes and my sugar level is high", ["t_health"], "Own health"],
  ["my mother is suffering from thyroid for 2 years", ["t_health"], "Mother's health"],
  ["mujhe bukhar hai 3 din se", ["t_health"], "Hinglish health"],
  ["doctor said it is stage 3", ["t_health"], "Doctor said"],
  ["explain how cancer cells divide", [], "Biology question, not personal"],
  ["how does the liver work", [], "General question"],
  ["I had a breakup last week and I feel depressed", ["t_mental", "t_relationship"], "Breakup + low mood"],
  ["write an essay on depression in teenagers", [], "Essay topic, not personal"],
  ["what is stress testing in software", [], "Stress testing"],
  ["I am very stressed about end sems and can't sleep", ["t_mental"], "Exam stress"],
  ["sometimes I feel like I want to die", ["t_mental"], "Self-harm phrase"],
  ["my girlfriend and I had a fight", ["t_relationship"], "Relationship"],
  ["I failed one subject and papa doesn't know", ["t_family"], "Hiding from parents"],
  ["I can't pay my hostel fees this month", ["t_money"], "Money trouble"],
  ["I am a Brahmin, do I get any reservation?", ["t_beliefs"], "Caste"],
  ["how to bypass turnitin ai detection for my assignment", ["t_risky"], "Plagiarism bypass"],
  ["how to hack my friend's instagram account", ["t_risky"], "Hacking a friend"],
  ["make a fake medical certificate for leave", ["t_risky"], "Fake document"],
  ["I got drunk last night and missed class", ["t_risky"], "Alcohol"],
  ["explain my code for binary search", [], "Normal coding help"],
  ["if (user.sex == 'M') { return 1; }", [], "Code is ignored"],
  ["what is the capital of France?", [], "Normal question"],
  ["someone filed an FIR against my father", ["t_legal"], "Legal matter"],
  ["I was suspended from hostel for ragging", ["t_legal"], "Disciplinary"],
  // --- from the first real Gemini test ---
  ["my mother has h pylori positive and she got the bismuth therapy for 20 days", ["t_health"], "Bismuth therapy is not mental health"],
  ["which scents should I go for like which doesn't cause headache to others", [], "Perfume question, not a symptom"],
  ["I saw a street dog with maggots, I gave him 400 mg tablet", [], "Animal, not a person"],
  ["What if I made a betting app?", [], "Betting app is a business idea"],
  ["I lost 5000 in betting last week", ["t_risky"], "Real gambling"],
  ["I am seeing a therapist for anxiety", ["t_mental"], "Real therapy"],
  ["Fissure and grade 4 hemorrhoids surgery, my recovery timeline?", ["t_health"], "Hemorrhoids"],
];

let pass = 0, fail = 0;
for (const [text, expected, name] of cases) {
  const got = [...new Set(T.scanTopics(text).map(f => f.type))].sort();
  const ok = JSON.stringify(got) === JSON.stringify([...expected].sort());
  if (ok) pass++; else { fail++; console.log(`FAIL  ${name}\n      text: ${text}\n      expected ${JSON.stringify(expected)} got ${JSON.stringify(got)}`); }
}

// Whose is it?
const own = [
  ["my mother is suffering from thyroid", "other", "mother"],
  ["I have fever since monday", "self", null],
  ["my friend is depressed these days", "other", "friend"],
];
for (const [text, owner, rel] of own) {
  const f = T.scanTopics(text)[0];
  const ok = f && f.owner === owner && f.relation === rel;
  if (ok) pass++; else { fail++; console.log(`FAIL  owner: ${text} -> ${f && f.owner}/${f && f.relation}`); }
}
const sh = T.scanTopics("sometimes I feel like I want to die")[0];
if (sh && sh.note) pass++; else { fail++; console.log("FAIL  self-harm note missing"); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
