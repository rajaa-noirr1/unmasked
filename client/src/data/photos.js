// The photos in the eyes and body tests live in client/public/images/eyes and images/body
// (see images/SHOT-LIST.md for the file names). This file says who is in each photo and how to frame it.
//
//   who   – shown after the answer, e.g. 'Will Graham (Hugh Dancy)'. Leave '' to show nothing.
//   crop  – eyes test: where the eyes are, as fractions of the photo { x, y, w, h }. null = a default guess.
//   veil  – body test: a blurred circle over the face until the answer { x, y, r }, r as a fraction of
//           the photo's width. null = the face is not hidden.
//   credit – optional: the credit line shown under the answer (eyes and body default to STILLS).
import { asset } from '../lib/asset'

export const STILLS = 'Still from Hannibal (NBC, 2013–2015), used here for teaching.'

export const EYES = {
  suspicious: { who: '', crop: null },
  contemptuous: { who: '', crop: null },
  afraid: { who: '', crop: null },
  grieving: { who: '', crop: null },
  amused: { who: '', crop: null },
  distressed: { who: '', crop: null },
  furious: { who: '', crop: null },
  ashamed: { who: '', crop: null },
  worried: { who: '', crop: null },
  curious: { who: '', crop: null },
  smug: { who: '', crop: null },
  affectionate: { who: '', crop: null },
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
