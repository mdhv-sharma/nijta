// Builds the fake demo history used for testing and for the expo demo:
// one invented student ("Aarav Sharma") across ChatGPT, Claude and Gemini, 2024-2026.
// EVERYTHING here is invented. Aadhaar numbers use the 9999 test series, cards are the
// public test numbers, keys are documentation examples.
// Run:  node tools/build_demo.js
const fs = require("fs");
const path = require("path");
global.window = globalThis;
const D = require("../js/detectors.js");
const T = require("../js/topics.js");

const aad = (s) => { const n = s + D.verhoeffDigit(s); return `${n.slice(0, 4)} ${n.slice(4, 8)} ${n.slice(8)}`; };
const MY_AADHAAR = aad("99992013458");
const MOM_AADHAAR = aad("99997710254");
const DAD_AADHAAR = aad("99994402871");
const IMG = "[IMAGE] ";   // marks a message where a photo/file was uploaded

// ---------------------------------------------------------------- ChatGPT
// [date, title, [[user, assistant], ...]]
const chatgpt = [
  ["2024-03-04", "Fix Python list error", [
    ["why does my code say list index out of range? for i in range(len(a)+1): print(a[i])", "Your loop goes one step too far. range(len(a)) is enough."]]],
  ["2024-03-19", "Scholarship form help", [
    [`I'm filling the post matric scholarship form. my aadhaar is ${MY_AADHAAR} and it says name mismatch, what to do?`, "A name mismatch usually means the spelling differs from your bank or school records. Update it at an Aadhaar centre or match the form to Aadhaar."],
    ["my bank account number is 50100234567891 and IFSC is HDFC0001234, is that enough for DBT?", "For DBT your account must be Aadhaar-seeded. Ask the branch to link it."],
    [IMG + "here is the photo of my aadhaar card, can you check if the address is readable?", `I can see the Aadhaar card in the image. It reads: Name: Aarav Sharma, DOB: 14/08/2004, Aadhaar number: ${MY_AADHAAR}. The address line is slightly blurred near the PIN code. A reminder: avoid sharing ID photos online.`]]],
  ["2024-04-10", "Essay on climate change", [
    ["write a 300 word essay on climate change for class 12 level", "Climate change is the long-term shift in temperatures and weather patterns..."]]],
  ["2024-05-22", "Internship cold email", [
    ["write a cold email for an internship. my name is Aarav Sharma, phone 98765 43210, email aarav.sharma.dev@gmail.com", "Subject: Internship application – Aarav Sharma..."]]],
  ["2024-06-11", "Semester registration", [
    ["my roll number is 22BMC045 and enrollment no: 2022/BT/1187. write an application to the dean for late registration", "To, The Dean (Academics)... Subject: Request for late semester registration..."]]],
  ["2024-07-02", "Mom's ration card update", [
    [`my mom's aadhaar is ${MOM_AADHAAR}, how do I add it to the ration card online?`, "Go to your state's food & civil supplies portal and choose 'add member'..."]]],
  ["2024-08-15", "Headache every morning", [
    ["I've had a headache every morning for 3 weeks and I take dolo 650 daily, is that okay?", "Daily painkillers for weeks isn't a good idea. Please see a doctor."]]],
  ["2024-09-09", "Hostel wifi not working", [
    ["hostel wifi password: Basohli@5G2024 but laptop keeps disconnecting", "Try forgetting the network and reconnecting, and update the Wi-Fi driver."]]],
  ["2024-10-30", "Diwali gift ideas", [
    ["gift ideas for my sister under 1000 rupees", "A personalised mug, a book, a skincare kit..."]]],
  ["2024-11-18", "Driving licence renewal", [
    ["my driving licence number is JK02 20220012345, it expires next year. how to renew online?", "Use the Parivahan Sarathi portal: Apply online → Services on DL → Renewal..."],
    [IMG + "this is my DL front side, is the photo okay for upload?", "The image shows a Jammu & Kashmir driving licence. DL No: JK02 20220012345, Name: AARAV SHARMA, valid till 2042. The photo is clear enough to upload."]]],
  ["2024-12-12", "Loan for laptop", [
    ["I took a loan of 65,000 for my laptop and the EMI is 5,800. how do I pay it faster?", "Prepay when you can and check for prepayment charges."]]],
  ["2025-01-20", "Exam stress", [
    ["I am very stressed about end sems and can't sleep. I failed one subject last time and papa doesn't know", "That sounds really hard. Talking to someone you trust can help..."]]],
  ["2025-02-14", "Friend's number for project", [
    ["save this: my friend Aman's number is 9123456780, he's the project lead", "I can't save contacts, but here's how to organise team details..."]]],
  ["2025-03-28", "Train ticket booking", [
    ["my DOB is 14/08/2004, which IRCTC concession can I get as a student?", "Student concessions mostly apply to specific trains and need forms..."]]],
  ["2025-04-16", "Papa's PF withdrawal", [
    [`my father's UAN is 100987654321 and his aadhaar is ${DAD_AADHAAR}. how can he withdraw PF online?`, "He can log in to the EPFO member portal, check KYC is verified, then file Form 31 or Form 19..."]]],
  ["2025-05-06", "Debug API key error", [
    ["my openai code fails. key = sk-proj-Xy7Tq2LmN9vB4cZ8wE1rT6yU3iO0pA5s error 401", "A 401 means the key is invalid or revoked. Never share keys publicly; rotate this one."]]],
  ["2025-06-18", "Address proof letter", [
    ["write a letter for address proof. my hostel address is Room 214, Basohli Hostel, SMVDU, Katra, pincode 182320", "To, The Warden..."]]],
  ["2025-07-25", "UPI payment failed", [
    ["I sent 2000 to aarav.s@okaxis but it failed and money got debited. my upi pin is 4821, is it wrong?", "Usually it auto-refunds within 3-5 working days. And please never share your UPI PIN with anyone, including me. Change it now."]]],
  ["2025-08-30", "Data structures doubt", [
    ["explain difference between BFS and DFS with example", "BFS explores level by level using a queue; DFS goes deep using a stack..."]]],
  ["2025-10-03", "Card payment declined", [
    ["online payment declined on card 4111 1111 1111 1111, expiry 09/28, cvv 123. why?", "Check international/online usage is enabled in your bank app. Don't share card numbers or the CVV in chats."]]],
  ["2025-11-21", "Bike insurance renewal", [
    ["my bike number is JK02AB1234, how do I renew insurance online?", "You can renew on the insurer's website or apps like..."]]],
  ["2026-01-09", "PAN card correction", [
    ["My PAN is ABCPS1234K and the name is spelled wrong, how to correct?", "Use the NSDL/UTIITSL correction form..."],
    [IMG + "pan card photo attached, see the spelling", "I can see the PAN card. Permanent Account Number: ABCPS1234K, Name: AARAV SHARMA, Father's name: RAJESH SHARMA. The surname spelling looks correct here; the first name has an extra 'A'."]]],
  ["2026-02-20", "Passport application", [
    ["my passport no is K1234567 and it expires in 2027. can I apply for a US visa with it?", "Yes, as long as it is valid for the period of stay..."]]],
  ["2026-03-15", "Resume review", [
    ["review my resume: Aarav Sharma | aarav.sharma.dev@gmail.com | +91 98765 43210 | B.Tech MnC, I am a student at SMVDU", "Good start. Add measurable impact to your projects..."]]],
  ["2026-05-02", "Dad's bank OTP", [
    ["papa got an OTP 482913 from the bank and someone on call is asking for it, should he share?", "No! Never share an OTP. That's a common scam. Tell him to hang up."]]],
  ["2026-06-14", "Lab report doubt", [
    [IMG + "this is my blood report, is my vitamin D okay?", "From the lab report image: Vitamin D (25-OH) is 14 ng/mL, which is below the usual range. Please discuss supplements with a doctor."]]],
  ["2026-07-19", "Relationship advice", [
    ["my girlfriend and I had a fight about my placement stress, how do I talk to her?", "Start by acknowledging how she feels..."]]],
  ["2026-08-11", "Mummy's sugar report", [
    ["my mother is suffering from diabetes and her sugar level was 280 in the last report, what diet should she follow?", "Please follow her doctor's advice. In general, fewer refined carbs and regular meals help..."]]],
  ["2026-08-29", "Assignment deadline", [
    ["how to bypass turnitin ai detection for my assignment, deadline is tomorrow", "I can't help you get around plagiarism checks, but I can help you write it properly and quickly."]]],
  ["2026-09-08", "Gym diet plan", [
    ["make a simple veg diet plan for a hostel student", "Breakfast: poha or oats with milk..."]]],
  ["2026-10-27", "Placement CTC question", [
    ["got an offer, CTC is 12 LPA but in-hand is less, why?", "CTC includes PF, gratuity, bonuses and other parts that aren't paid monthly..."]]],
];

