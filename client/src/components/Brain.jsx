// The hero brain: a particle brain that fires on its own, faster when you pay attention, and names
// the lobe under your cursor with what it does. `lobes` and `hint` come in the page's language.
import { useMemo, useState } from 'react'
import BrainParticles from '../effects/BrainParticles'
import { makeBrain, REGIONS } from '../lib/brainShape'
import { useMedia } from '../lib/hooks'
import { LANGS, useLang } from '../i18n'

export default function Brain({ lobes, hint, className = '' }) {
  const small = useMedia('(max-width: 900px)')
  const rtl = LANGS[useLang().lang].dir === 'rtl'
  const cloud = useMemo(() => makeBrain(small ? 11000 : 20000), [small])
  const [region, setRegion] = useState(null)
  const info = region != null ? lobes[REGIONS[region]] : null
  return (
    <div className={`brain ${className}`}>
      <BrainParticles key={`${small ? 's' : 'l'}${rtl ? 'r' : ''}`} yaw={rtl ? 1.15 : -1.15} cloud={cloud} onPick={setRegion} size={small ? 30 : 36} camera={small ? 7.4 : 8.6} connectionDistance={small ? 26 : 34} density={small ? 0.9 : 0.78} glow={0.4} />
      <div className={`brain-readout ${info ? 'on' : ''}`} aria-live="polite">
        <span className="brain-readout-name display">{info ? info.name : hint.title}</span>
        <span className="brain-readout-what">{info ? info.does : hint.text}</span>
      </div>
    </div>
  )
}
