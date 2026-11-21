# Unmasked: 15-minute presentation script

Hogr Mehdi · Hunar Hiwa · Nigar Hayder · Database project · Fall 2026

Slides: https://claude.ai/artifact/14JPezVc2xYmUfV1tFUWrf (the same words are in each slide’s speaker notes).

The slides carry very few words on purpose: the pictures are for the room, the words are yours.
Speak slowly. Short sentences. Pause where it says **[pause]**: a pause is worth more than a word.
Lines in **[brackets]** are actions, not words. Everything after `>` is what you say.

Every slide moves: its background is drawn live, and the drawings on it turn, pulse and travel. Present from the deck’s **Present** button in a browser. A PDF or PowerPoint download shows each slide as a still picture.

# The plan at a glance

| # | Part | Slide | Time | Clock |
|---|---|---|---|---|
| 1 | The opening | A mask of light coming apart, your names | 1:20 | 0:00 |
| 2 | The problem | Three myths, struck out | 1:00 | 1:20 |
| 3 | The three rules | Context, clusters, baseline | 0:50 | 2:20 |
| 4 | Three ways in | Three moving emblems | 0:30 | 3:10 |
| 5 | The Map | A breathing heat map | 0:50 | 3:40 |
| 6 | The Mirror | A face of points, its muscles marked | 0:55 | 4:30 |
| 7 | Rehearse | Signals and three numbers | 0:50 | 5:25 |
| 8 | Train your eye | Thirty twinkling dots | 0:50 | 6:15 |
| 9 | **Live demo** | A path with five stops | 4:30 | 7:05 |
| 10 | How it’s built | On paper: lens, browser, server, database | 0:50 | 11:35 |
| 11 | The database | On paper: twelve tables with their keys | 1:05 | 12:25 |
| 12 | Close | A black hole | 0:40 | 13:30 |
| | Questions | | 0:50 | 14:10 |

**If you run long:** in the demo, skip the tests (stop 4) and stop the rehearsal after ten seconds. Slide 10 can be said in 30 seconds.

**Who speaks:** decide among the three of you. A simple split: one person for slides 1 to 8, one drives the demo (slide 9), one for slides 10 to 12 and the questions. Swap at “Let me show you” and at “Back to the slides”.

## Before you start (10 minutes, earlier that day)

1. Double-click **Start Unmasked.bat** in the Why folder (or run `npm.cmd run site` there) and open http://localhost:5181.
2. Open **The Mirror**, click **Turn on the mirror** and allow the camera. The first time, it downloads the face tracker (about 12 MB, needs internet), so do this before you are on stage.
3. Sit facing a light. Face tracking needs your face lit from the front.
4. Do one short rehearsal (Job interview, Start, then Stop early) so you know where the buttons are.
5. Make sure the site is in **English** before you start; the demo ends by switching to Kurdish.
6. Full-screen the browser. Keep the slides in another window, open in **Present**.

# The script

## Slide 1 — The opening (1:20)

Screen: a mask drawn in lines of light, coming apart into dust, and your three names. Walk to the middle. Wait two full seconds before you speak. Let the mask move.

> Look at the person next to you. Just for a second. **[pause]**

> You can see their face. Their eyebrows, their mouth. Whether they are tired. Whether they want to be here. **[pause]**

> Now here is the strange part. Everyone in this room can see your face. Right now. Except you. You are the only person here who cannot see it.

> Your face is talking all the time. So are your eyes, your shoulders, your hands. And people are reading them, whether you want them to or not. So what are they reading? And are they reading it right? **[pause]**

> **[Point at the mask coming apart.]** This is Unmasked. A website about reading the human body: faces, eyes, hands, shoulders, feet. Not to judge people, and not to catch liars. To read them carefully: what a signal usually means, what else it could mean, and what to check before you believe it.

> We are Hogr, Hunar and Nigar. **[click]**

## Slide 2 — The problem (1:00)

> Most of what people believe about body language comes from books, videos and the internet. And a lot of it falls apart the moment you check it.

> **[First card.]** You have probably heard that ninety-three percent of communication is body language. It comes from experiments in the 1960s, where people heard single words said in a tone that did not match them. The man who ran them, Albert Mehrabian, has said himself that the number only applies to feelings and attitudes. Not to communication in general.

> **[Second card.]** Liars look away. They do not, at least not reliably. No single behaviour gives a lie away. Across hundreds of studies, people spot lies about fifty-four percent of the time. **[pause]** That is barely better than tossing a coin.

