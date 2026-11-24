# Unmasked: presentation script (11 minutes, then questions)

Hogr Mehdi · Hunar Hiwa · Nigar Hayder · Database project · Fall 2026

Slides: https://claude.ai/artifact/14JPezVc2xYmUfV1tFUWrf (the same words are in each slide’s speaker notes).

Three speakers, one line through the whole talk: why this project matters, then how it works, then how it is built and what comes next. You do not need to learn the words by heart: know the idea of each slide and say it your own way.
Speak slowly. Short sentences. Pause where it says **[pause]**: a pause is worth more than a word.
Lines in **[brackets]** are actions, not words. Everything after `>` is what you say.

Every slide moves: its background is drawn live, and the drawings on it turn, pulse and travel. Present from the deck’s **Present** button in a browser. A PDF or PowerPoint download shows each slide as a still picture.

# The plan at a glance

| # | Part | Speaker | Slide | Time | Clock |
|---|---|---|---|---|---|
| 1 | The opening | 1 | A mask of light coming apart in a room of moving light, your names | 1:00 | 0:00 |
| 2 | Not another management system | 1 | A library, a restaurant, a bookstore, and a table of live data | 0:45 | 1:00 |
| 3 | Why it matters to you | 1 | A figure with no face, eyes all around it | 0:45 | 1:45 |
| 4 | The problem | 1 | Three myths, struck out | 0:50 | 2:30 |
| 5 | The three rules | 1 | Context, clusters, baseline | 0:45 | 3:20 |
| 6 | Three ways in | 1, then 2 | Three moving emblems; hand over | 0:20 | 4:05 |
| 7 | **Live demo** | 2 | “Live”, and five stops with their times | 3:30 | 4:25 |
| 8 | How it’s built | 3 | On paper: lens, browser, server, database | 0:50 | 7:55 |
| 9 | The database | 3 | On paper: twelve tables with their keys | 1:05 | 8:45 |
| 10 | What comes next | 3 | Now, spring, then smart glasses | 1:15 | 9:50 |
| 11 | Close | 3 | An eye of light opening | 0:30 | 11:05 |
| | Questions | all three | | 3:25 | 11:35 |

**If you run long:** in the demo, skip the tests (stop 4) and stop the rehearsal after ten seconds. Slide 8 can be said in 30 seconds.

**Hand-overs:** speaker 1 hands over on slide 6 (“[name] will show you, live”); speaker 2 hands back at the end of the demo (“Now [name] will show you what is behind it”). Say each other’s names.

The deck also holds four hidden slides at the end (the Map, the Mirror, Rehearse, Train your eye). The live demo shows the same things; unhide one in the editor if you want it back.

## Before you start (10 minutes, earlier that day)

1. Double-click **Start Unmasked.bat** in the Why folder (or run `npm.cmd run site` there) and open http://localhost:5181, or use the online version: https://rajaa-noirr1.github.io/unmasked/. Make sure the site is in **English**: the demo ends by switching to Kurdish.
2. Open **The Mirror**, click **Turn on the mirror** and allow the camera. The first time, it downloads the face tracker (about 12 MB, needs internet), so do this before you are on stage.
3. Speaker 2: stand or sit facing a light, so the camera can read the muscles. If the camera fails during the demo, click **See an example first** and show the example report.
4. Do one short rehearsal (Job interview, Start, then Stop early) so you know where the buttons are.
5. In a second tab, sign in at http://localhost:5181/admin, in case the teacher asks you to add a question.
6. Full-screen the browser. Keep the slides in another window, open in **Present**.

# Speaker 1 — Why this project (about 4 minutes)

## Slide 1 — The opening (1:00)

Screen: a mask drawn in lines of light, coming apart into dust, and your three names. Walk to the middle. Wait two full seconds before you speak. Let the mask move.

> Look at the person next to you. Just for a second. **[pause]**

> You can see their face. Their eyebrows, their mouth. Whether they are tired. Whether they want to be here. **[pause]**

