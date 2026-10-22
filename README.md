# Quest Academy 🎓

A Year 4 learning app for **English, Bahasa and Maths**, built on exactly the
same stack as *The Haunted English Mansion* and *Bahasa Quest*: plain
HTML/CSS/JavaScript, no build step, GitHub → Vercel for hosting, Firebase for
email login + a cloud database.

**Sign in on any phone, tablet or computer with the same email and you get the
same players, scores, progress reports and Parent Report.**

## How it's organised

```
Subject   English · Bahasa · Maths          (the three cards on the menu)
  └ Topic    e.g. Maths → Addition … Word Problems
      └ Level   Level 1, Level 2, …         (you add these as worksheets come in)
          ├ 📝 Assessment       questions picked at random from the level's bank
          └ 📊 Progress report  score history, attempts, weak areas,
                                 last practice date, mastery status
```

| Part | Status |
|---|---|
| Login / create account / forgot password (email + password) | ✅ built |
| Cloud database — same results on every device, works offline and catches up | ✅ built |
| Players (several kids under one account) | ✅ built |
| Main menu → English · Bahasa · Maths | ✅ built |
| Dashboard: big **My points** panel (points available, on hold and used — tap it for the points history), Trophy Room and 🛍️ Shop cards | ✅ built |
| 🛍️ Shop → **Redeem cash** (parent approves on the admin page) · 📜 Points history | ✅ built — more shop items to come |
| Study Mode inside each subject: **By Topic**, **By School Year** (Year 1–6) or **Quest Arena** (games) | ✅ built |
| Quest Arena → Maths → Beat the Clock, with 2 badges · 🏆 Trophy Room | ✅ built |
| Maths → 12 topics (Addition, Subtraction, Multiplication, Division, Fractions, Length, Mass (weight), Capacity & volume, Perimeter, Time, Money, Word Problems) | ✅ built |
| Maths levels ready: Addition L1: 2- and 3-digit (50 questions, 10 per test) · Multiplication L1: 1 digit × 1 digit (tables 2–10, 90 questions, 20 per test) · Multiplication L2: 2 digits × 1 digit (80 questions, 15 per test) · Multiplication L3: identify groups & items in each group (80 word problems with two answer boxes, 15 per test) — not linked to a school year yet | ✅ loaded |
| Level page → Assessment · Progress report | ✅ built — fills in as levels are added |
| English → Conjunctions L1: choose the right conjunction (80 multiple-choice questions, 15 per test) — not linked to a school year yet | ✅ loaded |
| More English topics, and Bahasa topics | ⏳ *coming soon* — same topic → level layout as Maths |
| History & Analysis, Parent Report (mastery grid for every topic and level) — assessment history can't be cleared | ✅ built |
| Installable on phones (Add to Home Screen) | ✅ built |

**Mastery status** for each level: *Not started → Needs practice → Developing →
Almost mastered → Mastered*. A level is **Mastered** when the last 3
assessments in a row all score 80% or more.

### Points

Points are earned only by **beating your own best score on a level**:

> points = (new best % − old best %) × the subject's *points per 1%*

| Attempt on a level | Score | Points at 1 per 1% |
|---|---|---|
| First try | 70% | +70 |
| Second try | 60% | 0 — below the best |
| Third try | 90% | +20 (90 − 70) |
| Fourth try | 90% | 0 — same as the best |

So repeating a level can never farm points, and one level pays at most
100 × the value.

**Max points are always shown** — on each level card ("up to 20 points"), in a
*Max points* box on the level page, next to the question counter during the
assessment, and on the results ("Next try: up to 20 points"). The max is
(100 − best %) × the subject's points per 1% from the admin page, so after
scoring 80% at 1 point per 1% the next try shows a max of 20. Points already earned keep the value they were earned at.

Assessment history **can't be cleared** — there's no clear button anywhere, so
scores, reports and points always add up. Deleting a whole player is on the
admin page only.

### Quest Arena (games)

Each subject's Study Mode has a third choice, **Quest Arena**. Maths has
**⏱️ Beat the Clock** (times tables, 1 digit × 1 digit — questions come from
Multiplication Level 1, ×1 to ×9 only, never repeated within a game):

| | Rule | Badge | Points |
|---|---|---|---|
| Lives | ❤️❤️❤️ for the whole game; a wrong answer — or running out of time — costs one (the right answer flashes up) | | |
| Round 1 | 15 questions, **10 seconds for each one** | 🥷 **Times Table Ninja** (silver) | **+50** the first win, then +5 per win |
| Round 2 | 15 more questions, **only 5 seconds for each one** | 🧙 **Multiplication Wizard** (gold) | **+60** the first win, then +5 per win |

