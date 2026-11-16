// Run with:  node tests/test_detectors.js
// Checks that the scanner finds what it should and ignores what it should.
const D = require("../js/detectors.js");

function aadhaar(first11) { return first11 + D.verhoeffDigit(first11); }
const A1 = aadhaar("99994105705");                 // fake, checksum-valid
const A1fmt = A1.slice(0, 4) + " " + A1.slice(4, 8) + " " + A1.slice(8);
const BAD_A = A1.slice(0, 11) + ((+A1[11] + 1) % 10); // wrong check digit

const cases = [
  // [text, expected types found (in order), description]
  [`my aadhaar number is ${A1fmt}`, ["aadhaar"], "Aadhaar with context"],
  [`aadhar: ${A1}`, ["aadhaar"], "Aadhaar no spaces"],
  [`aadhaar ${BAD_A}`, ["aadhaar"], "Labelled Aadhaar with a typo is still flagged"],
  [`${BAD_A} is the number`, [], "Unlabelled 12 digits with wrong checksum is rejected"],
  [`order id 123456789012 shipped`, [], "Random 12 digits without checksum/context"],
  [`My PAN is ABCPE1234F`, ["pan"], "PAN"],
  [`pan card abcpe1234f`, ["pan"], "lowercase PAN with context"],
  [`call me on 98765 43210`, ["phone"], "Phone with space"],
  [`+91-9876543210 is my whatsapp`, ["phone"], "Phone with +91"],
  [`mail me at rahul.sharma@gmail.com`, ["email"], "Email"],
  [`send to rahul99@okaxis please`, ["upi"], "UPI ID"],
  [`card 4111 1111 1111 1111 expiry 08/27`, ["card"], "Valid card (Luhn)"],
  [`card 4111 1111 1111 1112`, [], "Card failing Luhn"],
  [`my account number is 50100234567891 and IFSC HDFC0001234`, ["bank", "ifsc"], "Bank + IFSC"],
  [`the population was 1400000000 in 2023`, [], "Big number without bank words"],
  [`my password is Rahul@1234`, ["password"], "Password"],
  [`I forgot my password, how to reset it?`, [], "Talking about passwords is fine"],
  [`I need to pass the exam`, [], "'pass' as a verb"],
  [`wifi password: hostel5G#2025`, ["password"], "Wi-Fi password"],
  [`my key is sk-proj-AbCdEf1234567890GhIjKlMn`, ["apikey"], "OpenAI-style key"],
  [`-----BEGIN RSA PRIVATE KEY-----`, ["privatekey"], "Private key"],
  [`OTP is 482913`, ["otp"], "OTP"],
  [`my salary is 45,000 per month`, ["money"], "Salary"],
  [`I took a loan of 2 lakh`, ["money"], "Loan"],
  [`my DOB is 14/08/2004`, ["dob"], "Date of birth"],
  [`my hostel address is Room 214, Basohli Hostel, SMVDU Katra`, ["address"], "Address"],
  [`pincode 182320`, ["pincode"], "PIN code"],
  [`my bike number is JK02AB1234`, ["vehicle"], "Vehicle"],
  [`passport no K1234567`, ["passport"], "Passport"],
  [`K1234567 is a product code`, [], "Passport-shaped code without context"],
  [`my voter id is ABC1234567`, ["voter"], "Voter ID"],
  [`what is the capital of France?`, [], "Normal question"],
  // --- added after real Gemini test (Day 1.2) ---
  [`password = input("Enter password: ")`, [], "Password variable in code"],
  [`if password == confirm_password: print("ok")`, [], "Password comparison in code"],
  [`import getpass\npassword = getpass.getpass()`, [], "getpass in code"],
  [`I live in india jammu I want best way to save money`, ["city"], "City is not a full address"],
  [`my address is House 12, Gandhi Nagar, Jammu 180004`, ["address"], "Real address"],
  [`I am from starting from scratch`, [], "'I am from scratch' is not a place"],
  [`I'm from CSE branch and need help`, [], "Branch is not a place"],
  [`I am from Katra, J&K`, ["city"], "Known place"],
  [`i am from udhampur and studying`, ["city"], "Known place, lowercase"],
  [`I am from Bhaderwah`, ["city"], "Unknown but capitalised place"],
  // --- Identity (Day 1.5) ---
  [`My name is Madhav Sharma, and I am an undergraduate student at Shri Mata Vaishno Devi University (SMVDU) in Jammu.`, ["name", "institution", "institution"], "Resume prompt: name + college"],
  [`Location: Jammu, J&K`, ["city"], "Location field"],
  [`this is Python code`, [], "'this is Python' is not a name"],
  [`Delhi University is famous for its colleges`, [], "College mentioned, not yours"],
  [`I'm a student at NIT Srinagar`, ["institution"], "NIT"],
  // --- Day 3: wider net ---
  [`aadhaar no.-${A1.slice(0,4)}.${A1.slice(4,8)}.${A1.slice(8)}`, ["aadhaar"], "Aadhaar with dots after a dash"],
  [`my aadhaar is XXXX XXXX 4583`, ["aadhaar"], "Masked Aadhaar"],
  [`call 987-654-3210`, ["phone"], "Phone with dashes"],
  [`(+91) 98765-43210`, ["phone"], "Phone with brackets"],
  [`my US friend's number is +1 415 555 0132`, ["phone"], "International phone"],
  [`upi pin is 4821`, ["cvv"], "UPI PIN"],
  [`my phone passcode is 482100`, ["pin"], "Passcode"],
  [`pin: 182320, district Reasi`, ["pincode"], "Postal PIN is not a secret PIN"],
  [`DB_PASSWORD=Sm@rtHostel#2026`, ["secretvar"], ".env password"],
  [`API_KEY=your_api_key_here`, [], "Placeholder key ignored"],
  [`const client_secret = "a8f3k29dk2l1x9s8d7f6"`, ["secretvar"], "client secret in code"],
  [`mongodb+srv://aarav:Pass1234word@cluster0.abcde.mongodb.net/hostel`, ["connstr"], "Database link with password"],
  [`mongodb+srv://user:<password>@cluster0.mongodb.net`, [], "Database link placeholder"],
  [`his SSN is 078-05-1120`, ["ssn"], "US SSN"],
  [`IBAN GB82 WEST 1234 5698 7654 32`, ["iban"], "IBAN with valid checksum"],
  [`IBAN GB82 WEST 1234 5698 7654 33`, [], "IBAN with wrong checksum"],
  [`our GSTIN is 01ABCPS1234K1Z5`, ["gstin"], "GSTIN"],
  [`my roll number is 22BMC045 and enrollment no: 2022/BT/1187`, ["genericid", "genericid"], "Roll + enrolment numbers"],
  [`my UAN is 100987654321`, ["uan"], "PF UAN"],
  [`ABHA 91-1234-5678-9012`, ["abha"], "ABHA health ID"],
  [`I am 21 years old`, ["age"], "Age"],
  [`I am 21 minutes late`, [], "Not an age"],
  [`wallet 0x52908400098527886E0F7030069857D2E4169EE7`, ["crypto"], "ETH wallet"],
  [`- 09332030-810a-414a-8de5-26509f037ed4`, [], "File ID (UUID) is not a phone number"],
  [`- 7d4cd4cc-02f4-4848-a2b1-c790d5c311bf\n- 8792ca51-e096-49ca-8bd9-9ea3d6d41b1e`, [], "More file IDs"],
  [`https://example.org/item/9876543210/view`, [], "Number inside a web address"],
  [`commit 9f8a7b6c5d4e3f2a1b0c9876543210ab`, [], "Hash is not a phone number"],
  [`order9876543210x`, [], "Digits glued to letters"],
  // --- Day 4: even wider ---
  [`my friend Aman Verma is the lead`, ["othername"], "Friend's name"],
  [`my brother has fever`, [], "Relation without a name"],
  [`my linkedin is linkedin.com/in/aarav-sharma-dev`, ["social"], "LinkedIn link"],
  [`my insta id is aarav.s_04`, ["handle"], "Instagram handle"],
  [`I work at Tata Consultancy Services as an intern`, ["institution"], "Employer"],
  [`my cgpa is 7.8 and I have 1 backlog`, ["grades"], "CGPA"],
  [`ssh into my server ip 143.110.186.25`, ["ip"], "Server IP"],
  [`version 1.2.3.4 of the app`, [], "Version number is not an IP"],
  [`I am at 32.9915, 74.9318 right now`, ["gps"], "GPS"],
  [`seed phrase: apple river stone cloud tiger maple ocean lamp chair green bird stone`, ["seed"], "Seed phrase"],
  [`my cibil score is 742`, ["money"], "Credit score"],
  [`my JKSSB application no is 2026/448812`, ["genericid"], "Exam application number"],
  [`my DL number is JK02 20190012345`, ["dl"], "Driving licence new format"],
  [`driving licence no: JK-0220150034567`, ["dl"], "Driving licence with dash"],
  [`my licence number is J&K/02/12345/2010`, ["dl"], "Old licence format, labelled"],
  [`my aadhaar VID is 9123 4567 8901 2345`, ["vid"], "Aadhaar Virtual ID"],
  [`def f(x): return x*2  # O(n) complexity, n = 1000000`, [], "Code snippet"],
];

