// Evaluation set: realistic messages written the way people actually type.
// Run:  node tests/eval_corpus.js
// MUST_FIND: each message must produce at least the listed types.
// MUST_IGNORE: normal messages that must produce NO findings (except the "Possible" tier when noted).
global.window = globalThis;
const D = require("../js/detectors.js");
const T = require("../js/topics.js");
const A = (s) => { const n = s + D.verhoeffDigit(s); return n; };
const AAD = A("99992013458"), AADs = `${AAD.slice(0, 4)} ${AAD.slice(4, 8)} ${AAD.slice(8)}`;

const MUST_FIND = [
  // ---- IDs
  [`bhai mera aadhar ${AAD} hai isme address update kaise kare`, ["aadhaar"]],
  [`Aadhaar no: ${AADs}`, ["aadhaar"]],
  [`uid ${AAD.slice(0, 4)}-${AAD.slice(4, 8)}-${AAD.slice(8)} link karna hai pan se`, ["aadhaar"]],
  [`आधार ${AADs}`, ["aadhaar"]],
  [`my pan card no is abcps1234k`, ["pan"]],
  [`PAN: ABCPS1234K, DOB 14-08-2004`, ["pan", "dob"]],
  [`passport number - K1234567`, ["passport"]],
  [`my DL is JK0220220012345`, ["dl"]],
  [`voter card ABC1234567`, ["voter"]],
  [`car no. HR26DK8337 ka challan check karo`, ["vehicle"]],
  // ---- Money
  [`a/c no 50100234567891 ifsc hdfc0001234`, ["bank", "ifsc"]],
  [`account number: 123456789012, branch Katra`, ["bank"]],
  [`card 5555 5555 5555 4444 exp 11/27 cvv 321`, ["card", "cvv"]],
  [`send money to rahul.sharma@ybl`, ["upi"]],
  [`gpay pe 9876543210@paytm bhej do`, ["upi"]],
  [`my atm pin is 4567`, ["cvv"]],
  [`salary 8.5 lpa hai mera`, ["money"]],
  // ---- Contact
  [`whatsapp me on 98765-43210`, ["phone"]],
  [`call karo 09876543210 pe`, ["phone"]],
  [`+91 98765 43210`, ["phone"]],
  [`email: aarav.sharma.dev@gmail.com`, ["email"]],
  [`my email is aarav dot sharma at gmail dot com`, ["email"]],
  [`I was born on 14 Aug 2004`, ["dob"]],
  [`DOB: 14/08/2004`, ["dob"]],
  // ---- Secrets
  [`my password is Aarav@2004`, ["password"]],
  [`insta password: sunshine_99`, ["password"]],
  [`gmail ka password hai Rahul#123`, ["password"]],
  [`my pass is Qwerty@12`, ["password"]],
  [`OTP 482913 aaya hai`, ["otp"]],
  [`key=sk-proj-Ab12Cd34Ef56Gh78Ij90Kl12Mn34`, ["apikey"]],
  [`STRIPE_SECRET_KEY=sk_live_51HxYzAbCdEfGhIjKl`, ["secretvar"]],
  // ---- Location / identity
  [`my address is H.No 45, Ward 6, Udhampur 182101`, ["address"]],
  [`flat no 302, Green Valley Apartments, Jammu`, ["address"]],
  [`I live in Udhampur`, ["city"]],
  [`My name is Riya Kapoor`, ["name"]],
  [`I'm a 3rd year B.Tech student at SMVDU`, ["institution"]],
  [`my roll no is 22BMC045`, ["genericid"]],
  [`my friend Aman Verma's number is 9123456780`, ["othername", "phone"]],
  // ---- Hindi digits
  [`मेरा नंबर ९८७६५४३२१० है`, ["phone"]],
];

const TOPICS_FIND = [
  [`I have been diagnosed with PCOS last month`, "t_health"],
  [`mummy ko sugar hai, kya khana chahiye`, "t_health"],
  [`I feel so lonely in hostel, nobody talks to me`, "t_mental"],
  [`my girlfriend broke up with me yesterday`, "t_relationship"],
  [`papa doesn't know I failed`, "t_family"],
  [`I can't pay my fees this sem`, "t_money"],
  [`how to bypass turnitin`, "t_risky"],
  [`police complaint against my landlord`, "t_legal"],
];

const MUST_IGNORE = [
  // coding
  `for i in range(1000000): total += i * 2`,
  `const port = process.env.PORT || 3000;`,
  `SELECT * FROM users WHERE id = 1234567890;`,
  `password = input("Enter your password: ")`,
  `if (password.length < 8) return "weak";`,
  `API_KEY=your_api_key_here`,
  `git commit -m "fix bug" && git push origin main`,
  `error at line 1234 column 56 in file main.py`,
  `npm install react@18.2.0`,
  `docker run -p 8080:80 nginx:1.25.3`,
  `my uuid is 550e8400-e29b-41d4-a716-446655440000`,
  `commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`,
  // maths and science
  `what is 123456789 * 987654321`,
  `prove that 2^31 - 1 = 2147483647 is prime`,
  `speed of light is 299792458 m/s`,
  `India's population is about 1400000000`,
  `the value of pi to 10 places is 3.1415926535`,
  `solve x^2 - 5x + 6 = 0`,
  // dates, prices, ids that aren't personal
  `the exam is on 14/08/2026`,
  `iphone 15 price is Rs 79900`,
  `my order #402-1234567-8901234 from amazon hasn't arrived`,
  `track my parcel EE123456789IN`,
  `isbn 978-3-16-148410-0`,
  `https://example.org/products/9876543210/view`,
  `call 1800-180-1234 for customer care`,
  `dial 112 in an emergency`,
  // general questions
  `explain how cancer cells divide`,
  `write an essay on mental health awareness`,
  `what is the capital of France`,
  `best places to visit in Kashmir`,
  `how does the heart pump blood`,
  `summarise chapter 5 of the history book`,
  `difference between BFS and DFS`,
  `I need to pass the exam`,
  `I forgot my password, how do I reset it`,
  `what is a good password policy`,
  `I am 5 minutes late`,
  `this is Python code`,
  `Delhi University is famous`,
  `I am from starting from scratch`,
  `What if I made a betting app?`,
];

let pass = 0, fail = 0, possible = 0;
for (const [text, want] of MUST_FIND) {
  const got = D.scanText(text).filter((f) => f.category !== "possible").map((f) => f.type);
  const missing = want.filter((w) => !got.includes(w));
  if (!missing.length) pass++; else { fail++; console.log(`MISSED  ${missing.join(",")}  in: ${text}   (got ${JSON.stringify(got)})`); }
}
for (const [text, want] of TOPICS_FIND) {
  const got = T.scanTopics(text).map((f) => f.type);
  if (got.includes(want)) pass++; else { fail++; console.log(`MISSED  ${want}  in: ${text}   (got ${JSON.stringify(got)})`); }
}
for (const text of MUST_IGNORE) {
  const all = D.scanText(text).concat(T.scanTopics(text));
  const real = all.filter((f) => f.category !== "possible");
  possible += all.length - real.length;
  if (!real.length) pass++; else { fail++; console.log(`FALSE   ${real.map((f) => f.type + "=" + f.value).join(", ")}  in: ${text}`); }
}
const total = MUST_FIND.length + TOPICS_FIND.length;
console.log(`\n${pass} passed, ${fail} failed  (${total} must-find, ${MUST_IGNORE.length} must-ignore; ${possible} low-confidence "Possible" items on normal text)`);
process.exit(fail ? 1 : 0);
