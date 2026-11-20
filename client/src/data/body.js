// The Map: what each part of the body says (signals other people read), what it feels
// (what happens inside it), and how context changes the reading.
// strength: how well the research supports it. solid = many studies agree, mixed = real but contested,
// weak = popular claim with little behind it (we include some on purpose, to say so).
// Front end only for now: this file is shaped like the future database tables (regions → signals).

export const STRENGTH = {
  solid: 'Well supported',
  mixed: 'Real, but contested',
  weak: 'Popular, weakly supported',
}

export const REGION_INFO = {
  head: {
    name: 'Head and face',
    line: 'Forty-odd muscles, and the part of the body people watch first.',
    parts: ['brows', 'eyes', 'mouth', 'skin'],
    says: [
      { tell: 'Head tilted to one side', means: 'Listening, interest, softening a question.', context: 'With a frown and narrowed eyes it reads as doubt instead.', strength: 'mixed' },
      { tell: 'Chin lifted, head back', means: 'Pride or triumph. People born blind show it after winning too.', context: 'Held while looking down the nose, it reads as contempt.', strength: 'solid' },
      { tell: 'Head bowed', means: 'Shame, sadness, deference, or simply reading.', context: 'Before an elder or a boss in many cultures, it is respect.', strength: 'solid' },
    ],
    feels: 'Anger, fear and joy all register strongly in the head in body-mapping studies: heat, pressure, a rush.',
  },
  brows: {
    name: 'Brows',
    line: 'The most expressive few centimetres on the body.',
    says: [
      { tell: 'Inner ends lifted and drawn together', means: 'Worry, grief, pleading. Few people can do it on purpose.', context: 'Fleeting, while listening to bad news: empathy rather than personal sadness.', strength: 'solid' },
      { tell: 'Pulled down and together', means: 'Concentration, confusion, bright light, or anger.', context: 'Alone it is one of the most misread signals. Look at the task in front of them.', strength: 'solid' },
      { tell: 'A quick lift on meeting someone', means: 'The "eyebrow flash": recognition and greeting, seen across many cultures.', context: 'Held up and still, it becomes surprise or disbelief.', strength: 'mixed' },
    ],
    feels: 'The frowning muscle tenses slightly in bad moods even when nothing shows; sensors on the skin pick it up.',
  },
  eyes: {
    name: 'Eyes',
    line: 'Where most readings start, and many go wrong.',
    says: [
      { tell: 'Pupils widening', means: 'Interest, mental effort, arousal. Nobody controls it.', context: 'Light changes pupils far more than feelings do; a dark room widens everyone.', strength: 'solid' },
      { tell: 'Crinkled outer corners', means: 'Often comes with a felt smile.', context: 'Many people can produce it on purpose, so it is a hint, not proof.', strength: 'mixed' },
      { tell: 'Looking away while answering', means: 'Usually thinking: it frees the brain from processing a face.', context: 'It does not mean lying. Liars, on average, hold eye contact as much as anyone.', strength: 'solid' },
      { tell: 'Eyes up and to the right means a lie', means: 'Tested directly and found to mean nothing.', context: 'A famous body-language myth. Included so you can stop believing it.', strength: 'weak' },
    ],
    feels: 'Fear widens the eyes and lets in more light; disgust narrows them and shuts it out.',
  },
  mouth: {
    name: 'Mouth',
    line: 'The easiest part to control, so the first one people manage.',
    says: [
      { tell: 'Lips pressed thin', means: 'Holding something back: words, anger, effort, tears.', context: 'During hard concentration it means nothing emotional at all.', strength: 'mixed' },
      { tell: 'A smile that arrives and leaves fast', means: 'Social politeness. It is a greeting, not a lie.', context: 'Held too long after the moment passes, people start to read it as strained.', strength: 'mixed' },
      { tell: 'Biting or licking the lips', means: 'Nerves (stress dries the mouth), or concentration.', context: 'Also just dry air or chapped lips. Check the baseline.', strength: 'mixed' },
    ],
    feels: 'Stress cuts saliva: a dry mouth before a talk is the body getting ready to act, not to eat.',
  },
  skin: {
    name: 'Skin and colour',
    line: 'Signals you cannot fake and cannot hide.',
    says: [
      { tell: 'Blushing', means: 'Embarrassment, being looked at, being caught out.', context: 'Others usually forgive faster when you blush; it works like an apology.', strength: 'solid' },
      { tell: 'Going pale', means: 'Fear or shock: blood leaves the skin for the muscles.', context: 'Also cold, illness or low blood sugar.', strength: 'solid' },
    ],
    feels: 'Darwin called blushing "the most peculiar and the most human of all expressions".',
  },
  throat: {
    name: 'Throat and neck',
    line: 'A vulnerable place, and the body knows it.',
    says: [
      { tell: 'A hand to the neck', means: 'Self-soothing under stress or uncertainty.', context: 'Also an itch, a necklace, a habit. One touch means little; a pattern means more.', strength: 'mixed' },
      { tell: 'Voice rising in pitch', means: 'Tension tightens the vocal cords.', context: 'Excitement does the same thing as nerves.', strength: 'solid' },
    ],
    feels: 'The "lump in the throat" in sadness and anxiety is real muscle tension around the throat.',
  },
  shoulders: {
    name: 'Shoulders',
    line: 'They rise with the world and fall with the self.',
    says: [
      { tell: 'Raised and held', means: 'Cold, fear, bracing, wanting to be smaller.', context: 'A quick lift and drop is a shrug: "I don\'t know" or "I don\'t care".', strength: 'solid' },
      { tell: 'Dropped and rolled forward', means: 'Sadness, shame, tiredness, defeat.', context: 'Also long hours at a laptop. Watch for a change from how they usually sit.', strength: 'mixed' },
      { tell: 'Pulled back, chest open', means: 'Pride, readiness, confidence.', context: 'Exaggerated and held, it can be a show for others.', strength: 'solid' },
    ],
    feels: 'Stress parks itself here: the trapezius muscles tighten and stay tight.',
  },
  chest: {
    name: 'Chest',
    line: 'Where most strong feelings are felt first.',
    says: [
      { tell: 'Open, expanded chest', means: 'Pride, triumph, confidence.', context: '"Power poses" do not reliably change hormones; the display is real, the life hack is not.', strength: 'mixed' },
      { tell: 'Arms or objects held across it', means: 'Protection, comfort, cold, or just a resting place for the arms.', context: 'A bag or folder held in front during a talk is often nerves.', strength: 'mixed' },
      { tell: 'Fast, high breathing', means: 'Arousal: fear, anger, excitement, effort.', context: 'Slow breathing from the belly is the clearest sign of calm.', strength: 'solid' },
    ],
    feels: 'In body maps, the chest lights up in anger, fear, pride, love and anxiety. A tight chest is the classic sign of anxiety.',
  },
  arms: {
    name: 'Arms',
    line: 'The body\'s shield, and its loudest flag.',
    says: [
      { tell: 'Crossed arms', means: 'Cold, concentrating, comfortable, self-soothing, or closing off.', context: 'In one study, people with crossed arms kept working on hard puzzles longer. Context decides.', strength: 'solid' },
      { tell: 'Thrown up in a V', means: 'Triumph. Athletes born blind do it too, so it is not learned by watching.', context: 'Arms up with palms out is surrender instead.', strength: 'solid' },
      { tell: 'Wrapped around yourself', means: 'Self-comfort: a hug you give yourself.', context: 'In a cold room it is just keeping warm.', strength: 'mixed' },
    ],
    feels: 'Anger floods the arms in body maps: the body getting ready to push.',
  },
  hands: {
    name: 'Hands',
    line: 'Busy when the mind is busy.',
    says: [
      { tell: 'Touching the face, neck or hair', means: 'Self-soothing. It rises with any kind of stress.', context: 'Not a sign of lying: honest people under pressure touch their faces too.', strength: 'mixed' },
      { tell: 'Palms up', means: 'Openness, asking, "I don\'t know".', context: 'With a shrug and raised brows, it is one of the most widely understood gestures.', strength: 'solid' },
      { tell: 'Hidden hands', means: 'Cold, habit, comfort, or nerves.', context: 'The claim that hidden hands mean "hiding something" has almost nothing behind it.', strength: 'weak' },
      { tell: 'Fidgeting', means: 'Restlessness, nerves, boredom, or a lot of energy.', context: 'Some people always fidget. A change from their usual is what matters.', strength: 'mixed' },
    ],
    feels: 'Fear makes hands cold (blood moves to the core) and palms sweaty; skin sweat is how lie detectors measure arousal, not lies.',
  },
  stomach: {
    name: 'Stomach',
    line: 'The gut reacts before the thought arrives.',
    says: [
      { tell: 'Arms or a bag held over the belly', means: 'Protecting a soft place: discomfort, unease.', context: 'Also hunger, cramps, or carrying something.', strength: 'weak' },
    ],
    feels: '"Butterflies" are blood leaving the gut under stress. Disgust and anxiety are felt here most strongly in body maps; nausea is disgust\'s oldest job.',
  },
  legs: {
    name: 'Legs',
    line: 'Furthest from the face, so the least managed.',
    says: [
      { tell: 'A bouncing leg', means: 'Restlessness, nerves, energy, impatience, habit.', context: 'Baseline matters: some people bounce all day.', strength: 'mixed' },
      { tell: 'A wide, planted stance', means: 'Stability, readiness, taking up space.', context: 'With fists and a forward lean, it is a threat display.', strength: 'mixed' },
      { tell: 'Legs crossed while standing', means: 'Comfort: you cannot run like that.', context: 'Also a full bladder.', strength: 'weak' },
    ],
    feels: 'Fear readies the legs to run, or freezes them. Sadness and depression make limbs feel heavy and drained.',
  },
  feet: {
    name: 'Feet',
    line: 'They often point where we want to go.',
    says: [
      { tell: 'Feet turned toward the door', means: 'Possibly wanting to leave, while the face stays polite.', context: 'A hint, not proof. Feet also point where there is room to stand.', strength: 'weak' },
      { tell: 'Showing the soles of the shoes', means: 'Relaxed in some countries, insulting in much of the Middle East and Asia.', context: 'Same posture, opposite meaning: culture is context too.', strength: 'solid' },
    ],
    feels: 'Feet get cold first when you are afraid: blood moves to where it might be needed.',
  },
}

