# Unmasked: 15-minute presentation script

Hogr Mehdi · Hunar Hiwa · Nigar Hayder · Database project · Fall 2026

Slides: https://claude.ai/artifact/14JPezVc2xYmUfV1tFUWrf (the same words are in each slide’s speaker notes).

The slides carry very few words on purpose: the pictures are for the room, the words are yours.
Speak slowly. Short sentences. Pause where it says **[pause]**: a pause is worth more than a word.
Lines in **[brackets]** are actions, not words. Everything after `>` is what you say.

# The plan at a glance

| # | Part | Slide | Time | Clock |
|---|---|---|---|---|
| 1 | The hook | A glowing iris | 1:00 | 0:00 |
| 2 | The name | Hannibal's face, your names | 0:30 | 1:00 |
| 3 | The problem | Three myths, struck out | 1:00 | 1:30 |
| 4 | The three rules | Context, clusters, baseline | 0:50 | 2:30 |
| 5 | Three ways in | Three emblems | 0:30 | 3:20 |
| 6 | The Map | A heat map of dots | 0:50 | 3:50 |
| 7 | The Mirror | A face of points | 0:50 | 4:40 |
| 8 | Rehearse | Signals and three numbers | 0:50 | 5:30 |
| 9 | Train your eye | Thirty dots | 0:50 | 6:20 |
| 10 | **Live demo** | A path with five stops | 4:30 | 7:10 |
| 11 | How it’s built | Four parts on one line | 0:45 | 11:40 |
| 12 | The database | Three rings of tables | 1:00 | 12:25 |
| 13 | What comes next | Three stages | 0:35 | 13:25 |
| 14 | Close | Thank you | 0:30 | 14:00 |
| | Questions | | 1:00 | 14:30 |

**If you run long:** in the demo, skip the tests (stop 4) and stop the rehearsal after ten seconds. Slide 11 can be said in 30 seconds.

**Who speaks:** decide among the three of you. A simple split: one person for slides 1 to 9, one drives the demo (slide 10), one for slides 11 to 14 and the questions. Swap at “Let me show you” and at “Back to the slides”.

## Before you start (10 minutes, earlier that day)

1. Double-click **Start Unmasked.bat** in the Why folder (or run `npm.cmd run site` there) and open http://localhost:5181.
2. Open **The Mirror**, click **Turn on the mirror** and allow the camera. The first time, it downloads the face tracker (about 12 MB, needs internet), so do this before you are on stage.
3. Sit facing a light. Face tracking needs your face lit from the front.
4. Do one short rehearsal (Job interview, Start, then Stop early) so you know where the buttons are.
5. Make sure the site is in **English** before you start; the demo ends by switching to Kurdish.
6. Full-screen the browser. Keep the slides in another window.

# The script

## Slide 1 — The hook (1:00)

Screen: a huge iris made of light. **Do not say the project’s name yet.** Walk to the middle. Wait two full seconds.

> Look at the person next to you. Just for a second. **[pause]**

> You can see their face. Their eyebrows, their mouth. Whether they are tired. Whether they want to be here. **[pause]**

> Now here is the strange part. Everyone in this room can see your face. Right now. Every second you talk, every second you listen. **[pause]**

> Except you. You are the only person here who cannot see it.

> Your face is talking all the time. So are your eyes, your shoulders, your hands. And people are reading them, whether you want them to or not. **[pause]**

> So the question is: what are they reading? And are they reading it right? **[click]**

## Slide 2 — The name (0:30)

Let the picture settle before you speak.

> This is Unmasked. **[pause]**

> Look at this face. Calm, polite, almost smiling. And still, something in it tells you to be careful. **[pause]** That is what this project is about: what a face gives away, even when it is trying not to.

> Unmasked is a website about reading the human body. Faces, eyes, hands, shoulders, feet. Not to judge people, and not to catch liars. To read them carefully: what a signal usually means, what else it could mean, and what to check before you believe it.

> We are Hogr, Hunar and Nigar. **[click]**

## Slide 3 — The problem (1:00)

> Most of what people believe about body language comes from books, videos and the internet. And a lot of it falls apart the moment you check it.

> **[First card.]** You have probably heard that ninety-three percent of communication is body language. It comes from experiments in the 1960s, where people heard single words said in a tone that did not match them. The man who ran them, Albert Mehrabian, has said himself that the number only applies to feelings and attitudes. Not to communication in general.

> **[Second card.]** Liars look away. They do not, at least not reliably. No single behaviour gives a lie away. Across hundreds of studies, people spot lies about fifty-four percent of the time. **[pause]** That is barely better than tossing a coin.

> **[Third card.]** And power poses that change your hormones: bigger studies could not repeat it.

> So if we want to read bodies, we have to do it differently. **[click]**

Sources, if asked: Mehrabian (1971); Bond and DePaulo (2006); Ranehill and colleagues (2015).

## Slide 4 — The three rules (0:50)

