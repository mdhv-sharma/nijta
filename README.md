# Nijta (निजता): what have you told AI?

**Find what you told AI. Understand what they can do with it. Take it back.**

Nijta reads the official chat export from ChatGPT, Claude or Gemini and finds every ID number, bank detail,
password, phone number and sensitive topic you shared, and whose data it was. It runs completely inside the
browser: no server, no upload, works offline, installs on phones.

Project Expo 2026 · Shri Mata Vaishno Devi University (SMVDU), Katra

- **Team:** Madhav Sharma · Prabhat · Kartik Gaykwad (B.Tech Mathematics & Computing)
- **Faculty mentor:** Dr. Kuldip Raj
- **Live app:** https://mdhv-sharma.github.io/nijta/

- **How to use it:** [HOW_TO_USE.md](HOW_TO_USE.md)

## Run it
- Double-click (or right-click → Open with Chrome) **index.html**, or
- `python -m http.server 8000` in this folder and open http://localhost:8000, or
- the GitHub Pages link once it is online.

## The three parts
| Tab | What it does | Main files |
|---|---|---|
| **1 · Find it** | Scans the export: Indian IDs (Aadhaar with the Verhoeff checksum, PAN, DL, passport, voter ID, UAN, ABHA, GSTIN), cards (Luhn check), bank and IFSC, UPI, IBAN, phone (any format, Hindi digits), email (also spelled out), passwords, PINs, OTPs, API keys and secrets in code, address, city, GPS, names (yours and people you know), college, marks, social handles; sensitive topics (health, mental health, relationships, family, money trouble, beliefs, sexual, legal, risky requests); IDs the AI read from your uploaded photos; document photos. Two risk scores, delete checklist with links to each chat, search, Mask, PDF report. | `js/detectors.js`, `js/topics.js`, `js/parsers.js`, `js/scan.js`, `js/app.js` |
| **2 · Understand it** | Privacy-policy changes of AI apps: what changed, how it affects you, what you can do. Updated daily by GitHub Actions; email alerts through GitHub issues; RSS feed. Real leak incidents with sources. Steps to stop chats being used for training. | `js/policy.js`, `js/policy_kb.js`, `data/policy_changes.js`, `tools/policy_watch.js`, `.github/workflows/policy-watch.yml` |
| **3 · Take it back** | Drafts a request under India's DPDP Act, 2023 (Sections 11, 12, 6(4), 13; 90-day reply limit in Rule 14(3) of the DPDP Rules, 2025; rights in force from 13 May 2027), opens it as a Gmail draft, and counts the 90 days. | `js/rights.js` |

**Maximum sensitivity** also shows uncertain items ("Possible"). Normal mode shows only confident findings.

## Demo
- **Try with demo data:** one invented student across ChatGPT, Claude and Gemini (119 chats, most of them
  ordinary). Everything is fake. **Go to chat** opens a simulated chat page (`demo/chat.html`) where you can
  delete the chat; Nijta's checklist ticks itself.
- **Demo export files:** `demo/demo_chatgpt_export.zip`, `demo/demo_claude_export.zip`, `demo/demo_gemini_takeout.zip`.
- Rebuild: `node tools/build_demo.js` (it stops if any ordinary demo chat gets flagged).

## Tests
```
node tests/test_detectors.js   # 100 unit tests
node tests/test_topics.js      # 35 unit tests
node tests/eval_corpus.js      # 88 realistic messages: must-find and must-ignore
```

## Automatic updates
- `sw.js` loads the newest files whenever there is internet, and the saved copy when offline, so new rules
  and policy changes reach everyone without reinstalling.
- `tools/policy_watch.js` (daily on GitHub): downloads each page in `data/policy_sources.json`, compares a
  SHA-256 hash with the saved snapshot, finds added/removed sentences, sorts them into privacy topics, adds an
  entry, updates `data/feed.xml`, and opens a GitHub issue so watchers get an email.

## Privacy
No server, no accounts, no analytics. Chats are read in the browser and never sent anywhere. Ticks, settings and
the request tracker are stored only on the user's device. Not legal advice.
