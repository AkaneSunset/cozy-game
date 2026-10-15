// Draws the princess as an SVG string. The look object is kept separate
// from the drawing so a future wardrobe can swap colors and pieces.
const PRINCESS_DEFAULT_LOOK = {
  skin: '#f8d9c4',
  hair: '#f3cf7a',
  hairShade: '#e2b75c',
  dress: '#f7a8c8',
  dressShade: '#ee8db5',
  trim: '#fff4fa',
  crown: '#ffd36e',
  gem: '#9ad7f5',
};

function princessSVG(look, opts = {}) {
  const l = Object.assign({}, PRINCESS_DEFAULT_LOOK, look || {});
  const viewBox = opts.avatar ? '20 4 60 60' : '0 0 100 140';
  return `
<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" class="princess-svg" aria-hidden="true">
  <!-- hair, back -->
  <path d="M28 40 Q26 16 50 15 Q74 16 72 40 L76 82 Q66 90 50 88 Q34 90 24 82 Z" fill="${l.hair}"/>
  <path d="M30 60 Q28 78 24 82 Q34 90 42 86 Z" fill="${l.hairShade}" opacity=".6"/>
  <path d="M70 60 Q72 78 76 82 Q66 90 58 86 Z" fill="${l.hairShade}" opacity=".6"/>

  <!-- dress -->
  <path d="M40 66 L60 66 L64 84 Q80 112 84 132 Q50 140 16 132 Q20 112 36 84 Z" fill="${l.dress}"/>
  <path d="M50 70 Q46 100 34 134 Q24 134 16 132 Q20 112 36 84 Z" fill="${l.dressShade}" opacity=".45"/>
  <path d="M16 132 Q50 140 84 132 Q83 127 82 124 Q50 132 18 124 Q17 128 16 132 Z" fill="${l.trim}"/>
  <path d="M40 66 L60 66 L61 74 Q50 78 39 74 Z" fill="${l.trim}"/>
  <circle cx="50" cy="94" r="2.2" fill="${l.trim}"/>
  <circle cx="44" cy="106" r="1.8" fill="${l.trim}"/>
  <circle cx="57" cy="110" r="1.8" fill="${l.trim}"/>
  <circle cx="36" cy="122" r="1.8" fill="${l.trim}"/>
  <circle cx="64" cy="122" r="1.8" fill="${l.trim}"/>

  <!-- arms -->
  <path d="M39 70 Q30 80 33 92" stroke="${l.skin}" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M61 70 Q70 80 67 92" stroke="${l.skin}" stroke-width="5" stroke-linecap="round" fill="none"/>
  <!-- neck -->
  <rect x="46" y="58" width="8" height="9" rx="3" fill="${l.skin}"/>

  <!-- head -->
  <circle cx="50" cy="42" r="19" fill="${l.skin}"/>
  <!-- face -->
  <ellipse cx="43" cy="44" rx="2.3" ry="3" fill="#5a3d4a"/>
  <ellipse cx="57" cy="44" rx="2.3" ry="3" fill="#5a3d4a"/>
  <circle cx="43.8" cy="42.8" r=".8" fill="#fff"/>
  <circle cx="57.8" cy="42.8" r=".8" fill="#fff"/>
  <ellipse cx="38" cy="50" rx="3.4" ry="2" fill="#f7a1b5" opacity=".7"/>
  <ellipse cx="62" cy="50" rx="3.4" ry="2" fill="#f7a1b5" opacity=".7"/>
  <path d="M46.5 51 Q50 54.5 53.5 51" stroke="#c0647d" stroke-width="1.5" fill="none" stroke-linecap="round"/>

  <!-- bangs -->
  <path d="M30 40 Q32 22 50 22 Q68 22 70 40 Q64 30 56 31 Q52 36 44 33 Q38 32 30 40 Z" fill="${l.hair}"/>
  <path d="M44 33 Q48 28 54 27" stroke="${l.hairShade}" stroke-width="1.2" fill="none" opacity=".7"/>

  <!-- crown -->
  <path d="M38 24 L40 12 L45 19 L50 9 L55 19 L60 12 L62 24 Z" fill="${l.crown}" stroke="#e6ad3c" stroke-width="1" stroke-linejoin="round"/>
  <circle cx="50" cy="19" r="2.2" fill="${l.gem}"/>
  <circle cx="40" cy="12" r="1.4" fill="${l.trim}"/>
  <circle cx="50" cy="9" r="1.4" fill="${l.trim}"/>
  <circle cx="60" cy="12" r="1.4" fill="${l.trim}"/>
</svg>`;
}

function castleSVG() {
  return `
<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="#fbe6f0" stroke="#efc3d6" stroke-width="1.2">
    <rect x="40" y="50" width="120" height="70"/>
    <rect x="20" y="34" width="34" height="86"/>
    <rect x="146" y="34" width="34" height="86"/>
    <rect x="82" y="22" width="36" height="98"/>
  </g>
  <g fill="#c9b6f2">
    <path d="M17 36 L37 6 L57 36 Z"/>
    <path d="M143 36 L163 6 L183 36 Z"/>
    <path d="M78 24 L100 -8 L122 24 Z"/>
  </g>
  <g fill="#f7a8c8">
    <path d="M37 6 L37 -4 L46 -1 L37 2 Z"/>
    <path d="M163 6 L163 -4 L172 -1 L163 2 Z"/>
  </g>
  <g fill="#bfe3f6" stroke="#efc3d6" stroke-width="1">
    <path d="M31 60 a6 6 0 0 1 12 0 v12 h-12 Z"/>
    <path d="M157 60 a6 6 0 0 1 12 0 v12 h-12 Z"/>
    <path d="M94 44 a6 6 0 0 1 12 0 v12 h-12 Z"/>
    <path d="M60 70 a5 5 0 0 1 10 0 v10 h-10 Z"/>
    <path d="M130 70 a5 5 0 0 1 10 0 v10 h-10 Z"/>
  </g>
  <path d="M88 120 v-26 a12 12 0 0 1 24 0 v26 Z" fill="#e8b98f" stroke="#d29d72" stroke-width="1.2"/>
  <circle cx="100" cy="35" r="5" fill="#ffd36e"/>
</svg>`;
}
