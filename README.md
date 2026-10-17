# Lock In

A simple daily tracker for college connection groups. It covers four areas (Spiritual first, then Physical, Mental and Emotional) on one page.

- **Today**: a checklist of your goals, grouped by area, plus today's Spiritual Workout Plan reading and memory verse with links to each passage.
- **Progress**: streak, best streak, last-7-days percentage, check-offs, a month calendar you can tap to edit past days, and a 30-day bar for each area.
- **Goals**: each area has a short "why," a verse and suggested goals you can add with one tap. You can also add your own.
- **Connection group**: weekly accountability questions with a button that copies them for the group chat.
- **Settings**: a backup code to move to another phone, and Start over.
- **Resources** (`resources.html`): the gospel in four words, the bridge diagram ("Christ in our place," Romans 6:23) as a step-by-step walkthrough, a 60-second testimony builder, an "ask, listen, share, invite" guide, the Repenter quadrant with next steps, and books and podcasts to go deeper.

Everything saves in the browser on each person's device. There's no sign-in yet.

## Files
| File | What it is |
| --- | --- |
| `index.html` | The main page |
| `resources.html`, `resources.js` | The resources page and its interactive parts |
| `app.js` | All the logic (checklist, calendar, stats, backup) |
| `goals.js` | The four areas, their suggested goals and the group questions. Edit this to change content. |
| `plan.js` | The Spiritual Workout Plan readings (Fall 2026). Replace the weeks each semester. |
| `style.css` | All the styling. Colors and fonts are tokens at the top. |
| `*.jpg` | The photos (cross in the trees, crucifix, horse, dove, raised hands) |

## Run it
Open `index.html`, or serve the folder with `python3 -m http.server`. To host it, put these files at the root of a GitHub repo and turn on GitHub Pages (Settings → Pages → `main` branch, root).

Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
