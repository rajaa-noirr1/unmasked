// A page that does not exist, and so has nothing to read.
import { Link } from 'react-router'
import FuzzyText from '../effects/FuzzyText'
import { useT } from '../i18n'
import { useTitle } from '../lib/hooks'
import Headline from '../components/Headline'

export default function NotFound() {
  const t = useT()
  useTitle(['Nothing here', 'هیچ شتێک لێرە نییە'])
  return (
    <div className="page wrap notfound">
      <div className="nf-fuzzy" aria-hidden="true" dir="ltr">
        <FuzzyText fontSize="clamp(7rem, 24vw, 19rem)" fontWeight={300} fontFamily="Newsreader Variable, Georgia, serif" color="#efe6dc" baseIntensity={0.22} hoverIntensity={0.6} glitchMode glitchInterval={2600} glitchDuration={200}>
          404
        </FuzzyText>
      </div>
      <Headline className="display nf-title" text={t(['Nothing here to read.', 'هیچ شتێک لێرە نییە بۆ خوێندنەوە.'])} />
      <p className="lede">{t(['This page does not exist, so it has no tells at all. Try one that does.', 'ئەم پەڕەیە بوونی نییە، بۆیە هیچ ئاماژەیەکی نییە. یەکێک تاقی بکەرەوە کە هەیە.'])}</p>
      <div className="actions">
        <Link className="btn btn-light cursor-target" to="/"><span className="dot" />{t(['Back to the start', 'گەڕانەوە بۆ سەرەتا'])}</Link>
        <Link className="btn btn-ghost cursor-target" to="/map">{t(['Open the map', 'نەخشەکە بکەرەوە'])}</Link>
      </div>
    </div>
  )
}