> Now here is the strange part. Everyone in this room can see your face. Right now. Except you. You are the only person here who cannot see it.

> Your face is talking all the time. So are your eyes, your shoulders, your hands. And people are reading them, whether you want them to or not. So what are they reading? And are they reading it right? **[pause]**

> **[Point at the mask coming apart.]** This is Unmasked. A website about reading the human body: faces, eyes, hands, shoulders, feet. Not to judge people, and not to catch liars. To read them carefully: what a signal usually means, what else it could mean, and what to check before you believe it.

> We are Hogr, Hunar and Nigar. **[click]**

## Slide 2 — Not another management system (0:45)

Screen: three grey cards (a library, a restaurant, a bookstore) with rows of names and numbers, an arrow, and a glowing gold table of live data from Unmasked, a light running down its rows.

> When people hear “database project”, they think of a library system. A restaurant system. A bookstore. **[Point at the grey cards.]** Those matter, but a database is not only for storing names and numbers.

> Every real website has a database behind it. Without one, a site is like a PDF: it cannot learn anything, compare anything, or show you your progress.

> **[Point at the gold table.]** So we took the database somewhere alive: the psychology of the human body. Every signal of every part of the body, every muscle the camera reads, every test answer, every rehearsal someone does, is a row. That is Unmasked. **[click]**

## Slide 3 — Why it matters to you (0:45)

Screen: a figure with no face in the middle, eight eyes around it looking in; three situations; two lines on what Unmasked gives you.

> Why should this matter to you? **[pause]**

> Remember: everyone in this room can see your face, except you. **[Point at the eyes around the figure.]**

> After university, every one of us will sit in job interviews, give presentations, have hard conversations. Plenty of smart people lose there, not because of what they say, but because of habits they never knew they had: looking away, pressing their lips, blinking fast.

> **[First line.]** Unmasked works like a free coach. It shows you your own tells, so you can work on them.

> **[Second line.]** And it is in Kurdish, with every claim checked against research, not against what goes viral on TikTok and social media. **[click]**

## Slide 4 — The problem (0:50)

> Most of what people believe about body language comes from books, videos and the internet. And a lot of it falls apart the moment you check it.

> **[First card.]** You have probably heard that ninety-three percent of communication is body language. It comes from experiments in the 1960s, where people heard single words said in a tone that did not match them. The man who ran them, Albert Mehrabian, has said himself that the number only applies to feelings and attitudes. Not to communication in general.

> **[Second card.]** Liars look away. They do not, at least not reliably. No single behaviour gives a lie away. Across hundreds of studies, people spot lies about fifty-four percent of the time. **[pause]** That is barely better than tossing a coin.

> **[Third card.]** And power poses that change your hormones: bigger studies could not repeat it.

> So if we want to read bodies, we have to do it differently. **[click]**

Sources, if asked: Mehrabian (1971); Bond and DePaulo (2006); Ranehill and colleagues (2015).

## Slide 5 — The three rules (0:45)

> Here is how. **[pause]** One gesture means almost nothing.

> Three rules. One: context. Read the room before the body. Crossed arms at a bus stop in winter mean cold. The same crossed arms in the middle of an argument mean something else. Same arms, different room.

> Two: clusters. One signal is a guess. Look for three signals pointing the same way.

> Three: baseline. Compare a person to themselves. If a friend who always talks with their hands suddenly goes completely still, that change tells you more than any single gesture ever will. **[Point at the spike.]** That spike is the change.

> Everything on our website is built on these three rules. **[click]**

## Slide 6 — Three ways in (0:20)

Screen: three moving emblems: the Map, the Mirror, Train your eye.

> We built these three rules into a website with three rooms. **[pause]**

> **[Left.]** The Map: learn what each part of the body says, and what it feels.

> **[Middle.]** The Mirror: see your own face, and rehearse before an interview.

> **[Right.]** And Train your eye: test yourself, one question at a time.

> Rather than describe them, **[name of speaker 2]** will show you, live. **[Hand over.]** **[click]**

# Speaker 2 — The live demo (3:30)