// Where people feel each emotion (after Nummenmaa et al., 2014, "Bodily maps of emotions", PNAS).
// −3 = much less activity than usual, +3 = much more. Simplified from the published maps.
export const BODY_MAPS = [
  { id: 'anger', name: 'Anger', heat: { head: 3, throat: 1, shoulders: 2, chest: 3, arms: 3, hands: 3, stomach: 1, legs: 0, feet: 0 }, note: 'Upper body ready to act: head, chest, arms and fists.' },
  { id: 'fear', name: 'Fear', heat: { head: 2, throat: 1, chest: 3, stomach: 2, arms: 1, hands: 1, legs: 1, feet: -1 }, note: 'A pounding chest and a churning stomach.' },
  { id: 'disgust', name: 'Disgust', heat: { head: 2, throat: 2, stomach: 3, hands: 1, chest: 1 }, note: 'The throat and gut: the body getting ready to reject something.' },
  { id: 'joy', name: 'Joy', heat: { head: 3, throat: 2, shoulders: 2, chest: 3, arms: 2, hands: 2, stomach: 2, legs: 2, feet: 1 }, note: 'The only feeling people report almost everywhere at once.' },
  { id: 'sadness', name: 'Sadness', heat: { head: 1, throat: 1, chest: 2, shoulders: -1, arms: -2, hands: -2, stomach: -1, legs: -3, feet: -3 }, note: 'A heavy chest, and arms and legs that go quiet.' },
  { id: 'anxiety', name: 'Anxiety', heat: { head: 2, throat: 1, chest: 3, stomach: 2, hands: 1, legs: 0 }, note: 'A tight chest and an uneasy stomach.' },
  { id: 'love', name: 'Love', heat: { head: 3, throat: 1, chest: 3, stomach: 2, arms: 2, hands: 2, legs: 1 }, note: 'Warmth across the head, chest and belly.' },
  { id: 'shame', name: 'Shame', heat: { head: 3, chest: 1, arms: -1, hands: -1, legs: -1, feet: -1 }, note: 'A burning face, and limbs that want to disappear.' },
  { id: 'pride', name: 'Pride', heat: { head: 3, shoulders: 2, chest: 3, arms: 2, hands: 1 }, note: 'Head and chest: the body standing taller.' },
]
