# Photos for the tests: all 30, one by one

Replace them in any order. Tick each one when it is in place. The site picks a photo up as soon as the file is in the right folder with the right name.

## Where they go

All three folders are inside `C:\Users\CTC\OneDrive\Desktop\Why\client\public\images`:

```
images/
  eyes/      photos 1 to 12
  body/      photos 13 to 22
  context/   photos 23 to 30
```

## The rules

1. **Name the file exactly as listed**, in lower case (for example `suspicious.jpg`). If a file with that name is already there, replace it.
2. **JPG is best**; `.jpeg`, `.png` and `.webp` also work. At least **1200 px wide**. Colour, no filters: the site adds its own look.
3. **Check it on the site.** Until a photo is in place, the eyes and body tests show a dashed box with the file name they are waiting for, and the context test shows a drawn silhouette. Open the test and the photo should be there.
4. **Then tell me which ones are in.** I will line up the strip of eyes on each eyes photo, set the blur that hides each body photo's face, write who is in each photo, and update the database to match.
5. **Online version:** after a batch, commit and run `npm run deploy:pages` (or ask me).

**About the photos themselves:** the website is now public on GitHub Pages. TV stills are fine for a class, but your own photos or free ones (Unsplash, Pexels) are safer for a public site. Each photo has a credit line if you want to name the photographer.

## The eyes test: photos 1 to 12 (`images/eyes/`)

A close-up where the whole face is sharp, lit and looking roughly toward the camera. Colour, no filters. The test shows only a thin strip of the eyes first, then widens to the whole photo after the answer, so the eyes must carry the feeling on their own.

### 01 · Suspicious

- [x] **File:** `suspicious.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Suspicious. **Must not look like:** Curious, Irritated, Tired.
- **It must show:** Lower lids tightened, eyes narrowed from below, gaze fixed on someone
- **Who might fit:** Jack Crawford, Will Graham

### 02 · Contemptuous

- [x] **File:** `contemptuous.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Contemptuous. **Must not look like:** Amused, Proud, Bored.
- **It must show:** Head tipped back, looking down the nose, lids half lowered, unimpressed
- **Who might fit:** Hannibal Lecter

### 03 · Afraid

- [x] **File:** `afraid.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Afraid. **Must not look like:** Surprised, Alert, Angry.
- **It must show:** White showing above the iris, brows raised and pulled together
- **Who might fit:** Abigail Hobbs, Frederick Chilton

### 04 · Grieving

- [x] **File:** `grieving.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Grieving. **Must not look like:** Exhausted, Thoughtful, Guilty.
- **It must show:** Inner ends of the brows raised, lids heavy, gaze low or unfocused, maybe wet eyes
- **Who might fit:** Jack Crawford, Will Graham

### 05 · Amused

- [x] **File:** `amused.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Amused. **Must not look like:** Flirtatious, Smug, Friendly.
- **It must show:** Crinkles at the outer corners, cheeks pushing the lower lids up, brows relaxed
- **Who might fit:** Hannibal Lecter, Beverly Katz

### 06 · Distressed

- [x] **File:** `distressed.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Distressed. **Must not look like:** Confused, Exhausted, Sad.
- **It must show:** Eyes wide but not focused, inner brows raised and drawn together
- **Who might fit:** Will Graham

### 07 · Furious

- [x] **File:** `furious.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Furious. **Must not look like:** Determined, Disgusted, Suspicious.
- **It must show:** Brows pulled hard down and together over wide, glaring eyes
- **Who might fit:** Jack Crawford

### 08 · Ashamed

- [x] **File:** `ashamed.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Ashamed. **Must not look like:** Sad, Thoughtful, Shy.
- **It must show:** Gaze dropped down and away, lids lowered, head bowed
- **Who might fit:** Will Graham, Abigail Hobbs

### 09 · Worried

- [x] **File:** `worried.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Worried. **Must not look like:** Afraid, Thoughtful, Sad.
- **It must show:** Inner brows lifted and slightly together, eyes steady and focused
- **Who might fit:** Alana Bloom

### 10 · Curious

- [x] **File:** `curious.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Curious. **Must not look like:** Surprised, Suspicious, Flirtatious.
- **It must show:** Eyes slightly widened and locked on something, brows a little raised, head tilted
- **Who might fit:** Freddie Lounds, Hannibal Lecter

### 11 · Smug

- [x] **File:** `smug.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Smug. **Must not look like:** Amused, Content, Confident.
- **It must show:** Upper lids half lowered, head tilted back a little, holding the gaze
- **Who might fit:** Frederick Chilton

### 12 · Affectionate

- [x] **File:** `affectionate.jpg` in `client/public/images/eyes/` (done)
- **The question:** What are these eyes showing?
- **Right answer:** Affectionate. **Must not look like:** Sad, Grateful, Tired.
- **It must show:** Soft, slightly lowered lids, a faint lift under the eyes, gaze resting on someone
- **Who might fit:** Will Graham with his dogs, Jack with Bella

## The body test: photos 13 to 22 (`images/body/`)

Full body, or at least from the knees up. Best when the face is small, turned away or in shadow. A clear face is fine too: it is blurred until the answer is chosen.

### 13 · Confident

- [ ] **File:** `confident.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Confident. **Must not look like:** Arrogant, Relaxed, Defensive.
- **It must show:** Upright but loose, shoulders back and down, chin level, hands still
- **Who might fit:** Hannibal Lecter

### 14 · Defensive

- [ ] **File:** `defensive.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Defensive. **Must not look like:** Cold, Bored, Thinking.
- **It must show:** Arms folded high and tight, torso turned away from someone
- **Who might fit:** Will Graham, Jack Crawford

### 15 · Defeated

- [ ] **File:** `defeated.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Defeated. **Must not look like:** Tired, Thinking, Relaxed.
- **It must show:** Collapsed forward: shoulders rolled in, head hanging, arms limp
- **Who might fit:** Will Graham

