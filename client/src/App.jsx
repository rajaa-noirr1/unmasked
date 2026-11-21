import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { Nav, Footer, Lids, useBlink } from './components/Shell'
import TargetCursor from './effects/TargetCursor'
import Noise from './effects/Noise'
import { watchInteractive } from './lib/attention'
import Home from './pages/Home'
import MapPage from './pages/MapPage'
import Mirror from './pages/Mirror'
import Train from './pages/Train'
import TestPlayer from './pages/TestPlayer'
import Patterns from './pages/Patterns'
import How from './pages/How'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import { SHOW_PATTERNS } from './config'

export default function App() {
  const location = useLocation()
  const [shown, phase] = useBlink(location)
  useEffect(() => watchInteractive(), [])

  // a link to an id on another page (like /patterns#dark-words) scrolls there once the page is shown
  useEffect(() => {
    if (!shown.hash) return
    const t = setTimeout(() => document.getElementById(shown.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 700)
    return () => clearTimeout(t)
  }, [shown])

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Routes location={shown}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/mirror" element={<Mirror />} />
          <Route path="/train" element={<Train />} />
          <Route path="/train/:id" element={<TestPlayer />} />
          {SHOW_PATTERNS && <Route path="/patterns" element={<Patterns />} />}
          <Route path="/how" element={<How />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Lids phase={phase} />
      <div className="grain"><Noise opacity={0.07} fps={18} blendMode="overlay" contrast={0.7} fixed /></div>
      <TargetCursor targetSelector=".cursor-target" cursorColor="#efe6dc" cursorColorOnTarget="#f0c25a" size={30} cornerSize={9} thickness={1.5} dotSize={4} showLabel={false} blendMode="normal" />
    </>
  )
}
