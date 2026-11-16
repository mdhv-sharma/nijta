# Putting Nijta on GitHub 🚀
### So it works on phones, gets a public link, and checks AI privacy policies every day by itself

You do this **once**. It takes about 15 minutes. You only need a browser.

---

## What you get at the end

- A link like **https://your-username.github.io/nijta/** that anyone can open, on a laptop or a phone
- Phones can **"Add to Home screen"** and use Nijta like an app, even offline
- Every day at 9 am, GitHub checks the privacy policies of ChatGPT, Claude and Gemini.
  If one changed, the change appears in Nijta **automatically**, and everyone watching the project **gets an email**
- When your team improves Nijta (new rules, fixes) and uploads the files, **everyone gets the new version automatically**
  the next time they open it with internet

⚠️ **Never upload anyone's real chat export to GitHub.** The project is public. Only the app files go there.
(The demo files in `demo/` are fake, so they're fine.)

---

## Step 1: Make a GitHub account

1. Go to **github.com/signup**.
2. Enter your email, a password and a username.
   **Choose the username carefully**: it becomes part of your link (`username.github.io`).
3. Verify your email.

---

## Step 2: Create the project ("repository")

1. Log in to GitHub. Click the **+** at the top-right → **New repository**.
2. **Repository name:** `nijta`
3. Choose **Public**. (Free accounts can only publish websites from public projects.)
4. **Don't** tick "Add a README file". Leave everything else as it is.
5. Click **Create repository**.

---

## Step 3: Upload the Nijta files

1. On the new empty project page, click the link **uploading an existing file**.
2. On your laptop, open the **nijta** folder (the one with `index.html` inside).
3. Press **Ctrl + A** to select **everything inside it**: all files and folders, including the `.github` folder.
4. **Drag** them into the GitHub page in your browser.
5. Wait until every file has finished uploading.
6. Scroll down and click the green **Commit changes** button.

✅ **Check:** on the project page you should now see folders like `css`, `js`, `data`, `.github`, and the file `index.html`.

**If the `.github` folder is missing** (some computers hide it):
1. Click **Add file** → **Create new file**.
2. In the name box, type exactly: `.github/workflows/policy-watch.yml`
   (typing the `/` creates the folders).
3. Open `policy-watch.yml` from your laptop in Notepad, copy everything, and paste it into GitHub.
4. Click **Commit changes**.

---

## Step 4: Turn on the website (GitHub Pages)

1. In your project, click **Settings** (top menu, gear icon).
2. In the left menu, click **Pages**.
3. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
5. Wait 1–2 minutes and refresh the page. A box appears: **"Your site is live at https://your-username.github.io/nijta/"**.
6. Open that link. Nijta should load. Click **Try with demo data** to check it works. 🎉

---

## Step 5: Let the daily checker save its results

1. **Settings** → in the left menu **Actions** → **General**.
2. Scroll to **Workflow permissions**.
3. Choose **Read and write permissions** and click **Save**.

---

## Step 6: Run the first policy check

1. Click the **Actions** tab at the top of your project.
   If GitHub asks, click **"I understand my workflows, go ahead and enable them"**.
2. On the left, click **Policy watch**.
3. Click **Run workflow** → **Run workflow** (green button).
4. Wait about a minute until it shows a green ✓.

The **first run only saves today's copy** of each policy page, because there's nothing to compare with yet.
From then on it runs **every day at 9 am** by itself and records any change.

If a run shows a red ✗, click it to read why. Usually a company website blocked the automatic visit
(the log says **SKIP**), which is harmless. The other pages are still checked.

---

## Step 7: Get an email when a policy changes

When the checker finds a change, it opens an **Issue** in your project. GitHub emails everyone watching.

1. At the top of your project page, click **Watch**.
2. Choose **All activity** (or **Custom** → tick **Issues** → **Apply**).

Your teammates and anyone else who wants alerts can do the same, using their own GitHub account.
People who prefer a news-reader app can follow the RSS feed:
`https://your-username.github.io/nijta/data/feed.xml`

---

## Step 8: Add your teammates

1. **Settings** → **Collaborators** → **Add people**.
2. Type each teammate's GitHub username and send the invite.
3. They accept the invite from their email. Now all three of you can upload changes,
   and your GitHub profiles all show the project (good for placements).

---

## Step 9: Use it on a phone 📱

1. Open the link (`https://your-username.github.io/nijta/`) in **Chrome** on the phone.
2. Tap **⋮** (top-right) → **Add to Home screen** (or **Install app**).
3. Nijta now has its own icon and opens like an app. After the first visit it works offline too.

To scan on the phone: download your ChatGPT or Gemini export on the phone, then tap **Choose file** in Nijta.

💡 **For the expo poster:** make a QR code of your link (search "QR code generator" and paste the link).
Judges can scan it and try the demo on their own phones.

---

## Updating Nijta later

1. Open the project on GitHub → **Add file** → **Upload files**.
2. Drag in the changed files **in the same folders** (for example a new `js/detectors.js` goes into the `js` folder).
   Files with the same name are replaced.
3. Click **Commit changes**.
4. In 1–2 minutes the website updates. Everyone gets the new version the next time they open Nijta with internet.

---

## Good to know

- **GitHub pauses daily checks** in a project that has had no activity for 60 days. If that happens, the
  Actions tab shows a message. Click **Enable workflow** and it starts again.
- **Policy page addresses** are listed in `data/policy_sources.json`. If a company moves its policy page,
  update the address there.
- **Your chats are still never uploaded.** The website only sends Nijta's own files to the browser.
  Scanning happens on the user's device, exactly like the offline version.