let pass = 0, fail = 0;
for (const [text, expected, name] of cases) {
  const got = D.scanText(text).map(f => f.type).filter(x => x !== "longnum" && x !== "shortnum");   // "possible" tier tested separately
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) pass++; else { fail++; console.log(`FAIL  ${name}\n      text: ${text}\n      expected ${JSON.stringify(expected)} got ${JSON.stringify(got)}`); }
}

// Whose data is it?
const owners = [
  [`my mom's aadhaar is ${A1fmt}`, "other", "mother"],
  [`my aadhaar is ${A1fmt}`, "self", null],
  [`my friend Aman's number is 9876543210`, "other", "friend"],
  [`papa ka number 9876543210 hai`, "other", "father"],
  [`bro I live in Jammu and need help`, "self", null],
];
for (const [text, owner, rel] of owners) {
  const f = D.scanText(text)[0];
  const ok = f && f.owner === owner && f.relation === rel;
  if (ok) pass++; else { fail++; console.log(`FAIL  owner for: ${text} -> ${f && f.owner}/${f && f.relation}`); }
}

// "Possible" tier: unknown long numbers are kept, with low confidence.
{
  const p = D.scanText("the code on the form was 784512963045 I think");
  if (p.length === 1 && p[0].type === "longnum" && p[0].confidence < 0.5) pass++; else { fail++; console.log("FAIL  longnum", p); }
  const q = D.scanText("the population was 1400000000 in 2023");
  if (q.length === 0) pass++; else { fail++; console.log("FAIL  longnum context", q); }
}

// Masking never shows the full value.
const m = D.scanText(`aadhaar ${A1fmt} card 4111 1111 1111 1111 password is Secret@99`).map(D.mask);
const leaks = m.filter(x => x.includes(A1.slice(0, 8)) || x.includes("4111 1111 1111 1111") || x.includes("Secret@99"));
if (leaks.length === 0) pass++; else { fail++; console.log("FAIL  masking leaked", leaks); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
