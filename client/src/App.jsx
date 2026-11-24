import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { Nav, Footer } from './components/Shell'
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
  useEffect(() => watchInteractive(), [])

  // a new page starts at the top, straight away: no transition, so it never looks like a reload
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])
  // a link to an id on another page (like /how#sources) scrolls there once the page is shown
  useEffect(() => {
    if (!location.hash) return
    const t = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150)
    return () => clearTimeout(t)
  }, [location])

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Routes>
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
      <div className="grain"><Noise opacity={0.07} fps={18} blendMode="overlay" contrast={0.7} fixed /></div>
      <TargetCursor targetSelector=".cursor-target" cursorColor="#efe6dc" cursorColorOnTarget="#f0c25a" size={30} cornerSize={9} thickness={1.5} dotSize={4} showLabel={false} blendMode="normal" />
    </>
  )
}
