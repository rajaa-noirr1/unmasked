// How to read a body: the three rules, the claims nobody can back up, and where everything comes from.
import { Link } from 'react-router'
import Silhouette from '../components/Silhouette'
import Photo from '../components/Photo'
import { scenePhoto } from '../data/photos'
import { ScrollLight } from '../components/Text'
import { SHOW_PATTERNS } from '../config'
import { useT } from '../i18n'
import { useReveal, useTitle } from '../lib/hooks'
import Headline from '../components/Headline'

const CONTEXT = [['cold', ['Cold', 'سەرما']], ['argument', ['Angry', 'تووڕە']], ['lecture', ['Concentrating', 'سەرنجدان']]]

const MYTHS = [
  {
    claim: ['93% of communication is body language.', '٩٣٪ی پەیوەندیکردن زمانی جەستەیە.'],
    truth: ['The number comes from 1960s experiments where people heard single words said in a tone that did not match them. Albert Mehrabian, who ran them, has said the figure only applies to feelings and attitudes, not to communication in general.', 'ئەم ژمارەیە لە تاقیکردنەوەکانی شەستەکانەوە هاتووە کە خەڵک تێیدا تاکە وشەیان بیستووە بە تۆنێک کە لەگەڵ ماناکەیدا نەگونجاوە. ئەلبێرت مێهرابیان، کە ئەنجامی دان، وتوویەتی ژمارەکە تەنها بۆ هەست و ڕوانینە، نەک بۆ هەموو پەیوەندیکردنێک.'],
  },
  {
    claim: ['Liars look away, or up and to the right.', 'درۆزنەکان سەیری لایەک دەکەن، یان سەرەوە و لای ڕاست.'],
    truth: ['No single behaviour reliably gives a lie away. Across hundreds of studies, people spot lies about 54% of the time: barely better than tossing a coin.', 'هیچ ڕەفتارێکی تاک بە شێوەیەکی متمانەپێکراو درۆ ئاشکرا ناکات. لە سەدان توێژینەوەدا، خەڵک نزیکەی ٥٤٪ی کات درۆ دەناسنەوە: کەمێک باشتر لە هەڵدانی دراوێک.'],
  },
  {
    claim: ['Micro-expressions reveal what someone is hiding.', 'دەربڕینە زۆر کورتەکان ئەوە ئاشکرا دەکەن کە کەسێک دەیشارێتەوە.'],
    truth: ['Very brief expressions do happen, but they are rare, and training people to spot them has not been shown to catch liars reliably.', 'دەربڕینی زۆر کورت ڕوودەدەن، بەڵام دەگمەنن، و ڕاهێنانی خەڵک بۆ ناسینەوەیان نەیسەلماندووە کە بە شێوەیەکی متمانەپێکراو درۆزن دەگرێت.'],
  },
  {
    claim: ['A power pose changes your hormones.', '"وەستانی هێز" هۆرمۆنەکانت دەگۆڕێت.'],
    truth: ['Larger studies could not repeat the hormone effects. Standing tall may make you feel slightly more confident, and that is about all.', 'توێژینەوە گەورەترەکان نەیانتوانی کاریگەرییەکەی سەر هۆرمۆن دووبارە بکەنەوە. ڕاست وەستان لەوانەیە کەمێک هەستی متمانەت پێبدات، و نزیکەی هەر ئەوەندە.'],
  },
  {
    claim: ['Every face shows the same handful of emotions.', 'هەموو دەموچاوێک هەمان چەند هەستە کەمە پیشان دەدات.'],
    truth: ['Faces vary between people, situations and cultures. People often scowl when they concentrate and smile when they are uncomfortable. Reading a face alone is guessing.', 'دەموچاو لە نێوان خەڵک، بارودۆخ و کولتووردا جیاوازە. خەڵک زۆرجار کاتی سەرنجدان ڕوو گرژ دەکەن و کاتی ناڕەحەتی زەردەخەنە دەکەن. خوێندنەوەی دەموچاو بە تەنها مەزەندەیە.'],
  },
]

