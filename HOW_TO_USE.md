# How to use Nijta 🛡️
### A simple guide, step by step

---

## What is Nijta?

When you chat with ChatGPT, Claude or Gemini, everything you type is saved by that company.
Over time you may have typed your Aadhaar number, your bank details, a password, your mother's
medical report, or something very personal, and then forgotten about it.

**Nijta finds all of that for you**, shows you exactly where it is, and helps you delete it.

**Nijta never sends your chats anywhere.** Everything happens inside your own browser.
It even works with the Wi-Fi switched off.

---

## What you need

- A **laptop or computer** (Windows, Mac or Linux)
- **Google Chrome** or **Microsoft Edge**
- The **Nijta folder** (the zip file you were sent)

That's all. Nothing to install.

---

## Part 1: Open Nijta

1. Find the Nijta zip file in your **Downloads** folder.
   (Once your team has put Nijta online, you can simply open the link instead and skip to Part 2.)
2. **Right-click** it and choose **Extract All**, then click **Extract**.
3. Open the new folder, then open the **nijta** folder inside it.
4. Find the file called **index.html**.
5. **Right-click** it → **Open with** → **Google Chrome** (or Microsoft Edge).

   ⚠️ Don't just double-click it. On some laptops that opens a code editor (like VS Code) instead of the browser.

6. Nijta opens in your browser. You'll see **"What have you told AI?"** at the top. 🎉

---

## Part 2: Try it first with pretend data

Before using your own chats, see how it works with fake data.

1. Click the button **Try with demo data**.
2. Wait 2 seconds.
3. You'll see a made-up student called "Aarav" with lots of private things found.
   **Everything in the demo is fake.** No real numbers.

Look around and click things. You can't break anything.

**Try the full flow in the demo:**
- Click **View** on any finding to read that chat inside Nijta.
- Click **Go to chat ↗** to open a pretend chat app page (clearly marked "Demo only").
  Press **Delete this chat** there, then come back to Nijta: the chat is ticked in "Chats to delete" by itself.

💡 The `demo` folder also has three fake export files (`demo_chatgpt_export.zip`, `demo_claude_export.zip`,
`demo_gemini_takeout.zip`). Drop them in to show judges exactly how a real export is scanned.

---

## Part 3: Get your own chats

Every AI app has an **"Export data"** button. It sends you a file with all your chats.
Do this on your **laptop**.

### ChatGPT
1. Open **chatgpt.com** and log in.
2. Click your **name or picture** (bottom-left) → **Settings**.
3. Click **Data controls**.
4. Click **Export data** → **Confirm export**.
5. Wait for an email from OpenAI. It can take a few minutes, or sometimes a few days.
6. Click the link in the email. A **.zip** file downloads. **Don't unzip it.**