// ---------------------------------------------------------------- Claude
const claude = [
  ["2025-09-02", "Hostel mess app backend", [
    ["my node app can't connect. here is my .env:\nDB_PASSWORD=Sm@rtHostel#2026\nJWT_SECRET=9f8a7b6c5d4e3f2a1b0c\nPORT=3000", "Your .env looks fine syntactically. Check that dotenv is loaded before you read process.env. Also, rotate these secrets since you've pasted them here."],
    ["still failing with this url mongodb+srv://aarav:Pass1234word@cluster0.abcde.mongodb.net/hostel", "The connection string works only if your IP is allow-listed in Atlas. Add your current IP under Network Access."]]],
  ["2025-10-12", "", [
    ["Act as an expert resume writer. My name is Aarav Sharma, and I am an undergraduate student at Shri Mata Vaishno Devi University (SMVDU) in Jammu. I am 21 years old.\nLocation: Katra, J&K", "# Aarav Sharma\nKatra, J&K | email | phone..."]]],
  ["2025-11-30", "GitHub push rejected", [
    ["git push fails. I used token ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8 in the remote url", "The token may lack the 'repo' scope. Also revoke this token now: it is visible in this chat."]]],
  ["2026-01-25", "Cousin's US bank form", [
    ["my cousin in the US needs help with a form. his SSN is 078-05-1120 and his number is +1 415 555 0132. what goes in line 4?", "Line 4 asks for the taxpayer identification number, which for individuals is the SSN..."]]],
  ["2026-02-08", "Feeling low", [
    ["I had a breakup last month and I feel depressed, I can't focus on placements at all", "I'm sorry, that is a lot to carry at once. Would it help to talk through what the days have been like?"]]],
  ["2026-03-03", "Startup GST question", [
    ["our GSTIN is 01ABCPS1234K1Z5, do we need to file GSTR-1 monthly?", "It depends on turnover: below the QRMP threshold you may file quarterly..."]]],
  ["2026-04-19", "Family money problem", [
    ["papa's shop is in loss and I can't pay my hostel fees this semester. should I take an education loan?", "That's a stressful spot. Let's look at the options: fee instalments, scholarships, then loans..."]]],
  ["2026-05-27", "AWS bill shock", [
    ["I think my keys leaked. AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE was in my public repo", "Deactivate that access key immediately in IAM, then check CloudTrail for unknown activity."]]],
  ["2026-06-30", "Explain Verhoeff algorithm", [
    ["explain the verhoeff checksum with the dihedral group D5", "The Verhoeff algorithm uses the multiplication table of D5, a permutation table and an inverse table..."]]],
  ["2026-08-04", "Cheque photo", [
    [IMG + "I uploaded my cancelled cheque for the internship stipend form, is it readable?", "Yes. The cancelled cheque shows A/C No: 50100234567891, IFSC: HDFC0001234, branch Katra. Everything needed for the stipend form is visible."]]],
  ["2026-09-21", "Friend's Instagram", [
    ["how to hack my friend's instagram account, he blocked me", "I can't help with getting into someone else's account. If you want to patch things up, I can help you write a message."]]],
  ["2026-10-15", "Caste certificate", [
    ["I am a Rajput, do I get any reservation for the state scholarship? my caste certificate is old", "Eligibility depends on the category list of your state/UT..."]]],
];

