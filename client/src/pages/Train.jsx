// Train your eye: the three tests, each a lit chamber.
import { Link } from 'react-router'
import LightRays from '../effects/LightRays'
import EyeStrip from '../components/EyeStrip'
import Silhouette from '../components/Silhouette'
import Photo from '../components/Photo'
import { bodyPhoto, scenePhoto } from '../data/photos'
import { useData } from '../i18n/data'
import { useT } from '../i18n'
import { useReveal, useStored, useTitle } from '../lib/hooks'
import Headline from '../components/Headline'

export default function Train() {
  const t = useT()
  const { TESTS } = useData()
  useTitle(['Train your eye', 'چاوت ڕابهێنە'])
  const ref = useReveal()
  const [best] = useStored('best', {})
  const eyes = TESTS[0].items
  return (
    <div ref={ref} className="train page">
      <div className="train-rays" aria-hidden="true">
        <LightRays raysOrigin="top-center" raysColor="#f0c25a" raysSpeed={0.6} lightSpread={0.7} rayLength={2.2} glow={0.5} haze={0.3} intensity={0.75} followMouse mouseInfluence={0.08} cursorShadow={false} clickPulse={false} />
      </div>
      <div className="wrap">
        <header className="page-head train-head">
          <Headline className="display page-title" text={t(['Train your eye.', 'چاوت ڕابهێنە.'])} />
          <p className="lede">{t(["Most people trust their first reading of a face or a body. These tests show you why you shouldn't, then teach you what to look at instead. Every answer explains itself.", 'زۆربەی خەڵک متمانە بە یەکەم خوێندنەوەیان بۆ دەموچاو یان جەستەیەک دەکەن. ئەم تاقیکردنەوانە پیشانت دەدەن بۆچی نابێت، پاشان فێرت دەکەن لە جیاتی ئەوە سەیری چی بکەیت. هەموو وەڵامێک خۆی ڕوون دەکاتەوە.'])}</p>
        </header>

        <div className="chambers">
          <Link to="/train/eyes" className="chamber chamber-eyes rv cursor-target">
            <div className="chamber-visual">
              <EyeStrip image={eyes[2].image} />
            </div>
            <Meta test={TESTS[0]} best={best.eyes} />
          </Link>
          <Link to="/train/body" className="chamber chamber-body rv cursor-target">
            <div className="chamber-visual duo">
              <Photo fill image={bodyPhoto('confident')} fallback={<Silhouette pose="triumph" scene="none" animate={false} label={t(['A silhouette with arms raised', 'سێبەرێک بە باسکی بەرزکراوە'])} />} />
              <Photo fill image={bodyPhoto('defeated')} fallback={<Silhouette pose="shame" scene="none" animate={false} label={t(['A silhouette with head bowed', 'سێبەرێک بە سەری شۆڕەوە'])} />} />
            </div>
            <Meta test={TESTS[1]} best={best.body} />
          </Link>
          <Link to="/train/context" className="chamber chamber-context rv cursor-target">
            <div className="chamber-visual trio">
              {['cold', 'argument', 'lecture'].map((s) => <Photo key={s} fill image={scenePhoto(s)} fallback={<Silhouette pose="crossed" scene={s} label={t(['Crossed arms', 'باسکی لێکئاڵاو'])} />} />)}
            </div>
            <Meta test={TESTS[2]} best={best.context} />
          </Link>
          <Link to="/mirror" className="chamber chamber-mirror rv cursor-target">
            <div className="chamber-copy">
              <span className="chamber-kicker ui">{t(['With your own face', 'بە دەموچاوی خۆت'])}</span>
              <h2 className="display chamber-title">{t(['Perform it.', 'دروستی بکە.'])}</h2>
              <p>{t(['The Mirror asks for an expression and scores which muscles you actually moved. Harder than it sounds: few people can lift only the inner ends of their brows.', 'ئاوێنەکە داوای دەربڕینێک دەکات و نمرە دەدات بەو ماسولکانەی کە بەڕاستی جووڵاندتن. لەوەی دەنگی دەداتەوە سەختترە: کەم کەس دەتوانێت تەنها سەرە ناوەکییەکانی برۆی بەرز بکاتەوە.'])}</p>
              <span className="link-line">{t(['Go to the Mirror', 'بڕۆ بۆ ئاوێنەکە'])}</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Meta({ test, best }) {
  const t = useT()
  return (
    <div className="chamber-copy">
      <span className="chamber-kicker ui">{test.kicker}</span>
      <h2 className="display chamber-title">{test.name}</h2>
      <p>{test.blurb}</p>
      <div className="chamber-foot ui">
        <span>{t([`${test.items.length} questions`, `${t.n(test.items.length)} پرسیار`])}</span>
        {best != null && <span className="chamber-best">{t([`Your best: ${best} of ${test.items.length}`, `باشترینی تۆ: ${t.n(best)} لە ${t.n(test.items.length)}`])}</span>}
      </div>
    </div>
  )
}
