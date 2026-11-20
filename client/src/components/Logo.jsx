// The Unmasked mark: a mask whose right half is lifting away, and under it one real eye, in gold.
// The mask is what people show; the eye is what the body gives away.
export const MASK_LEFT = 'M24 11C18 7 7 7.5 4 13.5C2 19 5.5 26 13 26C17.5 26 21 23.2 24 21ZM8.5 17.5C11 14 17 14 19.5 17.5C17 21 11 21 8.5 17.5Z'
export const MASK_RIGHT = 'M24 11C30 7 41 7.5 44 13.5C46 19 42.5 26 35 26C30.5 26 27 23.2 24 21ZM28.5 17.5C31 14 37 14 39.5 17.5C37 21 31 21 28.5 17.5Z'
export const EYE = 'M28 17.5C30.8 14.2 36.2 14.2 39 17.5C36.2 20.8 30.8 20.8 28 17.5Z'

export default function LogoMark({ className = '' }) {
  return (
    <svg viewBox="0 0 48 32" className={`logo-mark ${className}`} aria-hidden="true">
      <path className="logo-eye" d={EYE} />
      <circle className="logo-iris" cx="33.5" cy="17.5" r="2.4" />
      <path className="logo-mask" d={MASK_LEFT} fillRule="evenodd" />
      <g className="logo-lift">
        <path className="logo-mask lifted" d={MASK_RIGHT} fillRule="evenodd" />
      </g>
    </svg>
  )
}