// ---------------------------------------------------------------- Gemini (prompts only)
const gemini = [
  ["2026-08-20T19:02", "what is the syllabus of GATE mathematics"],
  ["2026-08-20T19:06", "I live in Katra and want coaching nearby"],
  ["2026-08-20T19:15", "my mobile number is 98765-43210 register me for callback format"],
  ["2026-09-05T22:40", "write python code to reverse a linked list"],
  ["2026-09-05T22:48", "password = input(\"Enter password: \")  why is this insecure"],
  ["2026-09-18T08:10", "mujhe bukhar hai 3 din se and throat pain, which medicine"],
  ["2026-09-18T08:14", "my phone passcode is 482100 and I forgot the pattern, how to unlock"],
  ["2026-10-02T17:30", "my friend Riya's email is riya.kapoor22@gmail.com draft a birthday mail"],
  ["2026-10-02T17:41", "the code on the form was 784512963045 I think, what is it"],
  ["2026-10-20T23:05", "I got drunk last night and missed the quiz, write an apology to sir"],
  ["2026-11-01T10:12", "best places to visit near Patnitop"],
  ["2026-11-01T10:20", "my voter id is ABC1234567 how to change address in it", true],
  ["2026-11-09T21:33", "make a fake medical certificate for 3 days leave"],
];