### Claude
1. Open **claude.ai** on your laptop and log in. (This can't be done from the phone app.)
2. Click your **name** (bottom-left) → **Settings** → **Privacy**.
3. Click **Export data**.
4. Wait for the email. It gives you **download links**.
5. Download the file called **conversations-000.zip**. That one has your chats.

   💡 If you drop the small "manifest" file into Nijta by mistake, Nijta shows a button to download the right one.

6. Download it quickly. The link stops working after 24 hours.

### Gemini
1. Open **takeout.google.com** and log in with the Google account you use for Gemini.
2. Click **Deselect all** at the top.
3. Scroll down and tick **My Activity**.
4. In that row, click **Multiple formats** → change **HTML** to **JSON** → **OK**.
   (This step is important. Nijta can't read the HTML version.)
5. Click **All activity data included** → **Deselect all** → tick only **Gemini Apps** → **OK**.
6. Scroll down → **Next step** → **Create export**.
7. Wait for Google's email, then click **Download your files**. A **.zip** file downloads.

---

## Part 4: Scan your chats

1. Open Nijta (Part 1).
2. **Drag** your zip file from Downloads onto the dashed box,
   or click **Choose file** and pick it.
3. Wait a few seconds while it says "Reading your chats…".
4. Your results appear.

💡 **You can scan several apps together.** Click **Choose file**, hold **Ctrl**, and click your
ChatGPT zip, Claude zip and Gemini zip. Nijta shows them all in one place.

---

## Part 5: Understand your results

### The score at the top
- A **big number out of 100**: higher means more private stuff found.
- **Fraud & identity risk**: things that could be used to steal money or pretend to be you
  (Aadhaar, PAN, bank details, passwords, phone numbers).
- **Sensitive personal info**: things that could embarrass you
  (health, relationships, family problems, religion or caste, and so on).

### "What you shared" boxes
Each box shows one type of thing, like **2 Aadhaar numbers** or **1 Password**.
**Click a box** to see only those items.

### Special warning boxes
- 🧩 **"Together these identify you"**: your name plus college plus city can tell a stranger exactly who you are.
- 👥 **"Other people's data"**: you shared your mother's, father's or friend's details.
- 📷 **"You uploaded images"**: you sent photos or files. Nijta can't see inside pictures,
  so check those chats yourself.

### The list of findings
Each item shows:
- **What it is** (for example "Aadhaar number")
- **Whose it is**: "Yours", "Mother's data", "Friend's data" or "Owner unclear"
- **How sure Nijta is** (for example "97% sure")
- **Which app, which chat, and when**

Small labels you may see:
- **In AI's reply**: the AI wrote your number back to you, for example after reading your photo.
- **Possible** (only with Maximum sensitivity on): Nijta isn't sure. Check it yourself. These never change your score.

Buttons on each item:
- **View**: opens that chat inside Nijta, with the private part highlighted in orange.
- **Open in ChatGPT / Open in Claude**: opens that exact chat on the website so you can delete it.
- **For Gemini**: **Open this chat** (if available), **My Activity (this time)**,
  **Copy prompt** (paste it into Gemini's search to find the chat), or **Gemini app**.

### Tools near the top
- 🔎 **Search box**: type anything (a name, a number, a word) and see every message that has it.
  This is your safety net for anything Nijta missed.
- **Maximum sensitivity**: tick it to also see uncertain items (marked **Possible**), like an
  unknown long number or a sensitive word in a sentence that doesn't look personal.
  Normally Nijta only shows what it's sure about. Turn this on when you want nothing skipped.
- **Save report (PDF)**: saves a report with all private values hidden.
- **Mask** switch (top-right): hides every real number and word on screen.
  **Turn it on before showing your screen to anyone.**

### "Didn't find something?"
Scroll down and open this box. Type the sentence the way you wrote it to the AI.
Nijta tells you what it finds, or why it missed it.

---

## Part 6: Delete the risky chats

1. Scroll to **Chats to delete**.
2. Each row is one chat with private data. The most dangerous ones are at the top.
3. Click **Open in ChatGPT** (or Claude, or Gemini).
4. In the AI app, delete that chat (usually the **⋯** menu → **Delete**).
5. Come back to Nijta and **tick the box** next to that chat.
6. Nijta counts your progress: "3 of 8 done".

⚠️ **Also do this:** if Nijta found a **password, PIN or API key**, change it today.
Deleting the chat doesn't undo the leak.

---

## Part 7: The "Understand it" tab

Click **2 · Understand it** at the top.

- **Policy changes**: when an AI company changes its rules, you see what changed,
  how it affects you, and what you can do. **NEW** marks changes you haven't seen, and a blue
  banner at the top tells you when you open Nijta.
  Once Nijta is online, it checks the policies every day by itself (see GITHUB_SETUP.md).
- **Why this matters**: real cases where AI chats leaked, each with a link to the news story.
- **Stop your chats being used for training**: exact steps for ChatGPT, Claude and Gemini.
  Do these today. It takes 2 minutes.

---

## Part 8: The "Take it back" tab

This writes a formal letter asking the company to delete your data, using India's data-protection law.

1. Click **3 · Take it back**.
2. Type your **name** and the **email** you use on that AI app.
3. Choose the **company** and **what you want** (for example "Erase my data").
4. Click **Write my request**. The letter appears. You can change anything in it.
5. Click **Open ready draft in Gmail**. Gmail opens with everything filled in.
   Check it and press **Send**.
   (For Google and OpenAI, the blue box tells you which form to paste it into instead.)
6. Click **I sent it: start the 90-day reply countdown**.
   The company has up to 90 days to reply. Nijta counts the days for you
   and turns red if they're late.

ℹ️ These legal rights fully start on **13 May 2027**. Many companies already accept requests before that.
This is not legal advice.

---

## Does it work on a phone? 📱

**Yes, once your team has put Nijta online** (see `GITHUB_SETUP.md`).
- Open the Nijta link in Chrome on your phone.
- Tap **⋮ → Add to Home screen**. It now looks and opens like a normal app.
- It works offline after the first time.

Before that, phones can't open the downloaded `index.html` file properly, so use a laptop.

| Feature | Phone |
|---|---|
| Try demo data, View, Go to chat | ✅ |
| Scan ChatGPT / Gemini exports downloaded on the phone | ✅ |
| Scan Claude export | ⚠️ Export from a laptop first, then send the file to your phone |
| Search, delete checklist, Mask, Understand it, Take it back | ✅ |

---

## Something went wrong?

| Problem | What to do |
|---|---|
| index.html opens in VS Code or Notepad | Right-click → **Open with** → **Chrome** |
| "This JSON file doesn't look like an export" | You picked the wrong file. Use the **.zip** from the AI app. |
| Gemini: "No conversations file found" | You exported in HTML. Redo Gemini step 4 and choose **JSON**. |
| Claude: it shows a list of links instead of chats | That's the manifest. Click the **Download conversations-000.zip** button Nijta shows. |
| Only a few months of Gemini chats appear | Google auto-deletes old Gemini activity. Nijta can only see what Google still has. |
| Something private wasn't found | Turn on **Maximum sensitivity**, use the **🔎 search box**, or the **"Didn't find something?"** box. |
| Something is flagged that isn't private | Tell the Nijta team which kind of sentence it was (not the real value). |

---

## Our promise 🔒

- Your chats **never leave your device**. There is no Nijta server.
- Nijta **never logs into** your ChatGPT, Claude or Google account.
- Close the tab and everything is gone, except your ticks and settings, which stay only on your device.

*Nijta: Project Expo 2026, SMVDU. A student project. Not legal advice.*
