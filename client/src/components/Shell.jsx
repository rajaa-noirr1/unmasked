// The frame around every page: navigation, the language switch, footer, and the blink between pages.
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import LogoMark from './Logo'
import { SHOW_PATTERNS } from '../config'
import { LANGS, useLang, useT } from '../i18n'
import { useContentSource } from '../i18n/data'

const ALL_NAV = [
  { to: '/map', name: ['The Map', 'نەخشەکە'], note: ['what each part says', 'هەر بەشێک چی دەڵێت'] },
  { to: '/mirror', name: ['The Mirror', 'ئاوێنەکە'], note: ['what your face gives away', 'دەموچاوت چی ئاشکرا دەکات'] },
  { to: '/train', name: ['Train your eye', 'چاوت ڕابهێنە'], note: ['read before you guess', 'بخوێنەوە پێش مەزەندە'] },
  { to: '/patterns', name: ['Patterns', 'شێوازەکان'], note: ['and the dark words', 'و وشە تاریکەکان'], hidden: !SHOW_PATTERNS },
]
export const NAV = ALL_NAV.filter((n) => !n.hidden)

export function Wordmark({ small = false }) {
  const t = useT()
  return (
    <Link to="/" className={`wordmark ${small ? 'small' : ''}`} aria-label={t(['Unmasked, home', 'Unmasked، سەرەتا'])}>
      <LogoMark />
      <span lang="en"><span className="wordmark-un">Un</span>masked</span>
    </Link>
  )
}

// English ⇄ کوردی. Shows the language you would switch to.
export function LangSwitch({ className = '' }) {
  const { lang, setLang } = useLang()
  const other = lang === 'ckb' ? 'en' : 'ckb'
  return (
    <button className={`lang-switch cursor-target ${className}`} onClick={() => setLang(other)} lang={other === 'ckb' ? 'ckb' : 'en'}
      aria-label={other === 'ckb' ? 'Switch to Kurdish (Sorani)' : 'بیگۆڕە بۆ ئینگلیزی'}>
      <span className="lang-globe" aria-hidden="true">
        <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /><path d="M2 10h16M10 2c2.6 2.4 2.6 13.6 0 16M10 2c-2.6 2.4-2.6 13.6 0 16" /></svg>
      </span>
      {LANGS[other].label}
    </button>
  )
}

export function Nav() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''} ${open ? 'open' : ''}`}>
      <div className="nav-row">
        <Wordmark />
        <nav className="nav-links" aria-label={t(['Main', 'سەرەکی'])}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="nav-link cursor-target">
              <span className="nav-name">{t(n.name)}</span>
              <span className="nav-note">{t(n.note)}</span>
            </NavLink>
          ))}
          <LangSwitch className="in-menu" />
        </nav>
        <LangSwitch className="in-bar" />
        <button className="nav-toggle" aria-expanded={open} aria-label={t(['Menu', 'لیست'])} onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
    </header>
  )
}

export function Footer() {
  const t = useT()
  const source = useContentSource()
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-about">
          <Wordmark small />
          <p>{t(['Unmasked explains what the human body gives away: faces, eyes, hands, posture. It teaches you to read carefully. It does not diagnose anyone, read minds or catch liars, because nobody can do that reliably.', 'Unmasked ڕوونی دەکاتەوە کە جەستەی مرۆڤ چی ئاشکرا دەکات: دەموچاو، چاو، دەست، شێوەی وەستان. فێرت دەکات بە وردی بخوێنیتەوە. کەس دەستنیشان ناکات، بیر ناخوێنێتەوە و درۆزن ناگرێت، چونکە کەس ناتوانێت ئەمە بە شێوەیەکی متمانەپێکراو بکات.'])}</p>
          <p className="muted">{t(['Struggling? Talk to someone you trust, or find a free helpline at', 'کێشەت هەیە؟ قسە لەگەڵ کەسێک بکە کە متمانەت پێیەتی، یان هێڵێکی یارمەتیی بێبەرامبەر بدۆزەرەوە لە'])} <a className="link-line" href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a>.</p>
        </div>
        <nav className="footer-nav" aria-label={t(['Footer', 'خوارەوە'])}>
          {NAV.map((n) => <Link key={n.to} to={n.to}>{t(n.name)}</Link>)}
          <Link to="/how">{t(['How to read a body', 'چۆن جەستە بخوێنیتەوە'])}</Link>
          <LangSwitch />
        </nav>
        <div className="footer-credits">
          <p>{t(['Photos in the tests are film and TV stills, the property of their owners, used here for teaching.', 'وێنەکانی ناو تاقیکردنەوەکان وێنەی فیلم و زنجیرەن، موڵکی خاوەنەکانیانن، و لێرەدا بۆ فێرکردن بەکارهاتوون.'])}</p>
          <p>{t(['Face tracking by MediaPipe. Visual effects adapted from React Bits by David Haz.', 'شوێنکەوتنی دەموچاو بە MediaPipe. کاریگەرییە بینراوەکان لە React Bits ـی David Haz وەرگیراون.'])} <Link to="/how#sources">{t(['All sources', 'هەموو سەرچاوەکان'])}</Link></p>
          <p className="footer-source">{source === 'database' ? t(['Content: live from the database (PostgreSQL).', 'ناوەڕۆک: ڕاستەوخۆ لە داتابەیسەکەوە (PostgreSQL).']) : t(['Content: the built-in copy.', 'ناوەڕۆک: کۆپییە ناوخۆییەکە.'])}</p>
        </div>
      </div>
    </footer>
  )
}

// Between pages the whole screen blinks: the lids close, the page changes behind them, they open.
// Returns the location to render (it lags behind the real one while the lids are shut) and the phase.
export function useBlink(location) {
  const [shown, setShown] = useState(location)
  const [phase, setPhase] = useState('open')
  useEffect(() => {
    if (location.pathname === shown.pathname) {
      if (location !== shown) setShown(location)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(location)
      window.scrollTo(0, 0)
      return
    }
    setPhase('closing')
    const t1 = setTimeout(() => { setShown(location); window.scrollTo(0, 0); setPhase('opening') }, 330)
    const t2 = setTimeout(() => setPhase('open'), 860)
    return () => { clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])
  return [shown, phase]
}

export function Lids({ phase }) {
  return (
    <div className={`lids lids-${phase}`} aria-hidden="true">
      <div className="lid lid-top"><span className="lash" /></div>
      <div className="lid lid-bottom" />
    </div>
  )
}