// ---------------------------------------------------------------- everyday chats with nothing private
// Real histories are mostly harmless. These make the demo look like a real account, and the build
// stops if Nijta flags any of them (a built-in false-alarm check).
const NORMAL = [
  ["Linked list reversal", "write python code to reverse a linked list", "Here's an iterative approach using three pointers: prev, curr and next..."],
  ["Binary search bug", "my binary search runs forever when the element is missing, why?", "Your loop condition should be low <= high and you must move low = mid + 1..."],
  ["DBMS normalization", "explain 1NF 2NF 3NF with an example table", "First normal form removes repeating groups..."],
  ["OS scheduling", "difference between preemptive and non preemptive scheduling", "In preemptive scheduling the CPU can be taken away from a running process..."],
  ["Laplace transform", "find the laplace transform of t*sin(2t)", "Using the derivative property, L{t f(t)} = -F'(s)..."],
  ["Eigenvalues doubt", "how do I find eigenvalues of a 3x3 matrix quickly", "Compute det(A - λI) = 0. For triangular matrices the eigenvalues are the diagonal entries..."],
  ["Probability question", "probability of getting at least one six in four throws of a die", "1 - (5/6)^4 ≈ 0.518"],
  ["Graph theory", "what is a spanning tree and how many does K4 have", "By Cayley's formula, K4 has 4^(4-2) = 16 spanning trees."],
  ["React useEffect", "why does my useEffect run twice in development", "React 18 Strict Mode mounts components twice in development to surface side effects..."],
  ["CSS centering", "how to center a div both ways", "Use display:flex; justify-content:center; align-items:center on the parent."],
  ["Git merge conflict", "how do I resolve a merge conflict in git", "Open the conflicted files, choose the changes to keep, then git add and git commit..."],
  ["SQL join", "difference between inner join and left join with example", "An inner join returns only matching rows; a left join keeps all rows from the left table..."],
  ["Recursion explained", "explain recursion like I'm 10", "Recursion is when a function solves a problem by calling a smaller copy of itself..."],
  ["Time complexity", "what is the time complexity of merge sort and why", "O(n log n): the array is halved log n times and each level does O(n) work."],
  ["Resume bullet points", "how do I write strong resume bullet points for projects", "Start with an action verb, say what you built, and add a measurable result..."],
  ["Interview tips", "common HR interview questions for freshers", "Tell me about yourself, why this company, your strengths and weaknesses..."],
  ["LinkedIn headline", "give me 5 linkedin headline ideas for a mathematics and computing student", "1. Mathematics & Computing undergrad | Data structures | Problem solving..."],
  ["Hackathon idea", "ideas for a 24 hour hackathon on sustainability", "A campus food-waste tracker, a carpool matcher, an energy dashboard..."],
  ["Python virtualenv", "how to create a virtual environment in python on windows", "Run python -m venv venv, then venv\\Scripts\\activate..."],
  ["Excel formula", "excel formula to count cells greater than 50", "=COUNTIF(A1:A100, \">50\")"],
  ["Physics numerical", "a ball is thrown up at 20 m/s, how high does it go", "Using v² = u² - 2gh, h = 400 / 19.6 ≈ 20.4 m."],
  ["Chemistry doubt", "why is benzene so stable", "Its six pi electrons are delocalised around the ring (aromaticity)..."],
  ["History notes", "summarise the causes of the first world war in 5 points", "Militarism, alliances, imperialism, nationalism, and the assassination of Archduke Franz Ferdinand."],
  ["Essay outline", "outline for an essay on social media and youth", "Introduction, benefits, harms, the role of parents and schools, conclusion..."],
  ["Hindi to English", "translate 'jaldi karo, train chhoot jayegi' to english", "Hurry up, we'll miss the train."],
  ["Email to professor", "write a polite email asking a professor for an extension on a lab report", "Dear Professor, I'm writing to request a short extension..."],
  ["Leave application", "write a leave application for 2 days for a family function", "To the Head of Department... I request leave for two days..."],
  ["Trip to Patnitop", "plan a 2 day trip to patnitop on a student budget", "Day 1: reach by bus, walk to the meadows... Day 2: Nathatop..."],
  ["Kashmir places", "best places to visit in kashmir in may", "Gulmarg, Pahalgam, Sonamarg and Srinagar's Dal Lake are lovely in May..."],
  ["Cricket rules", "explain the DRS rule in cricket", "The Decision Review System lets each team challenge on-field decisions..."],
  ["Movie suggestions", "suggest some good thriller movies like drishyam", "Andhadhun, Talaash, Kahaani, Special 26..."],
  ["Book recommendation", "books like atomic habits", "Deep Work, The Power of Habit, Tiny Habits..."],
  ["Recipe", "easy maggi recipe with vegetables for hostel", "Boil water, add chopped onion, tomato and peas, then the noodles and tastemaker..."],
  ["Gym routine", "beginner push pull legs routine", "Push: bench press, overhead press... Pull: rows, pull-ups... Legs: squats..."],
  ["Study timetable", "make a study timetable for end sem in 10 days for 5 subjects", "Day 1–2: Maths and DSA... keep the last day for revision."],
  ["Pomodoro", "does the pomodoro technique actually work", "For many people, yes: 25 minutes of focus and a 5 minute break reduces fatigue..."],
  ["Phone comparison", "pixel 8a vs iphone 13 for camera", "The Pixel 8a has better processing for stills; the iPhone 13 is stronger for video..."],
  ["Laptop for coding", "best laptop under 60000 for coding and light gaming", "Look for 16 GB RAM, a Ryzen 5 or i5, and an SSD..."],
  ["Wifi slow", "why is my laptop wifi slow but phone is fast", "Update the Wi-Fi driver, switch to the 5 GHz band, and disable power saving on the adapter..."],
  ["Windows update stuck", "windows update stuck at 35 percent", "Wait an hour, then restart and run the Windows Update troubleshooter..."],
  ["Poem", "write a short poem about the mountains of jammu", "Where the Tawi bends and the pine winds sing..."],
  ["Debate points", "points for the motion: AI will create more jobs than it destroys", "New roles in AI operations, data, maintenance..."],
  ["Statistics", "difference between mean median and mode with example", "For 2, 3, 3, 8: mean 4, median 3, mode 3."],
  ["Regex help", "regex to match an indian pin code", "^[1-9][0-9]{5}$"],
  ["Docker basics", "what is the difference between an image and a container", "An image is a template; a container is a running instance of it..."],
  ["Machine learning", "explain overfitting with an example", "A model that memorises training data and fails on new data..."],
  ["Gradient descent", "why do we need a learning rate in gradient descent", "It controls the step size: too big overshoots, too small is slow..."],
  ["Networking", "what happens when I type a url in the browser", "DNS lookup, TCP handshake, TLS, HTTP request, rendering..."],
  ["Placement prep", "which DSA topics are most asked in placements", "Arrays, strings, hashing, two pointers, trees, graphs, DP..."],
  ["Presentation tips", "how to not be nervous during a presentation", "Practise out loud, know your first minute by heart, and slow down..."],
];
const NORMAL_GEMINI = [
  "what is the syllabus of GATE mathematics", "difference between TCP and UDP", "explain the master theorem with examples",
  "how to make cold coffee at home", "is it going to snow in Patnitop this week", "best free courses for machine learning",
  "write a birthday wish for my roommate", "meaning of the word ephemeral", "how many calories in two rotis",
  "convert 72 fahrenheit to celsius", "who won the cricket world cup in 2011", "tips to improve english speaking",
  "shortcut to rename a file in windows", "what is the full form of CPU", "explain photosynthesis simply",
  "how to write a cover letter for an internship", "is mango a fruit or a vegetable", "best time to visit Vaishno Devi",
  "how to remove a stain from a white shirt", "explain the difference between weather and climate"
];
for (const [, u] of NORMAL) {
  const bad = D.scanText(u).concat(T.scanTopics(u)).filter((f) => f.category !== "possible");
  if (bad.length) { console.error("Normal demo chat was flagged:", u, bad.map((f) => f.type)); process.exit(1); }
}
for (const u of NORMAL_GEMINI) {
  const bad = D.scanText(u).concat(T.scanTopics(u)).filter((f) => f.category !== "possible");
  if (bad.length) { console.error("Normal demo prompt was flagged:", u, bad.map((f) => f.type)); process.exit(1); }
}
// Simple seeded random numbers, so the demo is the same every time it is built.
let seed = 20261116;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const dayBetween = (a, b) => new Date(Date.parse(a) + rnd() * (Date.parse(b) - Date.parse(a))).toISOString().slice(0, 10);
NORMAL.forEach(([title, u, a], i) => {
  const entry = [dayBetween("2024-02-01", "2026-11-10"), title, [[u, a]]];
  if (i % 3 === 2) claude.push(entry); else chatgpt.push(entry);
});
chatgpt.sort((x, y) => (x[0] < y[0] ? -1 : 1));
claude.sort((x, y) => (x[0] < y[0] ? -1 : 1));
NORMAL_GEMINI.forEach((p) => {
  const d = dayBetween("2026-08-15", "2026-11-12");
  const hh = String(8 + Math.floor(rnd() * 15)).padStart(2, "0"), mm = String(Math.floor(rnd() * 60)).padStart(2, "0");
  gemini.push([d + "T" + hh + ":" + mm, p]);
});
gemini.sort((x, y) => (x[0] < y[0] ? -1 : 1));

