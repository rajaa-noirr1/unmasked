// The photos in the eyes and body tests live in client/public/images/eyes and images/body
// (see images/SHOT-LIST.md for the file names). This file says who is in each photo and how to frame it.
//
//   who   – shown after the answer, e.g. 'Will Graham (Hugh Dancy)'. Leave '' to show nothing.
//   crop  – eyes test: the strip shown before the answer, as fractions of the photo { x, y, w, h }: centred on
//           both pupils, about 2.7 eye-widths wide and never under 400 photo pixels (so it stays sharp). null = a guess.
//   veil  – body test: a blurred circle over the face until the answer { x, y, r }, r as a fraction of
//           the photo's width. null = the face is not hidden.
//   credit – optional: the credit line shown under the answer (eyes and body default to STILLS).
import { asset } from '../lib/asset'

export const STILLS = 'Film still, the property of its owners, used here for teaching.'

export const EYES = {
  suspicious: { who: '', crop: { x: 0.255, y: 0.262, w: 0.545, h: 0.21 } },
  contemptuous: { who: '', crop: { x: 0.193, y: 0.257, w: 0.567, h: 0.227 } },
  afraid: { who: '', crop: { x: 0.159, y: 0.354, w: 0.513, h: 0.275 } },
  grieving: { who: '', crop: { x: 0.287, y: 0.186, w: 0.442, h: 0.307 } },
  amused: { who: '', crop: { x: 0.524, y: 0.219, w: 0.254, h: 0.163 } },
  distressed: { who: '', crop: { x: 0.292, y: 0.199, w: 0.467, h: 0.347 } },
  furious: { who: '', crop: { x: 0.159, y: 0.125, w: 0.558, h: 0.394 } },
  ashamed: { who: '', crop: { x: 0.147, y: 0.264, w: 0.543, h: 0.209 } },
  worried: { who: '', crop: { x: 0.304, y: 0.196, w: 0.312, h: 0.214 } },
  curious: { who: '', crop: { x: 0.306, y: 0.299, w: 0.341, h: 0.314 } },
  smug: { who: '', crop: { x: 0.242, y: 0.201, w: 0.489, h: 0.188 } },
  affectionate: { who: '', crop: { x: 0.2, y: 0.186, w: 0.544, h: 0.284 } },
}

export const BODY = {
  confident: { who: '', veil: null },
  defensive: { who: '', veil: null },
  defeated: { who: '', veil: null },
  anxious: { who: '', veil: null },
  dominant: { who: '', veil: null },
  threatening: { who: '', veil: null },
  withdrawn: { who: '', veil: null },
  controlled: { who: '', veil: null },
  'head-in-hands': { who: '', veil: null },
  steeple: { who: '', veil: null },
}

// context test: one posture in different scenes. Until a photo is there, the drawn silhouette is shown.
export const SCENES = {
  cold: { who: '', credit: '' },
  argument: { who: '', credit: '' },
  lecture: { who: '', credit: '' },
  stadium: { who: '', credit: '' },
  desk: { who: '', credit: '' },
  protest: { who: '', credit: '' },
  win: { who: '', credit: '' },
  'hand-on-heart': { who: '', credit: '' },
}

export const eyesPhoto = (name) => ({ src: asset(`images/eyes/${name}`), file: `images/eyes/${name}.jpg`, credit: STILLS, ...EYES[name] })
export const bodyPhoto = (name) => ({ src: asset(`images/body/${name}`), file: `images/body/${name}.jpg`, credit: STILLS, ...BODY[name] })
export const scenePhoto = (name) => ({ src: asset(`images/context/${name}`), file: `images/context/${name}.jpg`, credit: '', ...SCENES[name] })
