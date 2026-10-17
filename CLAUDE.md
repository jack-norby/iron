# Iron: notes for Claude

"Iron sharpens iron, and one man sharpens another." (Proverbs 27:17)

Iron is a static website (plain HTML/CSS/JS, no build step) for college connection groups at Cornerstone Church in Ames, Iowa. Each guy tracks daily goals across four areas, Spiritual first, then Physical, Mental and Emotional. Leaders can run groups and see their guys' progress. The owner is a college student who leads a connection group with a co-counselor.

## Files (all in one flat folder: no subfolders, so drag-and-drop uploads to GitHub keep working)
- `index.html` + `app.js`: Today checklist, Spiritual Workout Plan reading, Progress (stats, month calendar, 30-day area bars), Goals (the four areas), Connection group questions (two columns), "Sharpen each other" (groups), Reminders (.ics calendar file), Settings (backup code, start over).
- `goals.js`: the areas, suggested goals (`starter: true` = on everyone's list at first), `SWP_QUESTIONS` (the Spiritual Workout Plan's six accountability questions, word for word) and `EXTRA_QUESTIONS`.
- `plan.js`: the Spiritual Workout Plan, Fall 2026: 18 weeks of Mon–Fri readings (NT 1 year, NT 4 months, OT 2 years) plus memory verses. Replace it each semester from Cornerstone's PDF.
- `journal.html` + `journal.js`: a private journal modeled on the owner's bullet-journal notebook. It has a monthly log (one-line highlight per day and up to 3 habits that cycle done → missed → blank), the month's actions in two renameable lists (default Personal and School), Remember / Gratitude / Prayers lists (prayers can be marked answered) and dated entries (Journal, Prayer, Sermon notes, Bible study). A new month copies last month's habit names and list titles. Data lives in `state.journal` and syncs with the account. It's never in the leaders' shared summary.
- `resources.html` + `resources.js`: the gospel in four words (the owner's framing: Relationship, Gap, Bridge, Freedom), the bridge diagram (from a leader-meeting handout, "Christ in our place," Romans 6:23) as a step-by-step walkthrough, a 60-second testimony builder, ask/listen/share/invite, the Repenter quadrant (Talker/Hider/Fixer/Repenter on Confess–Conceal × Apathy–Action axes, from a leader meeting 9.20.26).
- `account.js` + `firebase-config.js`: Firebase sign-in (Google + email/password), tracker sync and groups. Off when the config is `null`.
- `style.css`: the whole design. Tokens are at the top.
- `*.jpg`: film photos the owner picked. cross-trees is the main hero, sword-light (a sword against bright light, the owner's favorite) is the Connection group banner, dove the resources hero and crucifix the journal hero. The goal swatches are cross-mountain (spiritual), runner (physical), dove (mental) and hands (emotional).
- Icons and sharing: `favicon.svg` (a sword that also reads as a cross) plus `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and `manifest.webmanifest`. `og-image.jpg` (1200×630) is the link preview. The `og:` tags in each page's head use the absolute address `https://jack-norby.github.io/iron/`. If the site lives somewhere else, change them all.
- `ACCOUNTS.md`: Firebase setup and the Firestore security rules. `README.md`: overview.

## Design
Dark, old-film look. Near-black ground (`--paper`), bone-white text (`--ink`; the token names are from the earlier light theme), light film grain, and powder-blue accent (`--powder: #b9d2e5`). Headlines use Gloock with a fuzzy ink-bled SVG filter (`#fuzz`, `#fuzz-sm`, defined inline at the top of each page's body). Condensed capitals use Barlow Condensed, body text EB Garamond, and small labels IBM Plex Mono. Area colors: spiritual = powder, physical = olive, mental = blue, emotional = rust. Keep the single dark theme.

## Notes
- An area in `goals.js` can have `app: {name, note, url}`, shown as a link card. Physical links to Ceko (workouts, lifts, runs and food), an App Store app made by a Salt Company leader.
- Goal areas on the main page start collapsed. They're for reading and picking goals.
- `app.js` exposes `window.Iron` (getState, update, subscribe, setState, summary). On pages without the checklist it stops after setting that up, so the journal can share the same data and account sync.

## Data
- localStorage key `iron-v1`: `{ goals: [{id, area, label}], log: {"YYYY-MM-DD": [goalIds]}, created, welcomed, journal }`. Older `lockin-v1` data still loads.
- A day counts toward the streak at 80% or more of goals done. "Last 7 days" only counts days since the person started.
- Firestore: `users/{uid}` = `{name, state, groups:[code]}`; `groups/{CODE}` = `{name, code, leaders:[uid], members:[uid]}`; `groups/{CODE}/members/{uid}` = shared numbers only (streak, best, week, today, total, lastCheckin, areas, date).
- **Privacy rule: leaders never see anyone's goals, only those numbers.** Keep it that way.
- Firebase project: `iron-group-a7770`. Authorized domain: `jack-norby.github.io`. The rules in ACCOUNTS.md are published and passed 33 allow/deny tests in the Firestore emulator. `useEmulators: true` in the config is for local testing only.

## Content rules
- Scripture is ESV. Keep the Crossway copyright notice in the footer and quote verses accurately.
- Example goals stay general. Don't use the owner's personal goals (no specific times, diets, names or relationships).
- The Spiritual Workout Plan is Cornerstone's (cornerstonelife.com/workout). The site links to it and is a fan-made tool, not an official church resource.

## Working on it
- Preview: `python3 -m http.server` in this folder, then open http://localhost:8000.
- After changes, check phone width (about 390px) for horizontal overflow, and check the browser console for errors.
- The owner publishes by uploading the files to the Iron GitHub repo (GitHub Pages). Keep the folder flat.