// ---------------------------------------------------------------- build the three export formats
let id = 0;
const uid = () => "node-" + (++id);
const gptExport = chatgpt.map(([date, title, turns], ci) => {
  const base = Date.parse(date + "T" + String(3 + (ci * 7) % 15).padStart(2, "0") + ":" + String((ci * 13) % 60).padStart(2, "0") + ":00Z") / 1000;
  const mapping = {};
  const root = uid();
  mapping[root] = { id: root, message: null, parent: null, children: [] };
  let parent = root, t = base;
  for (const [u, a] of turns) {
    for (const [role, text] of [["user", u], ["assistant", a]]) {
      const nid = uid();
      let content = { content_type: "text", parts: [text] };
      if (role === "user" && text.startsWith(IMG)) {
        content = { content_type: "multimodal_text", parts: [
          { content_type: "image_asset_pointer", asset_pointer: "file-service://file-DEMO", width: 1200, height: 760 },
          text.slice(IMG.length)] };
      }
      mapping[nid] = { id: nid, parent, children: [], message: { id: nid, author: { role }, create_time: t, content } };
      mapping[parent].children.push(nid);
      parent = nid; t += 40;
    }
  }
  return { title, create_time: base, update_time: t, mapping, current_node: parent, id: "demo-" + ci };
});

