# Iron

> “Iron sharpens iron.” Proverbs 27:17

A simple daily tracker for college connection groups. It covers four areas (Spiritual first, then Physical, Mental and Emotional) on one page.

- **Today**: a checklist of your goals, grouped by area, plus today's Spiritual Workout Plan reading and memory verse with links to each passage.
- **Progress**: streak, best streak, last-7-days percentage, check-offs, a month calendar you can tap to edit past days, and a 30-day bar for each area.
- **Goals**: each area has a short "why," a verse and suggested goals you can add with one tap. You can also add your own.
- **Connection group**: weekly accountability questions with a button that copies them for the group chat.
- **Settings**: a backup code to move to another phone, and Start over.
- **Rest built in**: a weekly Sabbath (Sunday unless you pick another day) that never breaks your streak, a rest side to every area and Rest-tagged goals. The idea comes from *The Power of Full Engagement* and from God resting on the seventh day.
- **This month**: a few bigger things to get done, in four lists you can rename (Personal, School, Work, Spiritual), right under the daily checklist.
- **Pray and give thanks**: a private prayer list (check off answered prayers) and a "thankful for" list, next to the group questions. Both sync to your account if you're signed in. Leaders never see them.
- **Links in each area**: Spiritual Workout Plan and Sing (Spiritual), Ceko (Physical), Habits First (Mental) and Salt Company connection groups (Emotional).
- **Resources** (`resources.html`): the gospel in four words (relationship, gap, bridge, freedom), the bridge diagram ("Christ in our place," Romans 6:23) as a step-by-step walkthrough, a 60-second testimony builder, an "ask, listen, share, invite" guide, the Repenter quadrant with next steps, and Go deeper: sites worth knowing (BibleProject, Enduring Word, Got Questions, The Gospel Coalition).

- **Reminders**: pick a Bible-reading time and a check-in time, then tap once to add daily alerts to your phone's calendar. They link back to the site.
- **Your group** (needs accounts): sign in with Google or email so your tracker follows you to any device. Leaders start a group and share a 6-character code, and can make a co-leader. Leaders see each person's streak, today's progress, last 7 days, area bars and last check-in, never their goals. See [ACCOUNTS.md](ACCOUNTS.md) for the 10-minute Firebase setup.

Without accounts, everything saves in the browser on each person's device.

## Files
| File | What it is |
| --- | --- |
| `index.html` | The main page |
| `resources.html`, `resources.js` | The resources page and its interactive parts |
| `app.js` | The tracker logic (checklist, calendar, stats, reminders, backup) |
| `account.js`, `firebase-config.js` | Sign-in, syncing and groups (off until `firebase-config.js` has your Firebase settings) |
| `goals.js` | The four areas, their suggested goals and the group questions (Spiritual Workout Plan + Iron). Edit this to change content. |
| `plan.js` | The Spiritual Workout Plan readings (Fall 2026). Replace the weeks each semester. |
| `style.css` | All the styling. Colors and fonts are tokens at the top. |
| `*.jpg` | Photos from the Pinterest look board (cowboy, sword on the mountain, white church, baptism, cross-shaped church window, cross on a mountain, runner, old window, worship) |
| `favicon.svg`, `*.png`, `manifest.webmanifest` | The sword icon for the browser tab and home screen |
| `og-image.jpg` | The picture that shows when someone texts or posts the link |

## Run it
Open `index.html`, or serve the folder with `python3 -m http.server`. To host it, put these files at the root of a GitHub repo and turn on GitHub Pages (Settings → Pages → `main` branch, root).

Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