> Here is how. **[pause]** One gesture means almost nothing.

> Three rules. One: context. Read the room before the body. Crossed arms at a bus stop in winter mean cold. The same crossed arms in the middle of an argument mean something else. Same arms, different room.

> Two: clusters. One signal is a guess. Look for three signals pointing the same way.

> Three: baseline. Compare a person to themselves. If a friend who always talks with their hands suddenly goes completely still, that change tells you more than any single gesture ever will. **[Point at the spike.]** That spike is the change.

> Everything on our website is built on these three rules. **[click]**

## Slide 5 — Three ways in (0:30)

> So we built a website with three rooms. Three ways in. **[pause]**

> **[Point left.]** The Map: the whole body, part by part. What each part signals to other people, and what it feels from the inside.

> **[Middle.]** The Mirror: your own face, through your camera. What it is giving away, right now.

> **[Right.]** And Train your eye: tests that teach you to read people properly, one question at a time.

> Let me show you each one quickly, and then you will see them live. **[click]**

## Slide 6 — The Map (0:50)

> The first room is the Map. **[pause]**

> You touch any part of the body, and it tells you two things. What that part says to other people, and what it feels from the inside.

> Take the shoulders. Raised and held usually means cold, fear, bracing yourself. But a quick lift and drop is just a shrug: “I don’t know.” Every signal comes with its context, like that. And with a label for how well the research supports it. Some are well supported, some are contested, and some popular ones are barely supported at all, and we say so.

> **[Point at the heat.]** You can also choose a feeling and see where people feel it in their bodies, like heat. That comes from a real study, where hundreds of people coloured in where they feel each emotion.

> Thirteen parts of the body, thirty-six signals, nine feelings. **[click]**

## Slide 7 — The Mirror (0:50)

> The second room is the Mirror. **[pause]**

> When people first see it tracking their face, they ask a fair question: what is it for? **[pause]** Here is the answer. Everyone can see your face, except you. The Mirror is the first time you get to see what they see.

> It turns on your camera and reads fifteen movements of your face, live, and names the muscle behind each one. These are the same names psychologists use, from the Facial Action Coding System.

> **[Point at the two gold points.]** Look at these two. One pulls the corners of your mouth up. The other lifts your cheeks and crinkles your eyes. A smile with only the first reads as polite. A smile with both reads as real. People notice the difference, even if they cannot say why.

> And notice what the Mirror never says: it never tells you what you feel. A raised eyebrow can mean a dozen things. Muscles, never feelings.

> One more thing. The camera never leaves your device. Nothing is recorded, nothing is sent. **[click]**

## Slide 8 — Rehearse (0:50)

> So what do you do with it? You rehearse. **[pause]**

> Before an interview, a presentation, or a hard conversation, you pick the situation. You talk to the camera for forty-five seconds, as if the person were sitting in front of you. And then you get a report of your tells.

> **[Point at the signal.]** This is an example. Gold is smiling. Blue is raised eyebrows. Red is where the lips pressed together. And every spark at the bottom is a blink.

> **[Point at the numbers.]** Thirty-one blinks a minute, when about twenty-six is usual while talking. Four smiles, and only one of them reached the eyes. Four times the lips pressed together, which people often read as holding something back.

> **[pause]** These are cues, not verdicts. The report tells you where people might look. It never tells you what you felt.

> Then you try again, and it compares you with your last try. There is also a Poker face mode, where you keep your face still while six lines try to provoke it. **[click]**

## Slide 9 — Train your eye (0:50)

> The third room trains your eye. Three tests, thirty questions. Every dot here is one question.

> **[Gold.]** The eyes test, twelve questions. You see only a thin strip of a face, just the eyes, and four feelings that are deliberately close. You choose, and then the frame widens to show the whole face. This format comes from a real psychology test.

> **[Pale.]** The body test, ten questions. The face stays hidden until you answer, so you have to read the posture alone.

> **[Blue.]** And the context test, eight questions, which is my favourite. The same crossed arms appear in different scenes. In the snow, they mean cold. Facing someone in an argument, they mean angry. In a lecture, they mean concentrating. That is rule number one, context, turned into a test.

> And every answer explains itself. You do not just get “wrong”. You get the cues that decided it, because a score on its own teaches you nothing.

> **[pause]** Enough slides. Let me show you. **[click]**

## Slide 10 — Live demo (4:30)

Switch to the browser, full screen, on the home page. Talk while you click; never wait in silence.

**01 · The brain (40 s)**

> This is the home page. **[Move the pointer slowly over the brain.]** The brain is made of thousands of points of light. Point at any part and it lights up and tells you what it does. The front, the frontal lobe, plans and controls the expressions you choose to make. **[Click the brain once.]** Click, and it fires a signal. **[Move the pointer over the headline.]** Even the headline reacts: the letters swell as you pass them.

**02 · The Map (50 s)**