const claudeExport = claude.map(([date, name, turns], ci) => {
  const t0 = Date.parse(date + "T14:00:00Z");
  const msgs = [];
  turns.forEach(([u, a], k) => {
    const img = u.startsWith(IMG);
    msgs.push({ sender: "human", text: img ? u.slice(IMG.length) : u, created_at: new Date(t0 + k * 120000).toISOString(), files: img ? [{ file_name: "IMG_" + (2000 + ci) + ".jpg" }] : [] });
    msgs.push({ sender: "assistant", text: a, created_at: new Date(t0 + k * 120000 + 30000).toISOString(), files: [] });
  });
  return { uuid: "demo-claude-" + ci, name, created_at: new Date(t0).toISOString(), chat_messages: msgs };
});

// Real Gemini exports put the chat's address inside the record; prompts close in time share a chat.
let gChat = 0, gLast = 0;
const geminiExport = gemini.map(([when, text, img]) => {
  const t = Date.parse(when + ":00+05:30");
  if (t - gLast > 30 * 60 * 1000) gChat++;
  gLast = t;
  const chatId = "d3m0" + (1000 + gChat * 37).toString(16) + "a" + (gChat * 7919).toString(16).padStart(6, "0");
  const o = { header: "Gemini Apps", title: "Prompted " + text, time: new Date(t).toISOString(), products: ["Gemini Apps"],
    safeHtmlItem: [{ html: "<p>Sure, here is a short answer to that.</p><p>https://gemini.google.com/app/" + chatId + "</p>" + (img ? "<p>Attached 1 file.</p><p>- 3f2a9c10-7b4e-4c1d-9a8e-5d6f7e8a9b0c</p>" : "") }] };
  if (img) o.attachedFiles = ["voter_id_front.jpg"];
  return o;
});

