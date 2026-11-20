# Photos for the tests

Put the photos in these three folders, named exactly as below (lower case). JPG is best; PNG and WebP work too. Aim for at least 1200 px wide. Every photo in every test comes from these folders, and the same files also appear on the Train page, the home page and the How page.

```
client/public/images/eyes/      12 photos for the eyes test
client/public/images/body/      10 photos for the body test
client/public/images/context/    8 photos for the context test
```

Until a photo is there, the eyes and body tests show a dashed box with the name they are waiting for; the context test keeps its drawn silhouettes. Once they are in, tell me and I will:

- line up the eye strip on each eyes photo,
- hide the face in each body photo until the answer is chosen,
- add who is in each photo (or type it yourself in `client/src/data/photos.js`, the `who` field).

The suggestions below are characters who often show that state in the show. Pick whichever frame shows it most clearly; the frame matters more than the character.

## Eyes test (`images/eyes/`)

A close-up where the whole face is sharp, lit, and looking roughly toward the camera. Colour, no filters. The test shows only a thin strip of the eyes first, then widens to the whole frame after the answer, so the eyes have to carry the feeling on their own.

| File | Feeling | What the eyes must show | Who might fit |
|---|---|---|---|
| `suspicious.jpg` | Suspicious | Lower lids tightened, eyes narrowed from below, gaze fixed on someone | Jack Crawford, Will Graham |
| `contemptuous.jpg` | Contemptuous | Head tipped back, looking down the nose, lids half lowered, unimpressed | Hannibal Lecter |
| `afraid.jpg` | Afraid | White showing above the iris, brows raised and pulled together | Abigail Hobbs, Frederick Chilton |
| `grieving.jpg` | Grieving | Inner ends of the brows raised, lids heavy, gaze low or unfocused, maybe wet eyes | Jack Crawford, Will Graham |
| `amused.jpg` | Amused | Crinkles at the outer corners, cheeks pushing the lower lids up, brows relaxed | Hannibal Lecter, Beverly Katz |
| `distressed.jpg` | Distressed | Eyes wide but not focused, inner brows raised and drawn together | Will Graham |
| `furious.jpg` | Furious | Brows pulled hard down and together over wide, glaring eyes | Jack Crawford |
| `ashamed.jpg` | Ashamed | Gaze dropped down and away, lids lowered, head bowed | Will Graham, Abigail Hobbs |
| `worried.jpg` | Worried | Inner brows lifted and slightly together, eyes steady and focused | Alana Bloom |
| `curious.jpg` | Curious | Eyes slightly widened and locked on something, brows a little raised, head tilted | Freddie Lounds, Hannibal Lecter |
| `smug.jpg` | Smug | Upper lids half lowered, head tilted back a little, holding the gaze | Frederick Chilton |
| `affectionate.jpg` | Affectionate | Soft, slightly lowered lids, a faint lift under the eyes, gaze resting on someone | Will Graham with his dogs, Jack with Bella |

## Body test (`images/body/`)

Full body, or at least from the knees up. Best when the face is small, turned away or in shadow (the show has lots of those). If the face is clear, that is fine: I will blur it until the answer is chosen.

| File | What the body must show | Who might fit |
|---|---|---|
| `confident.jpg` | Upright but loose, shoulders back and down, chin level, hands still | Hannibal Lecter |
| `defensive.jpg` | Arms folded high and tight, torso turned away from someone | Will Graham, Jack Crawford |
| `defeated.jpg` | Collapsed forward: shoulders rolled in, head hanging, arms limp | Will Graham |
| `anxious.jpg` | A hand at the neck, face or other arm, shoulders raised | Will Graham |
| `dominant.jpg` | Wide stance, hands on hips or on a desk, standing over someone | Jack Crawford |
| `threatening.jpg` | Very close to someone else, squared up, still | Jack Crawford, Mason Verger |
| `withdrawn.jpg` | Small, arms around itself, turned away from others | Abigail Hobbs |
| `controlled.jpg` | Very upright and still, hands clasped behind or in front | Hannibal Lecter |
| `head-in-hands.jpg` | Head in both hands. Best if the reason only becomes clear from the whole scene | Anyone |
| `steeple.jpg` | Seated, fingertips pressed together | Hannibal Lecter, Bedelia Du Maurier |

## Context test (`images/context/`)

The lesson of this test is that **the posture stays the same while the scene changes the meaning**. So pick photos where the posture in 1–3 looks as alike as possible (crossed arms), the same for 4–5 (hands on the head) and 6–7 (a raised fist). The whole scene should be visible, not just the person. These scenes are not in Hannibal: free photo sites like Unsplash and Pexels allow free use (put the photographer in the `credit` field in `client/src/data/photos.js`).

| File | What the photo must show | Right answer |
|---|---|---|
| `cold.jpg` | Arms crossed tightly against the cold: outdoors in winter, snow or icy rain, a bus stop or street, coat on, shoulders hunched, alone | Keeping warm |
| `argument.jpg` | The same crossed arms, face to face with another person in an argument; the other person visible, the mood tense | Closed off |
| `lecture.jpg` | Crossed arms while seated in a lecture hall or audience, facing a speaker, calm and attentive | Concentrating |
| `stadium.jpg` | Both hands on top of the head in a stadium crowd, the moment after a near miss | Their team just missed |
| `desk.jpg` | Both hands on the head, alone at a desk late at night, papers or a laptop, one lamp | Overwhelmed |
| `protest.jpg` | A fist raised and held still in a march, with other people around doing the same | Solidarity |
| `win.jpg` | A fist raised right after winning: a goal, a match point, people cheering | Celebrating a win |
| `hand-on-heart.jpg` | A right hand on the heart with a slight bow, greeting an older person; ideally a Kurdish or Middle-Eastern setting | Respect |

## Where each photo appears

- **Eyes:** the eyes test, "Read this first" on the home page (`suspicious`), and the eyes chamber on the Train page (`afraid`).
- **Body:** the body test, and the body chamber on the Train page (`confident`, `defeated`).
- **Context:** the context test, the context chamber on the Train page (`cold`, `argument`, `lecture`), the Train room on the home page (`cold`, `argument`, `lecture`, `win`), and the first rule on the How page (`cold`, `argument`, `lecture`).

## About the stills

TV stills belong to the studio. They are fine for a university presentation. If the site is ever published openly, swap them for licensed or your own photos. The credit line shown under each answer is in `client/src/data/photos.js` (`STILLS`).