> **[Click The Map.]** The Map. **[Click Anger.]** I choose anger, and watch where it lands: the head, the chest, the arms, the fists. **[Click the shoulders.]** Now the shoulders: what they say, what they feel, and how the setting changes the reading. And this badge: how strong the evidence is.

**03 · The Mirror (1 min 40 s)**

> **[Click The Mirror.]** The Mirror. **[Move the pointer over the portrait’s face.]** Before the camera, notice the portrait: move over his face and it unmasks him, and the muscle under the lens lights up. **[Click Turn on the mirror.]** Now my own face. **[Raise your eyebrows, then smile.]** Watch the names on the right: frontalis when I raise my brows. Zygomaticus when I smile. **[Rehearse tab, Job interview, Start.]** Let me rehearse a job interview. **[Talk for about fifteen seconds, then click Stop early.]** And here is my report. **[Point at one number and say what it found.]**

If the camera does not start: click **See an example first** and show the example report instead.

**04 · The tests (50 s)**

> **[Click Train your eye, then the context test.]** The context test. **[Answer the first question.]** Whatever I pick, the answer explains itself: the cues that decided it.

**05 · Kurdish (30 s)**

> **[Click کوردی in the top corner.]** And one more thing. The whole website, every page, every test, in Kurdish Sorani. Right to left. **[Click English to switch back.]**

> **[Switch back to the slides.]** Back to the slides. **[click]**

## Slide 11 — How it’s built (0:45)

> How is it built? Four parts, on one line. **[pause]**

> **[First circle.]** The face tracker is MediaPipe, made by Google. It runs inside the browser, on your own device. It downloads once, about twelve megabytes, and after that your camera image never leaves your computer.

> **[Second.]** The website, made with React and Vite. Every page exists in two languages, English and Kurdish Sorani. And Kurdish is written right to left, so the whole layout flips: the menus, the arrows, even the animations run the other way.

> **[Third.]** Next comes the API, written in Node with Express. It takes each request from the website and runs the SQL.

> **[Fourth.]** And the database: PostgreSQL 17. It keeps everything.

> **[Point at the light travelling along the line.]** Every click travels along this line: from the website, through the API, into the database, and back.

> The gold parts are built. The blue parts are what we build next. And we write plain SQL, with no ORM, so every query can be shown and checked in pgAdmin. **[click]**

## Slide 12 — The database (1:00)

> The database is the heart of this project. PostgreSQL 17, fifteen tables, in plain SQL. **[pause]**

> The good news is that the content already exists: we wrote it as data from the start, shaped like tables. So these numbers are real rows.

> **[Gold ring.]** The Map: thirteen body parts, thirty-six signals, and nine feelings, each with a heat value for every part of the body.

> **[Pale ring.]** The Mirror: fifteen muscles, eight expressions to practise, and five situations to rehearse. And rehearsals: every time someone rehearses, the report is saved as a row, so you can see if you improve.

> **[Blue ring.]** The tests: three tests, thirty questions, a hundred and twenty answer options. And test attempts, so scores are kept.

> **[Bottom.]** And one group that touches everything: translations. Every word on the site, in English and in Kurdish.

> That is the plan for the backend: the website will read all of this from the database instead of from files. **[click]**

## Slide 13 — What comes next (0:35)

> So where are we? **[pause]**

> **[Left.]** Now: the front end is done. The Map, the Mirror, three tests, in two languages. That is what you just saw.

> **[Middle.]** Next: the backend and the database. Everything you saw moves into the tables from the last slide. And the website starts remembering: your rehearsals and your test scores are saved, so you can see your progress.

> **[Right.]** And in the spring, the second semester, we add AI, built on top of that database. **[click]**

## Slide 14 — Close (0:30)

Slow down for the last slide.

> We started with a question. Everyone in this room can see your face. What are they reading in it? **[pause]**

> Unmasked is how you find out. Read the room before the body. Look for clusters, not single signals. Compare people to themselves. And now, for the first time, see what everyone else sees when they look at you.

> **[pause]** Everyone can see your face. Now you can too.

> Thank you. **[pause]** We are happy to take your questions.

# Likely questions

- **“Can it tell if I am lying?”** No, and nothing can, reliably, from the body alone. The site says so on purpose.
- **“Does it read emotions?”** No. It names muscles and the cues people tend to read, never feelings, because a face alone is not enough to know what someone feels.
- **“Is my video saved?”** No. The camera image stays in the browser. Only the numbers of a rehearsal report are kept.
- **“Why PostgreSQL?”** It is a full relational database with real constraints, views and triggers, it is free, and plain SQL lets us show every query.
- **“Where do the facts come from?”** Every page links its sources on the How page: body-mapping research (Nummenmaa and colleagues, 2014), the Facial Action Coding System (Ekman, Friesen and Hager, 2002), the eyes test format (Baron-Cohen and colleagues, 2001), and more.
- **“Why Kurdish?”** Because it is our language, and people should be able to learn this in it.