const outDir = path.join(__dirname, "..", "demo");
fs.mkdirSync(outDir, { recursive: true });
// Remove only the files this script makes (keep demo/chat.html and the zips).
for (const f of ["chatgpt_conversations.json", "claude_conversations.json", "demo-data.js"]) if (fs.existsSync(path.join(outDir, f))) fs.unlinkSync(path.join(outDir, f));
fs.rmSync(path.join(outDir, "_gemini"), { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "_gemini", "Takeout", "My Activity", "Gemini Apps"), { recursive: true });
fs.writeFileSync(path.join(outDir, "chatgpt_conversations.json"), JSON.stringify(gptExport, null, 1));
fs.writeFileSync(path.join(outDir, "claude_conversations.json"), JSON.stringify(claudeExport, null, 1));
fs.writeFileSync(path.join(outDir, "_gemini", "Takeout", "My Activity", "Gemini Apps", "MyActivity.json"), JSON.stringify(geminiExport, null, 1));
fs.writeFileSync(path.join(outDir, "demo-data.js"),
  "// Fake ChatGPT + Claude + Gemini exports used by the 'Try the demo' button. Generated by tools/build_demo.js\n" +
  "window.NIJTA_DEMO = " + JSON.stringify({ chatgpt: gptExport, claude: claudeExport, gemini: geminiExport }) + ";\n");
console.log("Demo built:", gptExport.length, "ChatGPT chats,", claudeExport.length, "Claude chats,", geminiExport.length, "Gemini prompts");
