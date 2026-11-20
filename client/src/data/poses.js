// Body poses as data: joint angles, not pictures. The Silhouette component draws them.
// Arms: [upper, fore] in degrees. 0 = hanging straight down, 90 = straight out to the side,
// 180 = straight up, negative = across the body. Optional third value: 'back' draws behind the torso.
// Legs: [thigh, shin], 0 = straight down, positive = outward.
// shoulders: −1 dropped … 1 raised (shrug). slump: −1 chest out … 1 collapsed. head: { tilt°, drop 0–1 (bowed), lift 0–1 (chin up) }.
export const POSES = {
  neutral: { armL: [8, 4], armR: [8, 4], legL: [3, 1], legR: [3, 1] },
  crossed: { armL: [12, -98], armR: [12, -84], legL: [4, 2], legR: [4, 2] },
  crossedTight: { shoulders: 0.85, slump: 0.25, head: { drop: 0.18 }, armL: [8, -104], armR: [8, -80], legL: [1, 0], legR: [1, 0] },
  handsHips: { slump: -0.25, armL: [48, -32], armR: [48, -32], legL: [10, 3], legR: [10, 3] },
  triumph: { slump: -0.5, head: { lift: 0.7 }, armL: [152, 168], armR: [152, 168], legL: [8, 3], legR: [8, 3], hands: 'fist' },
  shame: { slump: 1, shoulders: -0.5, head: { drop: 0.95 }, armL: [-6, -10], armR: [-6, -10], legL: [1, 0], legR: [1, 0] },
  faceInHands: { slump: 0.55, head: { drop: 0.55 }, armL: [10, -166], armR: [10, -166], legL: [2, 0], legR: [2, 0] },
  shrug: { shoulders: 1, head: { tilt: 9 }, armL: [16, 72], armR: [16, 72], legL: [4, 2], legR: [4, 2], hands: 'palm' },
  selfHug: { shoulders: 0.45, slump: 0.35, head: { drop: 0.3, tilt: -6 }, armL: [6, -132], armR: [6, -122], legL: [0, 0], legR: [0, 0] },
  leanBack: { slump: -0.35, head: { lift: 0.25 }, armL: [148, -122, 'back'], armR: [148, -122, 'back'], legL: [12, 4], legR: [12, 4] },
  despair: { slump: 0.45, head: { drop: 0.35 }, armL: [128, -150], armR: [128, -150], legL: [5, 2], legR: [5, 2] },
  fists: { slump: 0.12, shoulders: 0.2, armL: [14, 6], armR: [14, 6], legL: [13, 4], legR: [13, 4], hands: 'fist' },
  steeple: { armL: [14, -124], armR: [14, -124], legL: [4, 2], legR: [4, 2] },
  raisedFist: { head: { lift: 0.35 }, armL: [10, 5], armR: [170, 178], legL: [7, 2], legR: [7, 2], hands: 'fist' },
  shy: { slump: 0.3, head: { drop: 0.45, tilt: -10 }, armL: [10, 2], armR: [16, -76], legL: [0, -2], legR: [0, -2] },
  handOnHeart: { head: { drop: 0.2 }, armL: [8, 4], armR: [12, -122], legL: [3, 1], legR: [3, 1] },
  wide: { slump: -0.35, armL: [22, 10], armR: [22, 10], legL: [15, 5], legR: [15, 5] },
  handsBack: { slump: -0.15, head: { lift: 0.2 }, armL: [12, -30, 'back'], armR: [12, -30, 'back'], legL: [6, 2], legR: [6, 2] },
  fidget: { shoulders: 0.25, head: { drop: 0.15, tilt: 6 }, armL: [10, -70], armR: [18, -110], legL: [-2, 4], legR: [6, 1] },
  open: { slump: -0.2, head: { lift: 0.1 }, armL: [34, 70], armR: [34, 70], legL: [6, 2], legR: [6, 2], hands: 'palm' },
  performer: { slump: -0.45, head: { lift: 0.45, tilt: 6 }, armL: [64, 118], armR: [118, 152], legL: [13, 4], legR: [13, 4], hands: 'palm' },
  pleaser: { shoulders: 0.3, slump: 0.15, head: { tilt: 11, drop: 0.12 }, armL: [6, -24], armR: [6, -24], legL: [1, 0], legR: [1, 0] },
}