The game page shows the points each round will pay before he starts ("Points
you can win"), and the points won appear between rounds and on the results
screen. Arena points add to the player's total; round wins are counted per
device so two devices can't double-count. A badge earned before points existed
still credits its first-win bonus. Points per round are set in `js/data.js`
(`rounds[].points`).

Badges belong to the player, sync across devices (the first date earned is
kept) and live in the **🏆 Trophy Room** (on the main menu): earned badges in
colour with the date, locked ones greyed out with how to win them. They also
show in the Arena and the Parent Report. Games and
badges are set up in `js/data.js` (`GAMES`, `BADGES`).

### 🛍️ Shop and points history

The Shop is on the main menu. Everything in it is a **request a parent
approves** — cash is the first item; more will be added.

**💵 Redeem cash**

1. He types an amount in MYR (e.g. `5.00`). The screen shows how many points
   it uses, at the cash value you set on the admin page (e.g. MYR 0.10 per
   point → MYR 5.00 = 50 points).
2. **Submit** stays greyed out unless the amount is valid: more than 0, up to
   2 decimals, a whole number of points, and **no more points than he has
   available**. Tapping it asks him to confirm.
3. The points go **on hold** 🔒. On-hold points show on the menu, in the Shop
   and in the points history, and can't be spent again.
4. You **approve** or **reject** it on the admin page. Approve → the points
   are used up (remember to hand over the cash). Reject → the points go back.

**Points available = earned − on hold − used.** If the cash value is 0.00,
cash redemption is switched off and the Shop says "ask a parent".

**📜 Points history** (tap the points panel on the menu, or the button in the
Shop) lists every change, newest first: points earned on each assessment
(old best → new best), Quest Arena wins, and each redemption — on hold,
redeemed (−points) or not approved (returned).

Requests sync like everything else: if a request is approved on one device
and still pending on another, the decision wins.

### Admin page (parents only)

**Menu → 🔒 Admin** (bottom of the menu). The first time, it asks for the
account password, then you choose a **4–8 digit PIN**. After that the PIN
unlocks it on every device. On the admin page you can:

- set **points per 1%** for English, Bahasa and Maths (0 switches a subject's
  points off; halves like 1.5 are fine),
- set the **💵 cash value of 1 point** in MYR with 2 decimals (e.g. 0.10 →
  1 point = MYR 0.10, so 100 points = MYR 10.00; 0.00 switches cash off).
  Requests already waiting keep the value they were made at,
- **approve or reject redemption requests** (the menu's Admin link shows how
  many are waiting), and see past requests,
- see each player's points — available, on hold, used and earned,
- delete a player — the only place this can be done, and it asks for the
  admin PIN again before deleting (wrong PINs count towards the 60-second lock),
- change the PIN or lock the page. Leaving the page locks it again.

Forgot the PIN? Tap **Forgot the PIN?** and confirm the account password to
choose a new one. Five wrong PINs in a row lock the pad for 60 seconds.

---

## What to upload

Upload **the contents of this `game` folder only** (the folder with `index.html`).
Don't upload the `Materials` folder.

```
game/
  index.html  vercel.json  firestore.rules  manifest.webmanifest
  service-worker.js  favicon.svg  README.md
  css/style.css
  icons/...
  js/...   (including js/questions/)
```

## Step 1 — Put it on GitHub

1. Go to <https://github.com/new> and create a repository, e.g. `quest-academy`
   (Public or Private — both work with Vercel). Click **Create repository**.
2. On the new repo page click **uploading an existing file**.
3. Open the `game` folder on your PC, select **everything inside it** and drag
   it into the GitHub upload box (folders included).
4. Click **Commit changes**.

## Step 2 — Firebase (email login + cloud database)

Quest Academy uses its **own** Firebase project, separate from your other games.

1. <https://console.firebase.google.com> → **Add project** (e.g. `quest-academy`).
   Google Analytics can be skipped.
2. **Authentication** → *Get started* → **Sign-in method** → enable
   **Email/Password** → Save.
3. **Build → Firestore Database** → *Create database* → **Start in production
   mode** → location **asia-southeast1** (Singapore, closest) → *Enable*.
4. Firestore → **Rules** tab → replace everything with the contents of
   `firestore.rules` (in this folder) → **Publish**. This makes sure each
   account can only ever read and write its own data.
5. **Project settings** (gear icon) → **Your apps** → click the **`</>`** (Web)
   icon → give it a nickname → **Register app**. Firebase shows a
   `firebaseConfig = { ... }` block.
6. Open `js/firebase-config.js` and paste the 6 values between the quotes
   (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
   Save.
7. Re-upload **`js/firebase-config.js`** to GitHub (open the file on GitHub →
   pencil icon → paste → Commit).

> Until Step 2 is done the app still runs, but saves on one device only and
> has no login (it shows a "Try it on this device" button). Once it's done,
> **login is required** and that button disappears.

## Step 3 — Deploy on Vercel

1. <https://vercel.com> → **Add New… → Project**.
2. **Import** the repo from Step 1.
3. Leave everything default (Framework Preset: *Other*, no build command) →
   **Deploy**.
4. You get a live URL like `https://quest-academy.vercel.app`.

### One last Firebase setting (so login works on the live site)

Firebase console → **Authentication → Settings → Authorized domains → Add
domain** → paste the Vercel domain (e.g. `quest-academy.vercel.app`). Without
this, login is blocked on the live site.

## Step 4 — Use it

Open the Vercel URL, **Create an account** (the student name you type becomes
the first player), then pick a subject. Sign in with the same email on a phone
— everything follows. On a phone, use **Share → Add to Home Screen** (iPhone)
or **Install app** (Android) so it opens like a normal app.

---

## How the database works

- Each account has one document in Firestore at `users/{account id}` holding
  every player and every finished assessment (with the question-by-question
  details of the 20 most recent ones).
- Every change is saved on the device first, then synced. A sync **merges** the
  device's copy with the cloud copy — it never overwrites — so a phone and a
  computer used on the same day both keep their results.
- Sync runs after every finished assessment, when the app is reopened or comes
  back to the foreground, and when the internet comes back. The menu shows
  ☁️ *Saved to the cloud*, 📴 *Offline — will sync when back online*, etc.
- Deleting a player or clearing history is remembered, so it stays deleted on
  every device.

---

## Adding a level (example: Maths → Addition → Level 1)

Two files, same ids in both.

**1. `js/data.js`** — add the level inside the topic:

```js
{ id: "addition", label: "Addition", icon: "+", desc: "…", levels: [
    { id: "level1", label: "Level 1", desc: "Adding 2- and 3-digit numbers", years: [3],
      catLabels: { ADD2: "2-digit sums", ADD3: "3-digit sums", MISS: "Missing numbers" } }
] },
```

**2. `js/questions/maths.js`** — the assessment questions:

```js
window.QUESTIONS.maths = {
  addition: {
    level1: [
      { q: "What is 46 + 35?", options: ["81", "71", "711", "82"], answer: 0, cat: "ADD2",
        explain: "6 + 5 = 11 — write 1, carry 1. 4 + 3 + 1 = 8." },
      { typed: true, q: "347 + 285 = ___", word: "632", cat: "ADD3" },
      { typed: true, q: "___ + 25 = 60", word: "35", cat: "MISS" }
    ]
  }
};
```

Re-upload the changed files to GitHub — Vercel redeploys automatically.

### Question formats

| Format | Example |
|---|---|
| Multiple choice (`answer` = index of the right option; options are shuffled each time) | `{ q, options: [...], answer: 0 }` |
| Typed answer — on-screen keyboard; **number pad** automatically when the answer is a number, decimal or fraction | `{ typed: true, q: "347 + 285 = ___", word: "632", alt: [...] }` |
| Listen and spell (British English voice for English, Malay voice for Bahasa) | `{ spelling: true, word: "because", hint: "…" }` |
| Reading passage — same `pid` + `passage` on each question, and `passageMode: true` on the level | `{ pid: "fox1", passage: "…", q, options, answer }` |
| Picture above any question (shapes, clocks, scales…) | `visual: "<svg …>…</svg>"` |
| Several answer boxes (e.g. *Number of groups* + *Items in each group*) — tap a box, type, “Next box”; correct only if every box is right | `{ q: "story…", fields: [{ label: "Number of groups", word: "4" }, { label: "Items in each group", word: "6" }] }` |

**No repeats in a test:** an assessment or game never shows the same question
twice — including look-alikes with the same numbers and answer, such as
`6 × 7` and `7 × 6`, or two stories that are both 2 groups of 6. (To group
questions some other way, give them the same `same: "key"`.)

Optional on any question: `cat` (powers *weak areas* in the progress report —
give codes friendly names with `catLabels` on the level) and `explain` (shown
after a wrong answer).

`years: [3]` puts the level under **Year 3** in Study Mode → By School Year
(use several, e.g. `years: [3, 4]`, if it fits more than one year; a level
with no `years` only shows under By Topic).

Optional on a level: `sessionSize: 20` (questions per assessment, default 10),
`passageMode: true, passageCount: 2`.

English and Bahasa work the same way: add topics to their `topics: [...]` list
in `js/data.js`, then levels, questions (`js/questions/english.js`,
`js/questions/bahasa.js`).

---

## Previewing on the PC

The `.claude/launch.json` one folder up starts a small local server on port
5530 (needs Node.js): open <http://localhost:5530>.

## Where things live

| File | What it does |
|---|---|
| `js/data.js` | Subjects → topics → levels |
| `js/questions/*.js` | Assessment questions, per subject → topic → level |
| `js/store.js` | Players, saved results, points ledger, admin settings, merge logic (device + cloud) |
| `js/firebase.js` | Email login + cloud sync |
| `js/report.js` | Mastery, per-level progress reports, Parent Report |
| `js/ui.js` (admin section) | PIN-protected admin page: points per 1% for each subject |
| `js/ui.js` | Every screen |
| `js/art.js` | Crest, student avatars, owl mascot, subject badges |
| `css/style.css` | The night-sky academy theme (palette at the top) |
