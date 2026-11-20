# Unmasked

**The mind hides it. The body gives it away.** Unmasked is a psychology website about the human body, in English and Kurdish (Sorani): what each part signals to other people, what it feels like from the inside, and how to read it carefully instead of guessing. It is a university database project: the front end comes first, then the backend; AI comes in the spring semester.

**Online:** https://rajaa-noirr1.github.io/unmasked/

By Hogr Mehdi, Hunar Hiwa and Nigar Hayder.

## Run it

You need Node 18 or newer.

```
npm --prefix client install
npm run dev
```

The first command is only needed once. The site opens at http://localhost:5180 (the editing server: changes show up instantly).

To host the finished site on this computer, double-click **Start Unmasked.bat** (or run `npm run site`). It builds the production version, serves it at http://localhost:5181 and opens it in your browser. Keep that window open while you use the site; closing it stops the site.

If PowerShell says "running scripts is disabled on this system", use `npm.cmd` instead of `npm` (for example `npm.cmd run site`), or just use the .bat file.

To update the online version after a change, commit it, then run `npm run deploy:pages`. It builds the site for GitHub Pages (served from `/unmasked/`, into `client/dist-pages`) and pushes that build to the `gh-pages` branch; the site updates within a minute or two.

## The pages

| Page | Route | What it does |
|---|---|---|
| Home | `/` | A brain of 20,000 glowing points (WebGL, adapted from React Bits Particles) that fires impulses, faster when you hover a button, and names the lobe under your cursor; a first eyes question; a room for each section |
| The Map | `/map` | A body made of about 8,000 particles. Tap a part to see what it signals and what it feels; pick a feeling to see where people feel it |
| The Mirror | `/mirror` | Webcam face tracking that names the muscles moving (FACS action units), plus *Perform it* and *Poker face*. Without a camera, a drawn face demonstrates the same thing |
| Train your eye | `/train`, `/train/:id` | Three tests: eyes (a strip of eyes from a photo, which widens after the answer), body (photos with the face hidden until the answer) and context (one silhouette pose in different scenes). Every answer explains itself |
| Patterns | `/patterns` | Hidden for now (`SHOW_PATTERNS` in `client/src/config.js`). Sixteen behaviour patterns and 25 *Dark words*; the code is all still there |
| How to read a body | `/how` | Context, clusters and baseline; claims nobody can back up; sources and credits |

## Structure

```
client/src/
  pages/        one file per route
  components/   the site's own pieces: Brain, Logo, ParticleBody, Silhouette, Face, FacePlate, EyeStrip, Photo, QuestionCard, Shell
  effects/      visual effects adapted from React Bits (see THIRD-PARTY-NOTICES.md)
  data/         all of the content, shaped like the future database tables
  lib/          WebGL helpers, the brain's shape, the face tracker, React hooks
  i18n/         the language switch; ckb/ holds the Kurdish (Sorani) text for the Map, tests and Mirror
  styles/       base, shell and components, plus one stylesheet per page
```

## For the backend

Everything in `client/src/data/` is written to become database tables:

| File | Becomes |
|---|---|
| `body.js` | regions, signals (tell, meaning, context, evidence strength), feelings, body maps |
| `tests.js` | tests, questions, options and answers, plus an attempts table for scores |
| `photos.js` | photos (file, who, crop, face blur) |
| `patterns.js` | patterns, their traits, dark words and their groups |
| `mirror.js` | action units, expression targets, poker-face prompts |
| `poses.js` | poses (joint angles for the silhouettes) |

For now, best scores and the chosen language are saved in the browser (`localStorage`, keys starting with `unmasked:`).

Translations: page text sits beside its English as a pair, `t(['English', 'کوردی'])`. The longer content is translated in `client/src/i18n/ckb/` by id, which maps onto a translations table. Test answers are stored as the position of the right option, so they stay correct in both languages.

## Good to know

- The eyes and body tests use your own photos in `client/public/images/eyes` and `client/public/images/body`. The file names, and what each photo should show, are in `client/public/images/SHOT-LIST.md`. Framing (eye crop, face blur) and who is in each photo go in `client/src/data/photos.js`.
- The Mirror downloads Google's MediaPipe face tracker (around 12 MB) from public CDNs the first time someone turns it on. Video never leaves the device.
- Honesty rules the whole site follows: the Mirror reports muscles, never feelings; patterns are states, not diagnoses; every signal on the Map shows how well the research supports it.

## Credits

Photos in the tests: film and TV stills, the property of their owners, used for teaching. Face tracking: MediaPipe by Google (Apache 2.0). Visual effects: React Bits by David Haz (MIT + Commons Clause; the notice is in `THIRD-PARTY-NOTICES.md`). Type: Newsreader, Roboto Flex, Zain for Kurdish (SIL Open Font License). The research behind each claim is listed on the `/how` page.