const LIMITS = [
  [['It cannot diagnose anyone.', 'ناتوانێت کەس دەستنیشان بکات.'], ['Not you, not your ex. Diagnosis takes trained clinicians, time, and much more than a body.', 'نە تۆ، نە هاوسەری پێشووت. دەستنیشانکردن پێویستی بە پسپۆڕی ڕاهێنراو، کات، و زۆر زیاتر لە جەستەیەک هەیە.']],
  [['It cannot catch liars.', 'ناتوانێت درۆزن بگرێت.'], ['Nothing can, reliably, from the body alone. Anyone who says otherwise is selling something.', 'هیچ شتێک ناتوانێت، بە متمانەوە، تەنها لە جەستەوە. هەر کەسێک پێچەوانەی ئەمە بڵێت، شتێک دەفرۆشێت.']],
  [['The Mirror reports muscles, never feelings.', 'ئاوێنەکە ماسولکە ڕادەگەیەنێت، هەرگیز هەست نا.'], ['And your camera never leaves your device. Nothing is recorded or sent.', 'و کامێراکەت هەرگیز ئامێرەکەت جێناهێڵێت. هیچ شتێک تۆمار یان نانێردرێت.']],
  [['It is a place to practise noticing.', 'شوێنێکە بۆ ڕاهێنان لەسەر تێبینیکردن.'], ['The tests train your eye to look at the right things, then ask instead of assume.', 'تاقیکردنەوەکان چاوت ڕادەهێنن کە سەیری شتە ڕاستەکان بکات، پاشان بپرسێت لە جیاتی ئەوەی گریمانە بکات.']],
]

// references stay in their original language; the second column says where each is used
const SOURCES = [
  ['Nummenmaa, Glerean, Hari & Hietanen (2014). Bodily maps of emotions. PNAS 111(2).', ['The heat maps on the Map', 'نەخشە گەرمییەکانی سەر نەخشەکە']],
  ['Ekman, Friesen & Hager (2002). Facial Action Coding System.', ['The action units and muscle names in the Mirror', 'یەکەکانی جووڵە و ناوی ماسولکەکان لە ئاوێنەکەدا']],
  ['Baron-Cohen, Wheelwright, Hill, Raste & Plumb (2001). The "Reading the Mind in the Eyes" test, revised. Journal of Child Psychology and Psychiatry 42(2).', ['The format of the eyes test', 'شێوازی تاقیکردنەوەی چاوەکان']],
  ['Barrett, Adolphs, Marsella, Martinez & Pollak (2019). Emotional expressions reconsidered. Psychological Science in the Public Interest 20(1).', ['Why faces alone are not enough', 'بۆچی دەموچاو بە تەنها بەس نییە']],
  ['Bond & DePaulo (2006). Accuracy of deception judgments. Personality and Social Psychology Review 10(3).', ['The 54% lie-detection figure', 'ڕێژەی ٥٤٪ی ناسینەوەی درۆ']],
  ['Ranehill and colleagues (2015). Assessing the robustness of power posing. Psychological Science 26(5).', ['Power poses', 'وەستانی هێز']],
  ['Porter & ten Brinke (2008). Reading between the lies. Psychological Science 19(5).', ['Micro-expressions', 'دەربڕینە زۆر کورتەکان']],
  ['Mehrabian (1971). Silent Messages.', ['Where "93%" came from', 'ژمارەی "٩٣٪" لە کوێوە هات']],
  ['Darwin (1872). The Expression of the Emotions in Man and Animals.', ['The "grief muscles" in the eyes test', '"ماسولکەکانی خەفەت" لە تاقیکردنەوەی چاوەکاندا']],
  ['Tracy & Matsumoto (2008). The spontaneous expression of pride and shame. PNAS 105(33).', ['Blind athletes and the shape of winning and losing', 'وەرزشوانانی نابینا و شێوەی بردنەوە و دۆڕان']],
  ['Seligman & Maier (1967). Failure to escape traumatic shock. Journal of Experimental Psychology 74(1).', ['Learned helplessness (The Defeated)', 'بێدەسەڵاتیی فێرکراو'], 'patterns'],
  ['Brehm (1966). A Theory of Psychological Reactance.', ['Reactance (The Rebel)', 'کاردانەوەی بەرگری'], 'patterns'],
  ['Cacioppo & Patrick (2008). Loneliness: Human Nature and the Need for Social Connection.', ['The Lonely', 'تەنهایی'], 'patterns'],
  ['Gottman (1994). What Predicts Divorce?', ['Stonewalling', 'بێدەنگبوونی دیوارئاسا'], 'patterns'],
  ['Dutton & Painter (1981). Traumatic bonding. Victimology 6.', ['Trauma bonds', 'پەیوەندیی برینئاسا'], 'patterns'],
  ['Paulhus & Williams (2002). The Dark Triad of personality. Journal of Research in Personality 36(6).', ['The dark triad', 'سێگۆشەی تاریک'], 'patterns'],
  ['Mech (1999). Alpha status, dominance, and division of labor in wolf packs. Canadian Journal of Zoology 77(8).', ['"Alpha male"', '"پیاوی ئەلفا"'], 'patterns'],
  ['Cheng, Tracy, Foulsham, Kingstone & Henrich (2013). Two ways to the top. Journal of Personality and Social Psychology 104(1).', ['Dominance and prestige', 'زاڵبوون و ڕێز'], 'patterns'],
].filter((s) => SHOW_PATTERNS || s[2] !== 'patterns')

