import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Brain from '../components/Brain'
import ParticleBody from '../components/ParticleBody'
import PhotoPlate from '../components/PhotoPlate'
import Headline from '../components/Headline'
import Silhouette from '../components/Silhouette'
import Photo from '../components/Photo'
import { scenePhoto } from '../data/photos'
import QuestionCard from '../components/QuestionCard'
import { shuffledOrder, inOrder } from '../lib/shuffle'
import { ScrollLight } from '../components/Text'
import FuzzyText from '../effects/FuzzyText'
import SideRays from '../effects/SideRays'
import { DARK_WORDS } from '../data/patterns'
import { SHOW_PATTERNS } from '../config'
import { useData } from '../i18n/data'
import { useT } from '../i18n'
import { useReveal, useTitle } from '../lib/hooks'

// what each part of the hero brain does, in both languages
const LOBES = {
  frontal: { name: ['Frontal lobe', 'لۆبی پێشەوە'], does: ['Planning, self-control, and the facial expressions you choose to make.', 'پلاندانان، خۆگرتن، و ئەو دەربڕینانەی دەموچاو کە بە ئارەزووی خۆت دروستیان دەکەیت.'] },
  parietal: { name: ['Parietal lobe', 'لۆبی تەپڵەسەر'], does: ['Touch, and the sense of where your body is.', 'هەستی دەستلێدان، و زانینی ئەوەی جەستەت لە کوێیە.'] },
  temporal: { name: ['Temporal lobe', 'لۆبی لاجانگ'], does: ['Hearing, memory and recognising faces. Deep inside sits the amygdala, quick to sense threat.', 'بیستن، یادەوەری و ناسینەوەی دەموچاو. لە قووڵاییدا ئەمیگدالا هەیە، کە بە خێرایی هەست بە مەترسی دەکات.'] },
  occipital: { name: ['Occipital lobe', 'لۆبی پشتەسەر'], does: ['Vision. Everything you read in a face starts here.', 'بینین. هەرچی لە دەموچاوێکدا دەیخوێنیتەوە، لێرەوە دەست پێدەکات.'] },
  cerebellum: { name: ['Cerebellum', 'مێشکۆڵە'], does: ['Balance, posture, and the timing of every movement.', 'هاوسەنگی، شێوەی وەستان، و کاتبەندیی هەموو جووڵەیەک.'] },
  brainstem: { name: ['Brain stem', 'قەدی مێشک'], does: ['Breathing, heartbeat, and fast reflexes like the startle.', 'هەناسەدان، لێدانی دڵ، و کاردانەوەی خێرای وەک ڕاچڵەکین.'] },
}

export default function Home() {
  useTitle(null)
  const ref = useReveal()
  return (
    <div ref={ref} className="home">
      <Hero />
      <TryOne />
      <Rooms />
      {SHOW_PATTERNS && <DarkWordsTeaser />}
      <Manifesto />
    </div>
  )
}

function Hero() {
  const t = useT()
  const lobes = Object.fromEntries(Object.entries(LOBES).map(([k, v]) => [k, { name: t(v.name), does: t(v.does) }]))
  return (
    <section className="hero">
      <Brain className="hero-brain" lobes={lobes} hint={{ title: t(['Point at the brain', 'ئاماژە بۆ مێشکەکە بکە']), text: t(['Each part lights up and tells you what it does. Click to fire a signal.', 'هەر بەشێک ڕووناک دەبێتەوە و پێت دەڵێت چی دەکات. کلیک بکە بۆ ناردنی ئاماژەیەک.']) }} />
      <div className="hero-copy">
        <Headline className="display hero-title" delay={0.25} text={t.lang === 'ckb' ? ['مێشک دەیشارێتەوە،', 'جەستە ئاشکرای دەکات.'] : ['The mind hides it.', 'The body', 'gives it away.']} />
        <p className="lede hero-lede">{t(['Faces, eyes, hands, shoulders and feet are always saying something. Unmasked teaches you to read them carefully: what a signal usually means, what else it could mean, and what to check before you believe it.', 'دەموچاو، چاو، دەست، شان و پێ هەمیشە شتێک دەڵێن. Unmasked فێرت دەکات بە وردی بیانخوێنیتەوە: ئاماژەیەک زۆرجار مانای چییە، چ مانایەکی تری دەکرێت هەبێت، و پێش ئەوەی باوەڕی پێبکەیت چی بپشکنیت.'])}</p>
        <div className="hero-actions">
          <Link to="/train" className="btn btn-light cursor-target"><span className="dot" />{t(['Train your eye', 'چاوت ڕابهێنە'])}</Link>
          <Link to="/map" className="btn btn-ghost cursor-target">{t(['Open the map', 'نەخشەکە بکەرەوە'])}</Link>
        </div>
      </div>
    </section>
  )
}