> **[Third card.]** And power poses that change your hormones: bigger studies could not repeat it.

> So if we want to read bodies, we have to do it differently. **[click]**

Sources, if asked: Mehrabian (1971); Bond and DePaulo (2006); Ranehill and colleagues (2015).

## Slide 3 — The three rules (0:50)

> Here is how. **[pause]** One gesture means almost nothing.

> Three rules. One: context. Read the room before the body. Crossed arms at a bus stop in winter mean cold. The same crossed arms in the middle of an argument mean something else. Same arms, different room.

> Two: clusters. One signal is a guess. Look for three signals pointing the same way.

> Three: baseline. Compare a person to themselves. If a friend who always talks with their hands suddenly goes completely still, that change tells you more than any single gesture ever will. **[Point at the spike.]** That spike is the change.

> Everything on our website is built on these three rules. **[click]**

## Slide 4 — Three ways in (0:30)

> So we built a website with three rooms. Three ways in. **[pause]**

> **[Point left.]** The Map: the whole body, part by part. What each part signals to other people, and what it feels from the inside.

> **[Middle.]** The Mirror: your own face, through your camera. What it is giving away, right now.

> **[Right.]** And Train your eye: tests that teach you to read people properly, one question at a time.

> Let me show you each one quickly, and then you will see them live. **[click]**

## Slide 5 — The Map (0:50)

> The first room is the Map. **[pause]**

> You touch any part of the body, and it tells you two things. What that part says to other people, and what it feels from the inside.

> Take the shoulders. Raised and held usually means cold, fear, bracing yourself. But a quick lift and drop is just a shrug: “I don’t know.” Every signal comes with its context, like that. And with a label for how well the research supports it. Some are well supported, some are contested, and some popular ones are barely supported at all, and we say so.

> **[Point at the heat.]** You can also choose a feeling and see where people feel it in their bodies, like heat. That comes from a real study, where hundreds of people coloured in where they feel each emotion.

> Thirteen parts of the body, thirty-six signals, nine feelings. **[click]**

## Slide 6 — The Mirror (0:55)

> The second room is the Mirror. **[pause]**

> When people first see it tracking their face, they ask a fair question: what is it for? **[pause]** Here is the answer. Everyone can see your face, except you. The Mirror is the first time you get to see what they see.

> It turns on your camera and reads fifteen movements of your face, live, and names the muscle behind each one. These are the same names psychologists use, from the Facial Action Coding System.

> **[Point at the face of points.]** Notice it is only points. That is on purpose: the Mirror does not care who you are. It only follows the points, how each muscle moves.

> **[Point at the two gold points.]** Look at these two. One pulls the corners of your mouth up. The other lifts your cheeks and crinkles your eyes. A smile with only the first reads as polite. A smile with both reads as real. People notice the difference, even if they cannot say why.

> And notice what the Mirror never says: it never tells you what you feel. A raised eyebrow can mean a dozen things. Muscles, never feelings.

> One more thing. The camera never leaves your device. Nothing is recorded, nothing is sent. **[click]**

## Slide 7 — Rehearse (0:50)

> So what do you do with it? You rehearse. **[pause]**

> Before an interview, a presentation, or a hard conversation, you pick the situation. You talk to the camera for forty-five seconds, as if the person were sitting in front of you. And then you get a report of your tells.

> **[Point at the signal.]** This is an example. Gold is smiling. Blue is raised eyebrows. Red is where the lips pressed together. And every spark at the bottom is a blink.

> **[Point at the numbers.]** Thirty-one blinks a minute, when about twenty-six is usual while talking. Four smiles, and only one of them reached the eyes. Four times the lips pressed together, which people often read as holding something back.

> **[pause]** These are cues, not verdicts. The report tells you where people might look. It never tells you what you felt.

> Then you try again, and it compares you with your last try. There is also a Poker face mode, where you keep your face still while six lines try to provoke it. **[click]**

## Slide 8 — Train your eye (0:50)

> The third room trains your eye. Three tests, thirty questions. Every dot here is one question.

> **[Gold.]** The eyes test, twelve questions. You see only a thin strip of a face, just the eyes, and four feelings that are deliberately close. You choose, and then the frame widens to show the whole face. This format comes from a real psychology test.

> **[Pale.]** The body test, ten questions. The face stays hidden until you answer, so you have to read the posture alone.

> **[Blue.]** And the context test, eight questions, which is my favourite. The same crossed arms appear in different scenes. In the snow, they mean cold. Facing someone in an argument, they mean angry. In a lecture, they mean concentrating. That is rule number one, context, turned into a test.

