// Rehearse: talk to the camera for 45 seconds, as if to a real person, and see what your face gave
// away: the cues someone across the table could read. Cues, not verdicts, and never feelings.
// Shaped like future tables: scenarios, metrics, and (in the browser for now) attempts.

export const SECONDS = 45

// blinks a minute during conversation (Bentivoglio and colleagues, 1997: about 26 talking, 17 at rest)
export const BLINKS_TALKING = 26

export const SCENARIOS = [
  { id: 'job', name: ['Job interview', 'چاوپێکەوتنی کار'], prompt: ['Tell me about yourself, and why you want this job.', 'باسی خۆتم بۆ بکە، و بۆچی ئەم کارەت دەوێت.'] },
  { id: 'class', name: ['Class presentation', 'پێشکەشکردن لە پۆلدا'], prompt: ['Explain something you learned recently that surprised you, as if to a full class.', 'شتێک ڕوون بکەرەوە کە بەم دواییانە فێری بوویت و سەری سوڕماندیت، وەک ئەوەی بۆ پۆلێکی پڕ بیڵێیت.'] },
  { id: 'meet', name: ['Meeting new people', 'ناسینی خەڵکی نوێ'], prompt: ['Introduce yourself to a group you have never met.', 'خۆت بە گرووپێک بناسێنە کە هەرگیز نەتبینیون.'] },
  { id: 'no', name: ['Saying no', 'وتنی نا'], prompt: ['A friend asks to copy your homework. Say no, kindly but clearly.', 'هاوڕێیەک داوا دەکات ئەرکەکەت بگوازێتەوە. بە نەرمی بەڵام بە ڕوونی بڵێ نا.'] },
  { id: 'opinion', name: ['Defending an opinion', 'بەرگریکردن لە بیروڕایەک'], prompt: ['Argue that your city is the best place to grow up.', 'بەڵگە بهێنەرەوە کە شارەکەت باشترین شوێنە بۆ گەورەبوون.'] },
]

// what each measure is, and what someone watching tends to read into it (with how well that is supported)
export const METRICS = {
  blinks: {
    title: ['Blinks', 'چاوترووکاندن'], strength: 'mixed',
    read: ['In conversation people blink about 26 times a minute. Far more can come with stress or effort, far fewer with intense focus. A weak cue on its own.', 'لە کاتی گفتوگۆدا خەڵک نزیکەی ٢٦ جار لە خولەکێکدا چاو دەترووکێنن. زۆر زیاتر دەکرێت لەگەڵ فشار یان هەوڵدا بێت، زۆر کەمتریش لەگەڵ سەرنجی توند. بە تەنها ئاماژەیەکی لاوازە.'],
  },
  smiles: {
    title: ['Smiles', 'زەردەخەنە'], strength: 'mixed',
    read: ['Smiles that reach the eyes tend to read as warm; mouth-only smiles as polite. Both are normal. Many quick polite smiles under pressure can read as nervous.', 'ئەو زەردەخەنانەی دەگەنە چاوەکان زۆرجار وەک گەرم دەخوێنرێنەوە؛ ئەوانەی تەنها دەمن وەک ڕێزگرتن. هەردووکیان ئاساین. زۆر زەردەخەنەی خێرای ڕێزگرتن لە ژێر فشاردا دەکرێت وەک دڵەڕاوکێ بخوێنرێتەوە.'],
  },
  presses: {
    title: ['Lips pressed together', 'پەستانی لێوەکان'], strength: 'mixed',
    read: ['Pressed lips often read as holding something back: words, effort, tension. Notice whether they come just before the hard parts.', 'لێوی پەستێنراو زۆرجار وەک ڕاگرتنی شتێک دەخوێنرێتەوە: قسە، هەوڵ، گرژی. سەرنج بدە ئایا ڕاست پێش بەشە سەختەکان دێن.'],
  },
  brows: {
    title: ['Brows', 'برۆکان'], strength: 'mixed',
    read: ['Raised brows add emphasis and look engaged; lowered brows read as concentration, or as doubt. Brows that never move can read as flat.', 'برۆی بەرزکراوە جەخت زیاد دەکات و وەک بەشداریکردن دەردەکەوێت؛ برۆی داگیراو وەک سەرنجدان، یان گومان دەخوێنرێتەوە. برۆیەک کە هەرگیز ناجووڵێت دەکرێت وەک بێهەست بخوێنرێتەوە.'],
  },
  still: {
    title: ['A still face', 'دەموچاوی بێجووڵە'], strength: 'weak',
    read: ['A face that rarely moves reads as calm and in control, or as hard to read. Most people move something every few seconds while they talk.', 'دەموچاوێک کە کەم دەجووڵێت وەک ئارام و خۆگر دەخوێنرێتەوە، یان وەک سەخت بۆ خوێندنەوە. زۆربەی خەڵک لە کاتی قسەکردندا هەر چەند چرکەیەک شتێک دەجووڵێنن.'],
  },
  tilt: {
    title: ['Head tilted', 'سەری لارکراوە'], strength: 'mixed',
    read: ['A tilted head tends to read as listening and friendly; a level head as neutral or serious.', 'سەری لار زۆرجار وەک گوێگرتن و دۆستانە دەخوێنرێتەوە؛ سەری ڕاست وەک بێلایەن یان جددی.'],
  },
}

// A worked example, shown to people without a camera so they can see what a report looks like.
export const EXAMPLE = (() => {
  const timeline = []
  for (let i = 0; i < 150; i++) {
    const tt = i / 150
    const smile = Math.max(0, Math.sin(tt * 19) * 0.7 - 0.2) * (tt > 0.15 && tt < 0.85 ? 1 : 0.4)
    const brow = Math.max(0, Math.sin(tt * 31 + 1) * 0.6 - 0.15)
    const press = (i > 22 && i < 28) || (i > 64 && i < 69) || (i > 101 && i < 105) || (i > 131 && i < 136) ? 1 : 0
    const blink = i % 11 === 3 || i % 17 === 9 ? 1 : 0
    timeline.push([smile, brow, press, blink])
  }
  return { faceShare: 100, blinksPerMin: 31, smiles: 4, smilesEyes: 1, presses: 4, browUp: 22, browDown: 9, still: 48, tilt: 12, timeline }
})()