function TryOne() {
  const t = useT()
  const { TESTS } = useData()
  const item = TESTS[0].items[0]
  const [choice, setChoice] = useState(null) // the position in the content, not on screen
  const [order, setOrder] = useState(() => shuffledOrder(item.options.length))
  const shown = choice == null ? null : order.indexOf(choice)
  return (
    <section className="try wrap">
      <header className="section-head rv">
        <Headline as="h2" className="display section-title" text={t(['Read this first.', 'سەرەتا ئەمە بخوێنەوە.'])} />
        <p className="lede">{t(['Four words that sound almost the same. One face, and only its eyes. Choose, and the frame will widen to show you the rest.', 'چوار وشە کە نزیکەی وەک یەک دەنگ دەدەنەوە. یەک دەموچاو، و تەنها چاوەکانی. هەڵبژێرە، و چوارچێوەکە فراوان دەبێت تا ئەوەی ماوە پیشانت بدات.'])}</p>
      </header>
      <div className="rv">
        <QuestionCard item={inOrder(item, order)} kind="eyes" answered={shown} choice={shown} onAnswer={(i) => setChoice(order[i])}>
          <div className="qcard-next">
            <Link to="/train/eyes" className="btn btn-light cursor-target">{t(['Read all twelve faces', 'هەر دوازدە دەموچاوەکە بخوێنەوە'])}</Link>
            <button className="link-line ui" onClick={() => { setChoice(null); setOrder(shuffledOrder(item.options.length)) }}>{t(['Try it again', 'دووبارە هەوڵ بدەرەوە'])}</button>
          </div>
        </QuestionCard>
      </div>
    </section>
  )
}

function useCycle(n, ms) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % n), ms)
    return () => clearInterval(t)
  }, [n, ms])
  return i
}