> And every answer explains itself. You do not just get “wrong”. You get the cues that decided it, because a score on its own teaches you nothing.

> **[pause]** Enough slides. Let me show you. **[click]**

## Slide 9 — Live demo (4:30)

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

## Slide 10 — How it’s built (0:50)

Screen, on paper: a lens, a browser, a server and a database drawn in ink, a dashed line between your device and our server, and a light going out along the top line and back along the blue one.

> Now the engine: what makes it run. Two places: your device, and our server. **[pause]**

> **[Left.]** Everything on this side runs on your own device. The lens is the face tracker, MediaPipe, made by Google. It downloads once, about twelve megabytes, and then reads your camera inside the browser. What it passes on is not a picture: it is fifty-two numbers for every frame, how much each part of your face is moving. Your camera image never leaves your device.

> **[The browser.]** The website, made with React and Vite, in two languages, English and Kurdish Sorani. Kurdish is written right to left, so the whole layout flips.

> **[Right.]** Our server: the API, written in Node with Express, and the database, PostgreSQL 17.

> **[Point at the light.]** Every click goes out along the top line: the website asks with fetch, the API turns the question into SQL, the database answers with rows. And the answer comes back along the blue line, as JSON.

> We write plain SQL, with no ORM, so every query can be shown and checked in pgAdmin. **[click]**

## Slide 11 — The database (1:05)

Screen, on paper: twelve of the tables drawn as cards with their keys, each foreign key a line with a crow’s foot on its “many” side, coloured by part of the site (red the Map, blue the Mirror, gold the tests), and two notes underneath on the views and the triggers.

> And where it all lives: the database, the heart of this project. PostgreSQL 17: thirty-one tables, five views and four triggers, in plain SQL. **[pause]**

> These are twelve of them, with their keys. Each line is a foreign key; the crow’s foot is the “many” side.

> **[Left, red.]** The Map: body parts, which can sit inside each other; the signals of each part; and their words, in signal_texts, one row per language. Every table that holds words has a twin like that.

> **[Middle.]** Languages and visitors are shared. A visitor is just a random id the browser keeps: no names, no pictures.

> **[Blue.]** The Mirror: each rehearsal belongs to a visitor and a situation.

> **[Gold.]** The tests: a test has questions, a question has options. An attempt belongs to a visitor, and each answer points at its attempt, its question and its option.

> **[Point at the notes below.]** The views do the counting the site shows: scores, and how everyone else answered. And the triggers guard the data: an answer must belong to its test and its question, and the last answer finishes the attempt. **[click]**

## Slide 12 — Close (0:40)

Slow down for the last slide. Let the black hole turn for a moment before you speak.

> We started with a question. Everyone in this room can see your face. What are they reading in it? **[pause]**

> Unmasked is how you find out. Read the room before the body. Look for clusters, not single signals. Compare people to themselves. And now, for the first time, see what everyone else sees when they look at you.

> **[pause]** Everyone can see your face. Now you can too.

> Thank you. **[pause]** We are happy to take your questions.

# Likely questions

- **“Can it tell if I am lying?”** No, and nothing can, reliably, from the body alone. The site says so on purpose.
- **“Does it read emotions?”** No. It names muscles and the cues people tend to read, never feelings, because a face alone is not enough to know what someone feels.
- **“Is my video saved?”** No. The camera image stays in the browser. Only the numbers of a rehearsal report are kept.
- **“Why PostgreSQL?”** It is a full relational database with real constraints, views and triggers, it is free, and plain SQL lets us show every query.
- **“Can you add a question, or anything else, without changing the code?”** Yes. The site has an admin page, `/admin`, behind a sign-in. An admin can add, edit, reorder or delete test questions, Map signals, Rehearse situations and Poker face lines, in English and Kurdish. Every change goes straight into the database and is written to a log, `admin.changes`; passwords are kept only as scrypt hashes. The admin tables sit in their own schema, apart from the thirty-one tables the site reads. We can show it live.
- **“Where do the facts come from?”** Every page links its sources on the How page: body-mapping research (Nummenmaa and colleagues, 2014), the Facial Action Coding System (Ekman, Friesen and Hager, 2002), the eyes test format (Baron-Cohen and colleagues, 2001), and more.
- **“Why Kurdish?”** Because it is our language, and people should be able to learn this in it.
- **“What is the black hole?”** It is drawn live, the way the film Interstellar showed Gargantua: the disk behind the hole is bent over the top and under the bottom by its gravity.