### 16 · Anxious

- [ ] **File:** `anxious.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Anxious. **Must not look like:** Thoughtful, Cold, Bored.
- **It must show:** A hand at the neck, face or other arm, shoulders raised
- **Who might fit:** Will Graham

### 17 · Dominant

- [ ] **File:** `dominant.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Dominant. **Must not look like:** Angry, Confident, Impatient.
- **It must show:** Wide stance, hands on hips or on a desk, standing over someone
- **Who might fit:** Jack Crawford

### 18 · Threatening

- [ ] **File:** `threatening.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Threatening. **Must not look like:** Angry, Intimate, Curious.
- **It must show:** Very close to someone else, squared up, still
- **Who might fit:** Jack Crawford, Mason Verger

### 19 · Withdrawn

- [ ] **File:** `withdrawn.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Withdrawn. **Must not look like:** Cold, Shy, Sad.
- **It must show:** Small, arms around itself, turned away from others
- **Who might fit:** Abigail Hobbs

### 20 · Controlled

- [ ] **File:** `controlled.jpg` in `client/public/images/body/`
- **The question:** What is this body saying?
- **Right answer:** Controlled. **Must not look like:** Calm, Bored, Respectful.
- **It must show:** Very upright and still, hands clasped behind or in front
- **Who might fit:** Hannibal Lecter

### 21 · Head in hands (not enough to tell)

- [ ] **File:** `head-in-hands.jpg` in `client/public/images/body/`
- **The question:** What is this person feeling?
- **Right answer:** Not enough to tell. **Must not look like:** Despair, Exhaustion, Relief.
- **It must show:** Head in both hands. Best if the reason only becomes clear from the whole scene
- **Who might fit:** Anyone

### 22 · Steeple (not enough to tell)

- [ ] **File:** `steeple.jpg` in `client/public/images/body/`
- **The question:** What does this gesture tell you?
- **Right answer:** Not enough to tell. **Must not look like:** Confident, Calculating, Listening.
- **It must show:** Seated, fingertips pressed together
- **Who might fit:** Hannibal Lecter, Bedelia Du Maurier

## The context test: photos 23 to 30 (`images/context/`)

The whole scene must be visible, not just the person: the scene is the answer. Keep the posture the same within each group: photos 23 to 25 (crossed arms), 26 and 27 (hands on the head), 28 and 29 (a raised fist).

### 23 · Keeping warm

- [ ] **File:** `cold.jpg` in `client/public/images/context/`
- **The question:** Why are their arms crossed? (Where: A bus stop in the snow.)
- **Right answer:** Keeping warm. **Must not look like:** Closed off, Concentrating, Bored.
- **It must show:** Arms crossed tightly against the cold: outdoors in winter, snow or icy rain, a bus stop or street, coat on, shoulders hunched, alone
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit

### 24 · Closed off

- [ ] **File:** `argument.jpg` in `client/public/images/context/`
- **The question:** Why are their arms crossed? (Where: Mid-argument, face to face.)
- **Right answer:** Closed off. **Must not look like:** Keeping warm, Concentrating, Bored.
- **It must show:** The same crossed arms, face to face with another person in an argument; the other person visible, the mood tense
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit

### 25 · Concentrating

- [ ] **File:** `lecture.jpg` in `client/public/images/context/`
- **The question:** Why are their arms crossed? (Where: Third row of a lecture.)
- **Right answer:** Concentrating. **Must not look like:** Closed off, Keeping warm, Bored.
- **It must show:** Crossed arms while seated in a lecture hall or audience, facing a speaker, calm and attentive
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit

### 26 · Their team just missed

- [ ] **File:** `stadium.jpg` in `client/public/images/context/`
- **The question:** What just happened? (Where: A stadium, last minute of the match.)
- **Right answer:** Their team just missed. **Must not look like:** They heard terrible news, They have a headache, They are relaxing.
- **It must show:** Both hands on top of the head in a stadium crowd, the moment after a near miss
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit

### 27 · Overwhelmed

- [ ] **File:** `desk.jpg` in `client/public/images/context/`
- **The question:** What is this person feeling? (Where: Late at night, at a desk.)
- **Right answer:** Overwhelmed. **Must not look like:** Their team just missed, Relaxed, Triumphant.
- **It must show:** Both hands on the head, alone at a desk late at night, papers or a laptop, one lamp
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit

### 28 · Solidarity

- [ ] **File:** `protest.jpg` in `client/public/images/context/`
- **The question:** What does the raised fist mean here? (Where: A march, among others doing the same.)
- **Right answer:** Solidarity. **Must not look like:** Celebrating a win, A threat, Asking a question.
- **It must show:** A fist raised and held still in a march, with other people around doing the same
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit

### 29 · Celebrating a win

- [ ] **File:** `win.jpg` in `client/public/images/context/`
- **The question:** What does the raised fist mean here? (Where: The moment after winning.)
- **Right answer:** Celebrating a win. **Must not look like:** Solidarity, A threat, Asking a question.
- **It must show:** A fist raised right after winning: a goal, a match point, people cheering
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit

### 30 · Respect

- [ ] **File:** `hand-on-heart.jpg` in `client/public/images/context/`
- **The question:** What does the hand on the heart mean here? (Where: Greeting an older relative in Erbil.)
- **Right answer:** Respect. **Must not look like:** Chest pain, Swearing an oath, Refusing to talk.
- **It must show:** A right hand on the heart with a slight bow, greeting an older person; ideally a Kurdish or Middle-Eastern setting
- **Where to find it:** Free photo sites (Unsplash, Pexels): write the photographer in the credit