function Rooms() {
  const t = useT()
  const { BODY_MAPS, UNITS } = useData()
  const mapI = useCycle(BODY_MAPS.length, 3200)
  const bodyI = useCycle(4, 2600)
  const feel = BODY_MAPS[mapI]
  const smile = UNITS.filter((u) => u.au === 6 || u.au === 12) // the smile that reaches the eyes
  const poses = [['crossed', 'cold'], ['crossed', 'argument'], ['crossed', 'lecture'], ['triumph', 'win']]
  const low = (s) => (t.lang === 'ckb' ? s : s.toLowerCase())
  return (
    <section className="rooms wrap">
      <header className="section-head rv">
        <Headline as="h2" className="display section-title" text={t(['Three ways in.', 'سێ ڕێگا بۆ ژوورەوە.'])} />
      </header>

      <Link to="/map" className="room room-map rv cursor-target">
        <div className="room-visual">
          <ParticleBody preview heat={feel.heat} label={t([`A body of light, showing where people feel ${low(feel.name)}`, `جەستەیەک لە ڕووناکی، کە پیشانی دەدات خەڵک لە کوێدا هەست بە ${feel.name} دەکەن`])}
            layout={(W, H) => ({ ox: W / 2, oy: H * 0.5, scale: H * 0.44 })} />
          <span className="room-caption ui"><span className="hot-dot" />{t(['Where people feel', 'خەڵک لە کوێ هەست دەکەن بە'])} <b>{low(feel.name)}</b></span>
        </div>
        <div className="room-copy">
          <span className="room-no ui">{t(['The Map', 'نەخشەکە'])}</span>
          <h3 className="display room-title">{t(['Touch a part of the body. Find out what it says.', 'دەست لە بەشێکی جەستە بدە. بزانە چی دەڵێت.'])}</h3>
          <p>{t(['Brows, eyes, hands, shoulders, feet: what each one signals to other people, what it feels from the inside, and how the setting changes the reading. Pick a feeling and watch where it lands in the body.', 'برۆ، چاو، دەست، شان، پێ: هەر یەکەیان چ ئاماژەیەک بۆ خەڵکی تر دەنێرێت، لە ناوەوە هەست بە چی دەکات، و دەوروبەر چۆن خوێندنەوەکە دەگۆڕێت. هەستێک هەڵبژێرە و سەیر بکە لە کوێی جەستەدا دەنیشێتەوە.'])}</p>
          <span className="link-line">{t(['Open the map', 'نەخشەکە بکەرەوە'])}</span>
        </div>
      </Link>

      <Link to="/mirror" className="room room-mirror rv cursor-target">
        <div className="room-copy">
          <span className="room-no ui">{t(['The Mirror', 'ئاوێنەکە'])}</span>
          <h3 className="display room-title">{t(['See what your own face gives away.', 'ببینە دەموچاوی خۆت چی ئاشکرا دەکات.'])}</h3>
          <p>{t(['Everyone can see your face except you. Before an interview or a presentation, talk to the camera for 45 seconds and get a report of your tells: how often you blinked, which smiles reached your eyes, when you pressed your lips. Then practise a poker face. It reads muscles, never feelings.', 'هەموو کەسێک دەموچاوت دەبینێت جگە لە خۆت. پێش چاوپێکەوتنێک یان پێشکەشکردنێک، ٤٥ چرکە قسە بۆ کامێراکە بکە و ڕاپۆرتێک لەسەر ئاماژەکانت وەربگرە: چەند جار چاوت ترووکاند، کام زەردەخەنە گەیشتە چاوەکانت، کەی لێوەکانت پەستاند. پاشان ڕاهێنان لەسەر دەموچاوی بێهەست بکە. ماسولکە دەخوێنێتەوە، هەرگیز هەست نا.'])}</p>
          <span className="link-line">{t(['Look in the mirror', 'سەیری ئاوێنەکە بکە'])}</span>
        </div>
        <div className="room-visual">
          <PhotoPlate compact caption={false} lit={[6, 12]} />
          <ul className="room-units ui" aria-hidden="true">
            {smile.map((u) => <li key={u.au}><b>AU{u.au}</b> {u.plain}</li>)}
          </ul>
        </div>
      </Link>

      <Link to="/train" className="room room-train rv cursor-target">
        <div className="room-visual">
          <Photo key={poses[bodyI][1]} fill image={scenePhoto(poses[bodyI][1])} fallback={<Silhouette pose={poses[bodyI][0]} scene={poses[bodyI][1]} label={t(['A backlit silhouette in a changing scene', 'سێبەرێکی ڕووناککراو لە دیمەنێکی گۆڕاودا'])} />} />
        </div>
        <div className="room-copy">
          <span className="room-no ui">{t(['Train your eye', 'چاوت ڕابهێنە'])}</span>
          <h3 className="display room-title">{t(['The same arms, crossed in three different rooms.', 'هەمان باسک، لێکئاڵاو لە سێ ژووری جیاوازدا.'])}</h3>
          <p>{t(['Read a face from a strip of eyes, a body with the face hidden, and one pose dropped into different scenes. Every answer shows the cues that decided it, because a score teaches nothing on its own.', 'دەموچاوێک لە پارچەیەکی چاو بخوێنەوە، جەستەیەک کە دەموچاوی شاراوەیە، و یەک شێوەی جەستە لە دیمەنی جیاوازدا. هەموو وەڵامێک ئەو ئاماژانە پیشان دەدات کە بڕیاریان دا، چونکە نمرە بە تەنها هیچ فێر ناکات.'])}</p>
          <span className="link-line">{t(['Start training', 'دەست بە ڕاهێنان بکە'])}</span>
        </div>
      </Link>
    </section>
  )
}

