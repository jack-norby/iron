# Iron: notes for Claude

"Iron sharpens iron." (Proverbs 27:17)

Iron is a static website (plain HTML/CSS/JS, no build step) for college connection groups at Cornerstone Church in Ames, Iowa. Each member tracks daily goals across four areas, Spiritual first, then Physical, Mental and Emotional. Leaders can run groups and see their members' progress. The owner is a college student who leads a connection group with a co-counselor.

**The point is rest, not doing more.** Accountability matters, but the owner built Iron after burning out from striving. Adding rest to each of the four areas helped, an idea from *The Power of Full Engagement* (Jim Loehr and Tony Schwartz): push, then recover, in every area. It's modeled on creation: God worked six days and rested on the seventh (Genesis 2:2–3). New features should never make someone feel behind for resting.

## Files (all in one flat folder: no subfolders, so drag-and-drop uploads to GitHub keep working)
- `index.html` + `app.js`: Today checklist, Spiritual Workout Plan reading, Progress (stats, month calendar, 30-day area bars), Goals (the four areas), Connection group questions (two columns), "Sharpen each other" (groups), Reminders (.ics calendar file), Settings (backup code, start over).
- `goals.js`: the areas, suggested goals (`starter: true` = on everyone's list at first), `SWP_QUESTIONS` (the Spiritual Workout Plan's six accountability questions, word for word) and `EXTRA_QUESTIONS`.
- `plan.js`: the Spiritual Workout Plan, Fall 2026: 18 weeks of Mon–Fri readings (NT 1 year, NT 4 months, OT 2 years) plus memory verses. Replace it each semester from Cornerstone's PDF.
- `journal.js`: ideas from the owner's bullet-journal notebook, built into the main page instead of a separate tab (the owner doubted anyone would use a standalone journal). "This month" (`#month`, under Today) has four renameable action lists (default Personal, School, Work, Spiritual); a new month copies last month's list names. "Pray and give thanks" (`#pray`, after the group questions) has a prayer list you check off when answered, plus a thankful-for list. Data lives in `state.journal` (`months`, `prayers`, `gratitude`) and syncs with the account. It's never in the leaders' shared summary. Older data (`remember`, `entries`, daily `days`/`habits`) stays saved but isn't shown.
- `journal.html`: only a redirect to `index.html#month`, for old links.
- `resources.html` + `resources.js`: the gospel in four words (the owner's framing: Relationship, Gap, Bridge, Freedom), the bridge diagram (from a leader-meeting handout, "Christ in our place," Romans 6:23) as a step-by-step walkthrough, a 60-second testimony builder, ask/listen/share/invite, the Repenter quadrant (Talker/Hider/Fixer/Repenter on Confess–Conceal × Apathy–Action axes, from a leader meeting 9.20.26), and "Go deeper": sites the owner recommends (BibleProject, Enduring Word, Got Questions, The Gospel Coalition). Sing is only in the Spiritual area.
- `account.js` + `firebase-config.js`: Firebase sign-in (Google + email/password), tracker sync and groups. Off when the config is `null`.
- `style.css`: the whole design. Tokens are at the top.
- `*.jpg`: film photos the owner picked. cross-trees is the main hero, sword-light (a sword against bright light, the owner's favorite) is the Connection group banner, dove the resources hero and cross-window (light through a cross-shaped church window) the "Pray and give thanks" banner. The goal swatches are cross-mountain (spiritual), runner (physical), dove (mental) and hands (emotional).
- Icons and sharing: `favicon.svg` (a sword that also reads as a cross) plus `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and `manifest.webmanifest`. `og-image.jpg` (1200×630) is the link preview. The `og:` tags in each page's head use the absolute address `https://jack-norby.github.io/iron/`. If the site lives somewhere else, change them all.
- `ACCOUNTS.md`: Firebase setup and the Firestore security rules. `README.md`: overview.

## Design
Dark, old-film look. Near-black ground (`--paper`), bone-white text (`--ink`; the token names are from the earlier light theme), light film grain, and powder-blue accent (`--powder: #b9d2e5`). Headlines use Gloock with a fuzzy ink-bled SVG filter (`#fuzz`, `#fuzz-sm`, defined inline at the top of each page's body). Condensed capitals use Barlow Condensed, body text EB Garamond, and small labels IBM Plex Mono. Area colors: spiritual = powder, physical = olive, mental = blue, emotional = rust. Keep the single dark theme.

## Notes
- An area in `goals.js` can have `links: [{name, note, url, cta}]`, shown as link cards above its goals (`cta` is the button text, default "Get the app ↗"). The owner's picks: Spiritual has Cornerstone's Spiritual Workout Plan page (linked rather than hosting the PDF, since it changes every semester) and Sing (sing.theworshipinitiative.com, a worship devotional). Physical has Ceko (workouts, lifts, runs and food, an App Store app made by a Salt Company leader). Mental has Habits First (a screen-time app). Emotional has the Salt Company connection groups page.
- Goal areas on the main page start collapsed. They're for reading and picking goals.
- `app.js` exposes `window.Iron` (getState, update, subscribe, setState, summary). On pages without the checklist (Resources) it stops after setting that up, so sign-in and sync still work there.

## Data
- localStorage key `iron-v1`: `{ goals: [{id, area, label}], log: {"YYYY-MM-DD": [goalIds]}, created, welcomed, journal }`. Older `lockin-v1` data still loads.
- A day counts toward the streak at 80% or more of goals done. "Last 7 days" only counts days since the person started.
- Sabbath: `state.sabbath` is a weekday number (0 = Sunday, the default when unset) or `null` for none. Picked under Progress. A Sabbath never breaks the streak and isn't graded in the 7-day or 30-day percentages. On that day Today shows a "Rest today" note (Genesis 2:3). The calendar marks it with a dashed outline.
- Each area in `goals.js` has a `rest` line, and goals with `rest: true` get a Rest tag. The group questions include a Rest question.
- Firestore: `users/{uid}` = `{name, state, groups:[code]}`; `groups/{CODE}` = `{name, code, leaders:[uid], members:[uid]}`; `groups/{CODE}/members/{uid}` = shared numbers only (streak, best, week, today, total, lastCheckin, areas, date).
- **Privacy rule: leaders never see anyone's goals, only those numbers.** Keep it that way.
- Firebase project: `iron-group-a7770`. Authorized domain: `jack-norby.github.io`. The rules in ACCOUNTS.md are published and passed 33 allow/deny tests in the Firestore emulator. `useEmulators: true` in the config is for local testing only.

## Content rules
- Scripture is ESV. Keep the Crossway copyright notice in the footer and quote verses accurately.
- Wording works for guys' and girls' groups alike: "friend" or "someone in your group," never "brother," "guys" or "he." Proverbs 27:17 is quoted only as "Iron sharpens iron" so the ESV stays word for word without "one man sharpens another."
- No citations of internal church meetings or handouts on the site.
- Example goals stay general. Don't use the owner's personal goals (no specific times, diets, names or relationships).
- The Spiritual Workout Plan is Cornerstone's (cornerstonelife.com/workout). The site links to it and is a fan-made tool, not an official church resource.

## Working on it
- Preview: `python3 -m http.server` in this folder, then open http://localhost:8000.
- After changes, check phone width (about 390px) for horizontal overflow, and check the browser console for errors.
- The owner publishes by uploading the files to the Iron GitHub repo (GitHub Pages). Keep the folder flat.
- Every page loads `style.css` and the scripts with `?v=<timestamp>`, and the links between pages carry it too. The footer shows "Iron · Version <timestamp>" so the owner can tell which copy is live. Bump all of them together on every release: `sed -i -E "s/\?v=[0-9]+/?v=NEW/g; s/Version [0-9]+/Version NEW/" *.html`.
- The document never scrolls. `body` is a 100dvh flex column: the header on top, then `.scroller` (wrapping `main` and the footer) which scrolls. Reason: iPhone Safari (iOS 26) draws scrolling page content in a sliver between its status-bar tint and any sticky/fixed header, and won't let the header paint there. Fixed, sticky and sticky-with-a-tall-top headers all left a visible gap in the owner's screen recordings. With an inner scroller nothing passes above the header. Jump links scroll `.scroller`. Tradeoff: Safari's toolbar doesn't shrink on scroll. On phones the nav is one swipeable row.
- Both pages load goals.js, plan.js, app.js, firebase-config.js and account.js so the Sign in button and sync work everywhere. The main page also loads journal.js.