## Slide 7 — Live demo (3:30)

On screen: a red “Live demo” badge, “Let me show you.”, and the five stops in order, each with what you will do and how long it takes, about 3:30 in all. Leave it up for a moment so the room sees the plan, then switch.

Switch to the browser, full screen, on the home page, in English. About three and a half minutes. Talk while you click; never wait in silence.

### 01 · The brain (15 s)

> This is the home page. **[Move the pointer slowly over the brain.]** The brain is made of thousands of points of light; point at any part and it tells you what that part does.

### 02 · The Map (45 s)

> **[Click The Map.]** Before you can read anyone else, you need the signals. Thirteen parts of the body, thirty-six signals and nine feelings, all stored as data. **[Click Anger.]** Here is anger, as heat in the body. **[Click the shoulders.]** And every signal comes with its context, and a label for how well the research supports it.

### 03 · The Mirror (1 min 40 s)

> **[Click The Mirror, then Turn on the mirror.]** Now look at yourself. The camera reads fifteen movements of the face, live, using the Facial Action Coding System. **[Raise your eyebrows, then smile.]** Frontalis when I raise my brows; zygomaticus when I smile. And notice what it never says: what I feel. It names muscles and real signals, like the difference between a polite smile and one that reaches the eyes.
> **[Rehearse tab, Job interview, Start. Talk for 10 to 15 seconds, then Stop early.]** Before a job interview, you talk for forty-five seconds and get a report: blinks, smiles, pressed lips. There is also Poker face, where six lines try to provoke your face.
If the camera does not start: click See an example first.
If they ask “What if I am stressed?”: stress is not the enemy. The point is muscle memory: once you see in numbers that you blink fast or press your lips under stress, you notice it, and you can control it in the real interview.
If they ask “Does it record my face?”: no. The face tracking runs inside the browser; no picture or video leaves your device. Only the numbers of the report go to the database, so you can see your progress.

### 04 · The tests (35 s)

> **[Click Train your eye, then the context test.]** Three tests, thirty questions: twelve for the eyes, ten for the body, eight for context. **[Answer one question.]** It does not just say right or wrong: it shows the cues that decided it, because a score on its own teaches you nothing.

### 05 · Kurdish (15 s)

> **[Click کوردی in the top corner.]** And every page, every test, in Kurdish Sorani, with the whole layout flipped right to left. **[Click English to switch back.]**

> **[Back to the slides, and hand over.]** That was the face of the project. Now **[name of speaker 3]** will show you what is behind it: the technology, the database, and where it goes next. **[click]**

# Speaker 3 — How it is built, and what comes next (about 3:40)

## Slide 8 — How it’s built (0:50)

Screen, on paper: a lens, a browser, a server and a database drawn in ink, a dashed line between your device and our server, and a light going out along the top line and back along the blue one.

> Now the engine: what makes it run. Two places: your device, and our server. **[pause]**

> **[Left.]** Everything on this side runs on your own device. The lens is the face tracker, MediaPipe, made by Google. It downloads once, about twelve megabytes, and then reads your camera inside the browser. What it passes on is not a picture: it is fifty-two numbers for every frame, how much each part of your face is moving. Your camera image never leaves your device.

> **[The browser.]** The website, made with React and Vite, in two languages, English and Kurdish Sorani. Kurdish is written right to left, so the whole layout flips.

> **[Right.]** Our server: the API, written in Node with Express, and the database, PostgreSQL 17.

> **[Point at the light.]** Every click goes out along the top line: the website asks with fetch, the API turns the question into SQL, the database answers with rows. And the answer comes back along the blue line, as JSON.

> We write plain SQL, with no ORM, so every query can be shown and checked in pgAdmin. **[click]**

## Slide 9 — The database (1:05)

Screen, on paper: twelve of the tables drawn as cards with their keys, each foreign key a line with a crow’s foot on its “many” side, coloured by part of the site (red the Map, blue the Mirror, gold the tests), and two notes underneath on the views and the triggers.