// shown only when Patterns is switched on (config.js)
function DarkWordsTeaser() {
  const i = useCycle(3, 2600)
  const word = DARK_WORDS[i]
  return (
    <section className="dark-teaser">
      <div className="dark-rays" aria-hidden="true">
        <SideRays rayColor1="#e2434f" rayColor2="#5b7cf0" origin="top-left" blend={0.35} intensity={2.2} speed={1.4} density={4} spread={2.4} falloff={0.75} dust={0.35} glow={1} followMouse mouseInfluence={0.25} />
      </div>
      <div className="wrap dark-teaser-grid">
        {/* the reveal sits on a wrapper: the word inside remounts each time it changes */}
        <div className="rv">
          <div className="dark-word" key={word.id}>
            <FuzzyText fontSize="clamp(3.2rem, 9vw, 8.5rem)" fontWeight={300} fontFamily="Newsreader Variable, Georgia, serif" color="#efe6dc" baseIntensity={0.16} hoverIntensity={0.55} enableHover>
              {word.word}
            </FuzzyText>
          </div>
        </div>
        <div className="dark-copy rv">
          <h2 className="display section-title small">Words people throw at each other.</h2>
          <p>Psychopath. Narcissist. Gaslighting. Love bombing. Twenty-five of them: what they actually mean, why nobody can spot them from a face, and what to watch instead.</p>
          <Link to="/patterns#dark-words" className="btn btn-ghost cursor-target">Read the dark words</Link>
        </div>
      </div>
    </section>
  )
}

function Manifesto() {
  const t = useT()
  const rules = [
    [['Context', 'بارودۆخ'], ['Where, who, and what just happened.', 'لە کوێ، کێ، و چی تازە ڕوویدا.']],
    [['Clusters', 'کۆمەڵە ئاماژە'], ['Several signals agreeing, not one.', 'چەند ئاماژەیەک کە یەک دەگرنەوە، نەک یەک.']],
    [['Baseline', 'باری ئاسایی'], ['A change from how they usually are.', 'گۆڕانکارییەک لەو شێوەیەی کە بە ئاسایی هەن.']],
  ]
  return (
    <section className="manifesto wrap">
      <ScrollLight key={t.lang} className="display manifesto-text">
        {t(['One gesture means almost nothing. Read the room before the face: where they are, who is there, what just happened. Look for clusters, three signals pointing the same way. And compare a person to themselves, because a change from how someone usually is says more than any single movement ever will.', 'یەک جووڵە نزیکەی هیچ مانایەکی نییە. پێش دەموچاو ژوورەکە بخوێنەوە: لە کوێن، کێ لەوێیە، چی تازە ڕوویدا. بەدوای کۆمەڵە ئاماژەدا بگەڕێ، سێ ئاماژە کە بەرەو یەک ئاراستە دەچن. و کەسێک بە خۆی بەراورد بکە، چونکە گۆڕانکارییەک لەو شێوەیەی کە کەسێک بە ئاسایی هەیەتی، زیاتر لە هەر جووڵەیەکی تاک دەڵێت.'])}
      </ScrollLight>
      <div className="manifesto-rules rv">
        {rules.map(([name, text]) => (
          <div key={name[0]} className="rule"><h3 className="display">{t(name)}</h3><p>{t(text)}</p></div>
        ))}
      </div>
      <Link to="/how" className="link-line manifesto-link">{t(['How to read a body without fooling yourself', 'چۆن جەستە بخوێنیتەوە بێ ئەوەی خۆت بخەڵەتێنیت'])}</Link>
    </section>
  )
}
