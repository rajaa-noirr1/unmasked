# Unmasked

**The mind hides it. The body gives it away.** Unmasked is a psychology website about the human body, in English and Kurdish (Sorani): what each part signals to other people, what it feels like from the inside, and how to read it carefully instead of guessing. It is a university database project: the front end comes first, then the backend; AI comes in the spring semester.

**Online:** https://rajaa-noirr1.github.io/unmasked/

By Hogr Mehdi, Hunar Hiwa and Nigar Hayder.

## Run it

You need Node 18 or newer and PostgreSQL 17 (already installed on this laptop, with pgAdmin).

```
npm --prefix client install
npm --prefix server install
npm run db:reset
npm run dev
```

The first three are only needed once. `npm run db:reset` builds the database: it creates the website's own database user (`unmasked_app`) and the `unmasked` database, then runs `server/db/schema.sql` and `server/db/seed.sql`. It asks for the PostgreSQL superuser (`postgres`) password the first time, unless you put it in `server/.env` as `POSTGRES_PASSWORD=...`. Run it again any time for a clean database (it also wipes saved rehearsals and test answers).

`npm run dev` starts the API (http://localhost:4100) and the website (http://localhost:5180, the editing server: changes show up instantly) together.

To host the finished site on this computer, double-click **Start Unmasked.bat** (or run `npm run site`). It builds the production version, starts the API, serves the site at http://localhost:5181 and opens it in your browser. Keep that window open while you use the site; closing it stops both.

If PowerShell says "running scripts is disabled on this system", use `npm.cmd` instead of `npm` (for example `npm.cmd run site`), or just use the .bat file.

`npm test` checks the API on the real database: the content it serves must be identical to the site's own, and the constraints and triggers must refuse bad data.

To update the online version after a change, commit it, then run `npm run deploy:pages`. It builds the site for GitHub Pages (served from `/unmasked/`, into `client/dist-pages`) and pushes that build to the `gh-pages` branch; the site updates within a minute or two. The online version has no API: it shows the built-in copy of the content and keeps rehearsals and scores in the browser.

## The pages

| Page | Route | What it does |
|---|---|---|
| Home | `/` | A brain of 20,000 glowing points (WebGL, adapted from React Bits Particles) that fires impulses, faster when you hover a button, and names the lobe under your cursor; a first eyes question; a room for each section |
| The Map | `/map` | A body made of about 8,000 particles. Tap a part to see what it signals and what it feels; pick a feeling to see where people feel it |
| The Mirror | `/mirror` | Webcam face tracking that names the muscles moving (FACS action units). *Rehearse* (talk for 45 seconds, get a report of your tells, saved to compare with your last try), *Poker face* and *Perform it* |
| Train your eye | `/train`, `/train/:id` | Three tests: eyes (a strip of eyes from a photo, which widens after the answer), body (photos with the face hidden until the answer) and context (one silhouette pose in different scenes). Every answer explains itself |
| Patterns | `/patterns` | Hidden for now (`SHOW_PATTERNS` in `client/src/config.js`). Sixteen behaviour patterns and 25 *Dark words*; the code is all still there |
| How to read a body | `/how` | Context, clusters and baseline; claims nobody can back up; sources and credits |

## Structure

```
server/
  db/           schema.sql (tables, triggers, views) and seed.sql (generated: do not edit by hand)
  src/          the API: app.js (routes), content.js (the content queries), db.js
  scripts/      db-reset.mjs, build-seed.mjs
  test/         end-to-end tests on the real database
client/src/
  pages/        one file per route
  components/   the site's own pieces: Brain, Logo, ParticleBody, Silhouette, PhotoPlate, Headline, EyeStrip, Photo, QuestionCard, Shell
  effects/      visual effects adapted from React Bits (see THIRD-PARTY-NOTICES.md)
  data/         the built-in copy of the content (the database is seeded from it)
  lib/          WebGL helpers, the brain's shape, the face tracker, the API client, React hooks
  i18n/         the language switch; ckb/ holds the Kurdish (Sorani) text for the Map, tests and Mirror
  styles/       base, shell and components, plus one stylesheet per page
```

## The database

PostgreSQL 17, plain SQL, no ORM: `server/db/schema.sql` (31 tables, triggers and views) and `server/db/seed.sql` (the content). Open the `unmasked` database in pgAdmin to see it.

- **Content is rows; words are rows per language.** Every body part, signal, feeling, muscle, expression, scenario, test, question and option is one row, and its words sit in a matching `*_texts` table with one row per language (`en`, `ckb`). Adding a language adds rows, never columns.
- **Five groups.** Languages and evidence levels; the Map (`body_parts` with a parent for brows, eyes, mouth and skin, `signals`, `feelings`, `feeling_heat`); the Mirror (`action_units`, `expressions`, `expression_units`, `poker_prompts`, `scenarios`, `report_measures`); the tests (`tests`, `questions`, `options` with exactly one right answer each); visitors (`visitors`, `rehearsals`, `test_attempts`, `attempt_answers`).
- **Visitors have no accounts.** The browser makes a random id (a UUID) and keeps it. Rehearse reports are numbers only: no video, sound or picture is ever stored.
- **Rules in the database.** CHECK constraints (a rehearsal cannot have more eye-reaching smiles than smiles), a trigger that refuses an answer from the wrong question or test, a trigger that closes an attempt when its last question is answered, and views the site reads: `attempt_scores`, `question_stats`, `option_picks` (how everyone answered) and `rehearsal_progress` (each rehearsal next to the one before, with a window function).
- **Where the content comes from.** The site's content files (`client/src/data/`, Kurdish in `client/src/i18n/ckb/`) are the source the seed is built from: after changing them, run `npm run db:seed:build`, then `npm run db:reset`.

The API (`server/src/app.js`): `GET /api/content` (everything the pages show, both languages), `POST /api/rehearsals`, `GET /api/rehearsals?visitor=…`, `POST /api/attempts`, `POST /api/attempts/:id/answers`, `GET /api/attempts/:id`, `GET /api/stats/questions`, `GET /api/health`.

Translations: page text sits beside its English as a pair, `t(['English', 'کوردی'])`. The longer content is translated in `client/src/i18n/ckb/` by id. Test answers are stored as the position of the right option, so they stay correct in both languages.

## Good to know

- The eyes and body tests use your own photos in `client/public/images/eyes` and `client/public/images/body`. The file names, and what each photo should show, are in `client/public/images/SHOT-LIST.md`. Framing (eye crop, face blur) and who is in each photo go in `client/src/data/photos.js`.
- The Mirror downloads Google's MediaPipe face tracker (around 12 MB) from public CDNs the first time someone turns it on. Video never leaves the device.
- Honesty rules the whole site follows: the Mirror reports muscles, never feelings; patterns are states, not diagnoses; every signal on the Map shows how well the research supports it.

## Credits

Photos in the tests: film and TV stills, the property of their owners, used for teaching. Face tracking: MediaPipe by Google (Apache 2.0). Visual effects: React Bits by David Haz (MIT + Commons Clause; the notice is in `THIRD-PARTY-NOTICES.md`). Type: Newsreader, Roboto Flex, Zain for Kurdish (SIL Open Font License). The research behind each claim is listed on the `/how` page.