> And where it all lives: the database, the heart of this project. PostgreSQL 17: thirty-one tables, five views and four triggers, in plain SQL. **[pause]**

> These are twelve of them, with their keys. Each line is a foreign key; the crow’s foot is the “many” side.

> **[Left, red.]** The Map: body parts, which can sit inside each other; the signals of each part; and their words, in signal_texts, one row per language. Every table that holds words has a twin like that.

> **[Middle.]** Languages and visitors are shared. A visitor is just a random id the browser keeps: no names, no pictures.

> **[Blue.]** The Mirror: each rehearsal belongs to a visitor and a situation.

> **[Gold.]** The tests: a test has questions, a question has options. An attempt belongs to a visitor, and each answer points at its attempt, its question and its option.

> **[Point at the notes below.]** The views do the counting the site shows: scores, and how everyone else answered. And the triggers guard the data: an answer must belong to its test and its question, and the last answer finishes the attempt. **[click]**

## Slide 10 — What comes next (1:15)

Screen: a line with three stages (now, spring, then), and smart glasses drawn in gold: in the left lens a signal spikes past its own baseline; in the right lens three signals appear and join. Underneath: Never “they are lying”.

> Where does it go from here? **[pause]**

> **[Point at Now.]** Stage one is done: the website, the database and the API, in two languages.

> **[Spring.]** Next semester, in the spring, we build AI on top of this same database. Every signal, every question and every rehearsal report is already in it, ready to learn from.

> **[Point at the glasses.]** And it does not have to stay on a laptop. You may know the series Person of Interest. We mean something much more modest, and real: smart glasses as an assistant, in a job interview, a sales meeting, or a training centre.

> **[Point at the line below.]** They would never say “this person is lying”, because nothing can. They would notice what our rules notice: **[left lens]** changes from a person’s own baseline, **[right lens]** and signals that come in clusters, like signs of stress. **[click]**

## Slide 11 — Close (0:30)

Screen: an eye drawn in lines of light, like the mask on the first slide, opening; then the closing words and your names.

Slow down for the last slide. Let the eye open before you speak.

> We asked you a question at the start. Everyone in this room can see your face, except you. **[pause]**

> With Unmasked, now you can too.

> Thank you very much. **[pause]** We are happy to take your questions.

# Likely questions: who answers what

- **Speaker 1: “What is it for, and who would use it?”** Students and job seekers before interviews and presentations; HR and sales teams; training and psychology centres, through the eyes and context tests.
- **Speaker 1: “Where does the psychology come from?”** Published research: the Facial Action Coding System (Ekman, Friesen and Hager, 2002), the body maps of feelings (Nummenmaa and colleagues, 2014), and the eyes test (Baron-Cohen and colleagues, 2001). Every page lists its sources on the How page.
- **Speaker 2: “Does it read feelings?”** No, on purpose. It names the muscles that move and the cues people read; a raised eyebrow can mean many things, and a face alone is not enough to know what someone feels.
- **Speaker 2: “Why Kurdish?”** Good sources in Kurdish are rare, people should be able to learn this in their own language, and the right-to-left design and full translation made the project harder and better.
- **Speaker 2: “Is my video saved?”** No. The camera image stays in the browser. Only the numbers of a rehearsal report are kept.
- **Speaker 3: “Why not NoSQL, like MongoDB?”** Our data is deeply related: a part of the body has signals, a question has options, an answer belongs to an attempt. PostgreSQL keeps it in order with constraints and joins.
- **Speaker 3: “Why PostgreSQL and plain SQL, with no ORM?”** It is a full relational database with real constraints, views and triggers, it is free, and writing every query ourselves lets us show each one in pgAdmin.
- **Speaker 3: “Does the website really use the database?”** Yes. Every page reads its content from PostgreSQL through the API, rehearsals and answers are saved there, and an admin can add a question from the admin page (`/admin`), behind a sign-in. We can show it live.
- **Anyone: “Can it tell if I am lying?”** No, and nothing can, reliably, from the body alone. The site says so on purpose.
