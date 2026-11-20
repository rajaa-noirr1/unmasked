// One test, one question at a time. At the end: the score, and every face or body you misread,
// with what you chose and what it was.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import QuestionCard from '../components/QuestionCard'
import LightRays from '../effects/LightRays'
import { useData } from '../i18n/data'
import { useT } from '../i18n'
import { useStored, useTitle } from '../lib/hooks'
import { api } from '../lib/api'
import { shuffledOrder, inOrder } from '../lib/shuffle'
import NotFound from './NotFound'

export default function TestPlayer() {
  const { id } = useParams()
  const t = useT()
  const { TESTS } = useData()
  const test = TESTS.find((x) => x.id === id)
  useTitle(test?.name)
  const [at, setAt] = useState(0)
  const [answers, setAnswers] = useState({})
  const [best, setBest] = useStored('best', {})
  const nextRef = useRef(null)
  // with the API: one attempt in the database per run through the test, started at the first answer
  const attemptRef = useRef(null)
  const [crowd, setCrowd] = useState({}) // question id → how everyone answered it
  // the options in a new random order for every run through the test (answers keep their own positions)
  const [round, setRound] = useState(0)
  const itemKey = test ? test.items.map((it) => `${it.id}:${it.options.length}`).join(',') : ''
  const orders = useMemo(() => Object.fromEntries((test?.items || []).map((it) => [it.id, shuffledOrder(it.options.length)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, round, itemKey])
  const restart = () => { attemptRef.current = null; setCrowd({}); setRound((r) => r + 1) }
  useEffect(() => { setAt(0); setAnswers({}); restart() }, [id])
  // after an answer, keyboard focus moves to Next, but the page stays where it is: the reader scrolls
  const answeredNow = test ? answers[test.items[Math.min(at, test.items.length - 1)].id] : null
  useEffect(() => { if (answeredNow != null) nextRef.current?.focus({ preventScroll: true }) }, [answeredNow])
  if (!test) return <NotFound />

  const items = test.items
  const done = at >= items.length
  const item = items[Math.min(at, items.length - 1)]
  const choice = answers[item.id]
  const score = items.filter((it) => answers[it.id] === it.answerIndex).length

  const answer = (opt) => {
    setAnswers((a) => ({ ...a, [item.id]: opt }))
    const qid = item.id
    attemptRef.current ||= api.startAttempt(test.id, t.lang)
    attemptRef.current.then((a) => a && api.answer(a.id, qid, opt + 1)).then((r) => r && setCrowd((c) => ({ ...c, [qid]: r.picks })))
  }
  const next = () => {
    const n = at + 1
    setAt(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (n >= items.length) {
      const s = items.filter((it) => (it.id === item.id ? choice : answers[it.id]) === it.answerIndex).length
      if (best[test.id] == null || s > best[test.id]) setBest({ ...best, [test.id]: s })
    }
  }

  return (
    <div className={`player page player-${test.kind}`}>
      <div className="train-rays dim" aria-hidden="true">
        <LightRays raysOrigin="top-center" raysColor={test.kind === 'context' ? '#bfb2a7' : '#f0c25a'} raysSpeed={0.5} lightSpread={0.6} rayLength={2} glow={0.4} haze={0.25} intensity={0.55} followMouse={false} cursorShadow={false} clickPulse={false} />
      </div>
      <div className="wrap">
        <div className="player-bar">
          <Link to="/train" className="link-line ui">{t(['All tests', 'هەموو تاقیکردنەوەکان'])}</Link>
          <span className="player-name display">{test.name}</span>
          <ol className="pips" aria-label={done ? t(['Finished', 'تەواو بوو']) : t([`Question ${at + 1} of ${items.length}`, `پرسیاری ${t.n(at + 1)} لە ${t.n(items.length)}`])}>
            {items.map((it, i) => {
              const a = answers[it.id]
              return <li key={it.id} className={`${i === at ? 'now' : ''} ${a != null ? (a === it.answerIndex ? 'yes' : 'no') : ''}`} />
            })}
          </ol>
        </div>

        {!done ? (
          <QuestionCard key={item.id} item={inOrder(item, orders[item.id])} kind={test.kind}
            answered={choice == null ? null : (orders[item.id] || []).indexOf(choice)} choice={choice == null ? null : (orders[item.id] || []).indexOf(choice)}
            onAnswer={(shown) => answer(orders[item.id] ? orders[item.id][shown] : shown)}>
            <Crowd picks={crowd[item.id]} />
            <div className="qcard-next">
              <button ref={nextRef} className="btn btn-light cursor-target" onClick={next}>
                {at + 1 < items.length ? t(['Next', 'دواتر']) : t(['See how you read', 'ببینە چۆنت خوێندەوە'])}
              </button>
              <span className="ui muted">{t([`${at + 1} of ${items.length}`, `${t.n(at + 1)} لە ${t.n(items.length)}`])}</span>
            </div>
          </QuestionCard>
        ) : (
          <Summary test={test} tests={TESTS} answers={answers} score={score} again={() => { setAnswers({}); setAt(0); restart() }} />
        )}
      </div>
    </div>
  )
}

// How everyone who took the test answered this question (from the database's option_picks view)
function Crowd({ picks }) {
  const t = useT()
  if (!picks) return null
  const total = picks.reduce((n, p) => n + p.picks, 0)
  const right = picks.find((p) => p.is_correct)
  if (total < 2) return <p className="crowd ui">{t(['You are the first to answer this one.', 'تۆ یەکەم کەسیت کە وەڵامی ئەمە دەداتەوە.'])}</p>
  return (
    <p className="crowd ui">
      {t([`Of ${total} answers so far, `, `لە ${t.n(total)} وەڵامی تا ئێستا، `])}
      <b>{t.lang === 'ckb' ? `٪${t.n(right?.percent ?? 0)}` : `${right?.percent ?? 0}%`}</b>
      {t([' got this one right.', ' ڕاست بوون.'])}
    </p>
  )
}

function Summary({ test, tests, answers, score, again }) {
  const t = useT()
  const missed = test.items.filter((it) => answers[it.id] !== it.answerIndex)
  const n = test.items.length
  const verdict = score === n ? t(['Every one. You read the cues, not the mood.', 'هەموویان. تۆ ئاماژەکانت خوێندەوە، نەک کەشەکە.'])
    : score >= n * 0.75 ? t(['A careful reader. The misses are the interesting part.', 'خوێنەرێکی وریا. هەڵەکان بەشە سەرنجڕاکێشەکەن.'])
    : score >= n * 0.5 ? t(['About as well as most people do on a first try. Look at what fooled you.', 'نزیکەی وەک زۆربەی خەڵک لە یەکەم هەوڵدا. سەیری ئەوە بکە کە فریوی دایت.'])
    : t(['These are hard on purpose. The near-misses are where the learning is.', 'ئەمانە بە ئەنقەست سەختن. فێربوون لەو هەڵانەدایە کە زۆر نزیک بوون.'])
  const others = tests.filter((x) => x.id !== test.id)
  return (
    <section className="summary">
      <p className="summary-score display"><span>{t.n(score)}</span><small>{t(['of', 'لە'])} {t.n(n)}</small></p>
      <h2 className="display summary-verdict">{verdict}</h2>
      {missed.length > 0 && (
        <>
          <h3 className="region-h ui">{t(['What fooled you', 'چی فریوی دایت'])}</h3>
          <ul className="missed" role="list">
            {missed.map((it) => (
              <li key={it.id}>
                <span className="missed-chose">{t(['You read', 'تۆ خوێندتەوە'])} <b>{answers[it.id] != null ? it.options[answers[it.id]] : t(['nothing', 'هیچ'])}</b></span>
                <span className="missed-was">{t(['It was', 'ئەوە بوو'])} <b>{it.answer}</b></span>
                <span className="missed-cue">{it.cue}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="qcard-next">
        <button className="btn btn-light cursor-target" onClick={again}>{t(['Read them again', 'دووبارە بیانخوێنەوە'])}</button>
        {others.map((x) => <Link key={x.id} to={`/train/${x.id}`} className="btn btn-ghost cursor-target">{x.name}</Link>)}
      </div>
    </section>
  )
}