const CREDITS = [
  [['Photos in the eyes and body tests', 'وێنەکانی تاقیکردنەوەی چاو و جەستە'], ['Film and TV stills, the property of their owners, used for teaching', 'وێنەی فیلم و زنجیرە، موڵکی خاوەنەکانیانن، بۆ فێرکردن بەکارهاتوون']],
  [['Face tracking', 'شوێنکەوتنی دەموچاو'], ['MediaPipe Face Landmarker by Google, Apache 2.0', 'MediaPipe Face Landmarker لە Google، مۆڵەتی Apache 2.0']],
  [['The brain and other visual effects', 'مێشکەکە و کاریگەرییە بینراوەکانی تر'], ['Adapted from React Bits by David Haz, MIT + Commons Clause', 'وەرگیراو لە React Bits ـی David Haz، مۆڵەتی MIT + Commons Clause']],
  [['Type', 'فۆنت'], ['Newsreader, Roboto Flex and Zain, SIL Open Font License', 'Newsreader، Roboto Flex و Zain، مۆڵەتی SIL Open Font']],
]

// "their normal" wanders inside a band, then one sharp change
const BASELINE = (() => {
  const pts = []
  for (let x = 12; x <= 412; x += 8) pts.push([x, 112 + Math.sin(x * 0.09) * 11 + Math.sin(x * 0.27 + 1) * 5])
  pts.push([426, 106], [440, 72], [452, 40], [464, 62], [476, 98], [490, 112])
  for (let x = 498; x <= 588; x += 8) pts.push([x, 112 + Math.sin(x * 0.09) * 11 + Math.sin(x * 0.27 + 1) * 5])
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y.toFixed(1)}`).join(' ')
})()

export default function How() {
  const t = useT()
  useTitle(['How to read a body', 'چۆن جەستە بخوێنیتەوە'])
  const ref = useReveal()
  return (
    <div ref={ref} className="how page">
      <div className="wrap">
        <header className="page-head how-head">
          <Headline className="display page-title" text={t.lang === 'ckb' ? 'چۆن جەستە بخوێنیتەوە.' : ['How to read', 'a body.']} />
          <p className="lede">{t(['Three rules separate people who read bodies well from people who guess with confidence. Everything on this site is built on them.', 'سێ یاسا ئەو کەسانەی جەستە بە باشی دەخوێننەوە لەوانە جیا دەکاتەوە کە بە متمانەوە مەزەندە دەکەن. هەموو شتێکی ئەم ماڵپەڕە لەسەر ئەم یاسایانە بنیات نراوە.'])}</p>
        </header>

        <section className="rules" aria-label={t(['Three rules', 'سێ یاسا'])}>
          <article className="how-rule rv">
            <div className="rule-copy">
              <span className="rule-n ui">{t(['Rule 01', 'یاسای ١'])}</span>
              <h2 className="display rule-name">{t(['Context.', 'بارودۆخ.'])}</h2>
              <p className="rule-line">{t(['Read the room before the body.', 'پێش جەستە، ژوورەکە بخوێنەوە.'])}</p>
              <p className="rule-text">{t(['Crossed arms at a cold bus stop, in an argument and in a lecture hall look exactly the same. Where someone is, what just happened and what they are doing tell you more than the gesture ever will.', 'باسکی لێکئاڵاو لە وەستگەیەکی ساردی پاس، لە دەمەقاڵێیەکدا و لە هۆڵی وانەدا ڕێک وەک یەک دەردەکەون. ئەوەی کەسەکە لە کوێیە، چی تازە ڕوویداوە و چی دەکات، زیاتر لە جووڵەکە پێت دەڵێن.'])}</p>
              <Link className="link-line cursor-target" to="/train/context">{t(['Try the context test', 'تاقیکردنەوەی بارودۆخ تاقی بکەرەوە'])}</Link>
            </div>
            <div className="rule-art rule-context">
              {CONTEXT.map(([scene, word]) => (
                <figure key={scene}>
                  <Photo fill image={scenePhoto(scene)} fallback={<Silhouette pose="crossed" scene={scene} label={t([`Crossed arms. Here it means: ${word[0].toLowerCase()}`, `باسکی لێکئاڵاو. لێرەدا مانای: ${word[1]}`])} />} />
                  <figcaption className="ui">{t(word)}</figcaption>
                </figure>
              ))}
            </div>
          </article>

          <article className="how-rule rv">
            <div className="rule-copy">
              <span className="rule-n ui">{t(['Rule 02', 'یاسای ٢'])}</span>
              <h2 className="display rule-name">{t(['Clusters.', 'کۆمەڵە ئاماژە.'])}</h2>
              <p className="rule-line">{t(['One signal is noise. Three is a sentence.', 'یەک ئاماژە ژاوەژاوە. سێ ئاماژە ڕستەیەکە.'])}</p>
              <p className="rule-text">{t(['A single touch of the nose means nothing. Look for several signals pointing the same way at the same moment, and only then start to wonder what they might mean.', 'یەک دەستلێدانی لووت هیچ مانایەکی نییە. بەدوای چەند ئاماژەیەکدا بگەڕێ کە لە هەمان ساتدا بەرەو یەک ئاراستە دەچن، و تەنها ئەوکات بیر لەوە بکەرەوە کە لەوانەیە مانای چی بن.'])}</p>
              <Link className="link-line cursor-target" to="/map">{t(['See the signals, part by part', 'ئاماژەکان ببینە، بەش بە بەش'])}</Link>
            </div>
            <div className="rule-art rule-cluster">
              <ul className="cluster" role="list">
                <li className="cl-sig"><i />{t(['Gaze lowered', 'نیگای نزمکراوە'])}</li>
                <li className="cl-op" aria-hidden="true">+</li>
                <li className="cl-sig"><i />{t(['Torso turned toward the door', 'لاشە ڕووەو دەرگا وەرگەڕاوە'])}</li>
                <li className="cl-op" aria-hidden="true">+</li>
                <li className="cl-sig"><i />{t(['Answers getting shorter', 'وەڵامەکان کورتتر دەبنەوە'])}</li>
              </ul>
              <p className="cl-result"><span className="cl-eq ui">{t(['Together', 'پێکەوە'])}</span><span className="display">{t(['Maybe ready to leave this conversation.', 'لەوانەیە ئامادەی جێهێشتنی ئەم گفتوگۆیە بێت.'])}</span></p>
              <p className="cl-single ui">{t(['Any one of them alone: a stiff neck, a draught, a long day.', 'هەر یەکێکیان بە تەنها: ملێکی ڕەق، بایەکی سارد، ڕۆژێکی درێژ.'])}</p>
            </div>
          </article>

          <article className="how-rule rv">
            <div className="rule-copy">
              <span className="rule-n ui">{t(['Rule 03', 'یاسای ٣'])}</span>
              <h2 className="display rule-name">{t(['Baseline.', 'باری ئاسایی.'])}</h2>
              <p className="rule-line">{t(['Change is the signal, not the state.', 'گۆڕانکاری ئاماژەکەیە، نەک بارەکە.'])}</p>
              <p className="rule-text">{t(['Some people fidget all day; some never smile at strangers. Learn how someone usually is before you read anything into how they are now. A change from their normal is worth noticing. Their normal is not.', 'هەندێک کەس هەموو ڕۆژ ئۆقرە ناگرن؛ هەندێکیش هەرگیز زەردەخەنە بۆ نەناسیاو ناکەن. پێش ئەوەی هیچ مانایەک بدەیتە ئێستای کەسێک، فێر بە کە بە ئاسایی چۆنە. گۆڕانکاری لە باری ئاسایییدا شایەنی تێبینییە. باری ئاسایی خۆی نا.'])}</p>
              <Link className="link-line cursor-target" to="/mirror">{t(['Watch your own baseline', 'سەیری باری ئاسایی خۆت بکە'])}</Link>
            </div>
            <div className="rule-art rule-baseline">
              <svg viewBox="0 0 600 200" role="img" aria-label={t(['A line wandering inside a band labelled their normal, then jumping far outside it once: the change.', 'هێڵێک کە لە ناو پشتێنەیەکدا دەگەڕێت بە ناوی باری ئاسایی، پاشان یەکجار بە دووری لێی دەردەچێت: گۆڕانکارییەکە.'])}>
                <defs>
                  <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#5b7cf0" stopOpacity="0.02" />
                    <stop offset="0.5" stopColor="#5b7cf0" stopOpacity="0.14" />
                    <stop offset="1" stopColor="#5b7cf0" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="bl-glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <rect x="0" y="90" width="600" height="44" fill="url(#band)" />
                <line x1="0" x2="600" y1="90" y2="90" className="bl-edge" />
                <line x1="0" x2="600" y1="134" y2="134" className="bl-edge" />
                <text x="14" y="160" className="bl-label">{t(['their normal', 'باری ئاسایییان'])}</text>
                <path d={BASELINE} className="bl-line" pathLength="1" filter="url(#bl-glow)" />
                <circle cx="452" cy="40" r="5" className="bl-dot" />
                <text x="468" y="38" className="bl-label bl-change">{t(['the change', 'گۆڕانکارییەکە'])}</text>
              </svg>
            </div>
          </article>
        </section>

        <section className="how-quote">
          <ScrollLight key={t.lang} className="display how-quote-text">{t(['A body never tells you what someone thinks. It tells you where to look, and what to ask next.', 'جەستە هەرگیز پێت ناڵێت کەسێک بیر لە چی دەکاتەوە. پێت دەڵێت سەیری کوێ بکەیت، و دواتر چی بپرسیت.'])}</ScrollLight>
        </section>

        <section className="myths">
          <header className="section-head rv">
            <h2 className="display section-title small">{t(['Claims nobody can back up.', 'بانگەشەگەلێک کە کەس ناتوانێت بیانسەلمێنێت.'])}</h2>
            <p className="lede">{t(['You will hear these in videos and self-help books. This is what the research actually found.', 'ئەمانە لە ڤیدیۆ و کتێبەکانی خۆپێشخستندا دەبیستیت. ئەمە ئەوەیە کە توێژینەوەکان بەڕاستی دۆزیویانەتەوە.'])}</p>
          </header>
          <ol className="myth-list" role="list">
            {MYTHS.map((m) => (
              <li key={m.claim[0]} className="myth rv">
                <p className="display myth-claim"><s>{t(m.claim)}</s></p>
                <p className="myth-truth">{t(m.truth)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="limits">
          <h2 className="display section-title small rv">{t(['What this site is not.', 'ئەم ماڵپەڕە چی نییە.'])}</h2>
          <ul className="limit-list" role="list">
            {LIMITS.map(([head, text]) => (
              <li key={head[0]} className="rv"><b className="display">{t(head)}</b><span>{t(text)}</span></li>
            ))}
          </ul>
          <p className="limits-help rv">{t(['If something you read here touches on how you feel, talk to someone you trust, or find a free, confidential helpline at', 'ئەگەر شتێک کە لێرە دەیخوێنیتەوە دەست لە هەستەکانت دەدات، قسە لەگەڵ کەسێک بکە کە متمانەت پێیەتی، یان هێڵێکی یارمەتیی بێبەرامبەر و نهێنی بدۆزەرەوە لە'])} <a href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a>.</p>
        </section>

        <section id="sources" className="sources rv" aria-labelledby="sources-title">
          <h2 id="sources-title" className="display sources-title">{t(['Sources', 'سەرچاوەکان'])}</h2>
          <ol className="source-list" role="list">
            {SOURCES.map(([ref, used]) => <li key={ref}><span lang="en" dir="ltr">{ref}</span><span className="ui">{t(used)}</span></li>)}
          </ol>
          <h2 className="display sources-title">{t(['Credits', 'سوپاس و مۆڵەتەکان'])}</h2>
          <ul className="source-list" role="list">
            {CREDITS.map(([what, who]) => <li key={what[0]}><span>{t(what)}</span><span className="ui">{t(who)}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
