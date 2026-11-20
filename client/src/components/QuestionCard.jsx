// One test question: the visual (an eyes strip, a body photo, or a silhouette in a scene), four
// close options, and after an answer, the reveal: what to look at and why the near-misses are near-misses.
// `choice` is the position of the chosen option (0–3), so it survives a change of language.
import { useState } from 'react'
import EyeStrip from './EyeStrip'
import Photo from './Photo'
import Silhouette from './Silhouette'
import { Decrypt } from './Text'
import { useT } from '../i18n'

const KEYS = { en: ['A', 'B', 'C', 'D'], ckb: ['ا', 'ب', 'پ', 'ت'] }

export default function QuestionCard({ item, kind, onAnswer, answered, choice, children, compact = false }) {
  const t = useT()
  const [hover, setHover] = useState(null)
  const done = answered != null
  const right = done && choice === item.answerIndex
  const pick = (i) => { if (!done) onAnswer?.(i) }
  const media = item.image || item.photo
  return (
    <article className={`qcard qcard-${kind} ${done ? 'done' : ''} ${right ? 'right' : done ? 'wrong' : ''} ${compact ? 'compact' : ''}`}>
      <div className="qcard-visual">
        {kind === 'eyes' && <EyeStrip image={item.image} widened={done} alt={t(['A pair of eyes', 'جووتێک چاو'])} />}
        {item.photo && (
          <Photo image={item.photo} revealed={done} alt={done || kind === 'context' ? item.photo.who || item.place || t(['A person', 'کەسێک']) : t(['A person, face hidden', 'کەسێک، دەموچاوی شاراوە'])}
            fallback={item.pose ? <Silhouette pose={item.pose} scene={item.scene} label={`${t(['A silhouette', 'سێبەرێک'])}${item.place ? `: ${item.place}` : ''}`} /> : null} />
        )}
        {kind !== 'eyes' && !item.photo && (
          <Silhouette pose={item.pose} scene={item.scene} label={`${t(['A silhouette', 'سێبەرێک'])}${item.place ? `: ${item.place}` : ''}`} />
        )}
        {item.place && <p className="qcard-place"><span className="ui">{t(['Where', 'لە کوێ'])}</span> {item.place}</p>}
      </div>

      <div className="qcard-body">
        <h2 className="qcard-prompt display">{item.prompt}</h2>
        <ul className="qcard-options" role="list">
          {item.options.map((opt, i) => {
            const isAnswer = i === item.answerIndex
            const state = !done ? '' : isAnswer ? 'is-answer' : i === choice ? 'is-wrong' : 'is-other'
            return (
              <li key={i}>
                <button className={`qopt cursor-target ${state} ${hover === i ? 'hover' : ''}`} onClick={() => pick(i)} disabled={done}
                  onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} aria-pressed={choice === i}>
                  <span className="qopt-key ui">{(KEYS[t.lang] || KEYS.en)[i]}</span>
                  <span className="qopt-text">{opt}</span>
                  {done && isAnswer && <span className="qopt-mark ui">{choice === i ? t(['Yes', 'بەڵێ']) : t(['This one', 'ئەمەیان'])}</span>}
                  {done && !isAnswer && i === choice && <span className="qopt-mark ui">{t(['Not quite', 'نا ڕێک'])}</span>}
                </button>
              </li>
            )
          })}
        </ul>

        {done && (
          <div className="qcard-reveal" aria-live="polite">
            <Decrypt as="h3" className="qcard-title display" text={item.title} start={t.lang !== 'ckb'} />
            <div className="qcard-why">
              <p><span className="ui qtag">{t(['Look at', 'سەیری ئەمە بکە'])}</span>{item.cue}</p>
              <p><span className="ui qtag">{t(['Why not the others', 'بۆچی ئەوانی تر نا'])}</span>{item.why}</p>
            </div>
            {media?.credit && (
              <p className="qcard-credit ui">
                {media.who && <b>{media.who}. </b>}
                {media.credit}
              </p>
            )}
            {children}
          </div>
        )}
      </div>
    </article>
  )
}
