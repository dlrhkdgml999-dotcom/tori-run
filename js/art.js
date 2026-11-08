/* 토리의 반짝 달리기 — 그림 (모두 직접 그린 SVG) */
'use strict';
const ART = (() => {
  const OL = '#6e5363';            // 테두리
  const SW = 3.6;                  // 테두리 굵기
  const FURS = {
    white:    { name: '하얀 털',   f: '#fffaf6', s: '#f2e1e7', price: 0 },
    pink:     { name: '분홍 털',   f: '#ffd6e4', s: '#f4bcd0', price: 30 },
    sky:      { name: '하늘 털',   f: '#d3e9ff', s: '#b6d6fa', price: 30 },
    mint:     { name: '민트 털',   f: '#cdf3e2', s: '#a9e3c8', price: 35 },
    lemon:    { name: '레몬 털',   f: '#fff0b0', s: '#f2d97e', price: 40 },
    lavender: { name: '보라 털',   f: '#e6dbff', s: '#cdbdf5', price: 45 },
    choco:    { name: '초코 털',   f: '#ecd3bd', s: '#d6b394', price: 50 },
  };

  let uidN = 0;
  const uid = () => 't' + (++uidN);

  const st = (fill, extra = '') => `fill="${fill}" stroke="${OL}" ${/stroke-width=/.test(extra) ? '' : `stroke-width="${SW}" `}stroke-linejoin="round" stroke-linecap="round" ${extra}`;
  const star = (cx, cy, r, fill, rot = 0, sw = 2.2) => {
    let p = '';
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2 + rot;
      const rr = i % 2 ? r * 0.48 : r;
      p += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
    }
    return `<path d="${p}Z" fill="${fill}" stroke="${OL}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  };
  const heart = (cx, cy, s, fill, sw = 2.2) =>
    `<path d="M${cx} ${cy + s * 0.9} C${cx - s * 1.4} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.1} ${cx} ${cy - s * 0.35} C${cx + s * 0.7} ${cy - s * 1.1} ${cx + s * 1.4} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z" fill="${fill}" stroke="${OL}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const sparkle = (cx, cy, r, fill = '#fff') =>
    `<path d="M${cx} ${cy - r} Q${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy} Q${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r} Q${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy} Q${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r}Z" fill="${fill}"/>`;
  const flower = (cx, cy, r, petal, mid = '#ffe066') => {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
      s += `<circle cx="${(cx + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.62).toFixed(1)}" r="${(r * 0.52).toFixed(1)}" fill="${petal}" stroke="${OL}" stroke-width="2"/>`;
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.38).toFixed(1)}" fill="${mid}" stroke="${OL}" stroke-width="2"/>`;
  };

  /* ---------- 옷 목록 ----------
     cat: hat(머리) cloth(옷) face(얼굴) shoes(신발) back(등)
     price: 당근 값, special: 선물 상자에서만 */
  const ITEMS = [
    // 머리
    { id: 'ribbon', cat: 'hat', name: '분홍 리본', price: 12 },
    { id: 'flowercrown', cat: 'hat', name: '꽃 화관', price: 30 },
    { id: 'strawberry', cat: 'hat', name: '딸기 모자', price: 45 },
    { id: 'starband', cat: 'hat', name: '별 머리띠', price: 55 },
    { id: 'crown', cat: 'hat', name: '황금 왕관', price: 80 },
    { id: 'wizard', cat: 'hat', name: '마법사 모자', price: 110 },
    { id: 'tiara', cat: 'hat', name: '공주 티아라', special: true },
    { id: 'unicorn', cat: 'hat', name: '유니콘 뿔', special: true },
    // 옷
    { id: 'stripe', cat: 'cloth', name: '줄무늬 티', price: 15 },
    { id: 'overall', cat: 'cloth', name: '멜빵 바지', price: 35 },
    { id: 'raincoat', cat: 'cloth', name: '노란 우비', price: 50 },
    { id: 'dress', cat: 'cloth', name: '분홍 원피스', price: 55 },
    { id: 'sailor', cat: 'cloth', name: '세일러복', price: 70 },
    { id: 'princess', cat: 'cloth', name: '공주 드레스', price: 130 },
    { id: 'sparkledress', cat: 'cloth', name: '반짝 별 드레스', special: true },
    // 얼굴
    { id: 'heartcheeks', cat: 'face', name: '하트 볼터치', price: 10 },
    { id: 'starsticker', cat: 'face', name: '별 스티커', price: 15 },
    { id: 'glasses', cat: 'face', name: '동그란 안경', price: 25 },
    { id: 'mustache', cat: 'face', name: '멋쟁이 콧수염', price: 30 },
    { id: 'sunglasses', cat: 'face', name: '선글라스', price: 45 },
    { id: 'heartglasses', cat: 'face', name: '하트 안경', special: true },
    // 신발
    { id: 'sneakers', cat: 'shoes', name: '빨간 운동화', price: 15 },
    { id: 'boots', cat: 'shoes', name: '노란 장화', price: 30 },
    { id: 'shiny', cat: 'shoes', name: '반짝 구두', price: 50 },
    { id: 'roller', cat: 'shoes', name: '롤러스케이트', price: 90 },
    { id: 'cloudshoes', cat: 'shoes', name: '구름 신발', special: true },
    // 등
    { id: 'backpack', cat: 'back', name: '꼬마 가방', price: 20 },
    { id: 'balloon', cat: 'back', name: '하트 풍선', price: 40 },
    { id: 'cape', cat: 'back', name: '빨간 망토', price: 60 },
    { id: 'wings', cat: 'back', name: '나비 날개', price: 100 },
    { id: 'rainbowcape', cat: 'back', name: '무지개 망토', special: true },
    { id: 'fairywings', cat: 'back', name: '요정 날개', special: true },
  ];
  const CATS = [
    { id: 'hat', name: '머리', icon: '👑' },
    { id: 'cloth', name: '옷', icon: '👗' },
    { id: 'face', name: '얼굴', icon: '😎' },
    { id: 'shoes', name: '신발', icon: '👟' },
    { id: 'back', name: '등', icon: '🎈' },
    { id: 'fur', name: '털 색', icon: '🎨' },
  ];

  /* ---------- 자세 ---------- */
  const POSE = {
    stand: { L: [82, 236, 0], R: [118, 236, 0], aL: 18, aR: -18, ay: 0 },
    run0:  { L: [72, 230, -22], R: [124, 238, 8], aL: -28, aR: 30, ay: 0 },
    run1:  { L: [82, 238, 8], R: [130, 230, -22], aL: 30, aR: -28, ay: 0 },
    jump:  { L: [84, 226, -18], R: [118, 224, -18], aL: 60, aR: -60, ay: -12 },
    cheer: { L: [82, 236, 0], R: [118, 236, 0], aL: 120, aR: -120, ay: -18 },
  };

  /* ---------- 등 (몸 뒤) ---------- */
  function backLayer(id) {
    switch (id) {
      case 'backpack':
        return `<rect x="34" y="168" width="40" height="50" rx="14" ${st('#7ec8a9')}/><rect x="40" y="190" width="28" height="18" rx="7" ${st('#a6e0c6')}/><circle cx="54" cy="199" r="3" fill="${OL}"/>`;
      case 'cape':
        return `<path d="M78 172 Q60 200 26 238 Q60 246 96 236 Q120 200 122 172Z" ${st('#ff6b7a')}/><path d="M40 232 Q62 236 86 230" fill="none" stroke="#ffb3bb" stroke-width="4" stroke-linecap="round"/>`;
      case 'rainbowcape': {
        const cols = ['#ff8fa3', '#ffc078', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'];
        let s = `<path id="rc" d="M78 172 Q58 202 22 240 Q60 250 98 238 Q120 200 122 172Z" ${st('#fff')}/>`;
        s += `<clipPath id="rcc"><path d="M78 172 Q58 202 22 240 Q60 250 98 238 Q120 200 122 172Z"/></clipPath><g clip-path="url(#rcc)">`;
        cols.forEach((c, i) => { s += `<rect x="0" y="${172 + i * 13}" width="140" height="14" fill="${c}"/>`; });
        s += `</g><path d="M78 172 Q58 202 22 240 Q60 250 98 238 Q120 200 122 172Z" fill="none" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>`;
        return s + sparkle(44, 222, 7) + sparkle(70, 200, 5);
      }
      case 'wings':
        return `<g><ellipse cx="44" cy="170" rx="30" ry="36" transform="rotate(-25 44 170)" ${st('#ffc9de')}/><ellipse cx="50" cy="218" rx="22" ry="20" transform="rotate(20 50 218)" ${st('#ffe0ec')}/><circle cx="40" cy="164" r="7" fill="#ff8fb6"/><circle cx="52" cy="186" r="4" fill="#ff8fb6"/>
                <ellipse cx="156" cy="170" rx="30" ry="36" transform="rotate(25 156 170)" ${st('#ffc9de')}/><ellipse cx="150" cy="218" rx="22" ry="20" transform="rotate(-20 150 218)" ${st('#ffe0ec')}/><circle cx="160" cy="164" r="7" fill="#ff8fb6"/><circle cx="148" cy="186" r="4" fill="#ff8fb6"/></g>`;
      case 'fairywings':
        return `<g opacity="0.92"><path d="M96 182 Q40 120 18 150 Q10 196 92 196Z" ${st('#c5f6fa', 'fill-opacity="0.85"')}/><path d="M96 196 Q40 210 36 236 Q60 250 96 204Z" ${st('#d0ebff', 'fill-opacity="0.85"')}/>
                <path d="M104 182 Q160 120 182 150 Q190 196 108 196Z" ${st('#c5f6fa', 'fill-opacity="0.85"')}/><path d="M104 196 Q160 210 164 236 Q140 250 104 204Z" ${st('#d0ebff', 'fill-opacity="0.85"')}/></g>`
          + sparkle(34, 150, 8) + sparkle(168, 152, 8) + sparkle(50, 226, 5) + sparkle(152, 226, 5);
      case 'balloon':
        return `<path d="M140 200 Q158 150 166 96" fill="none" stroke="${OL}" stroke-width="2.4"/>` + heart(168, 74, 26, '#ff6b8b', 3) + `<ellipse cx="158" cy="62" rx="6" ry="9" fill="#fff" opacity=".6" transform="rotate(-30 158 62)"/>`;
    }
    return '';
  }

  /* ---------- 옷 (몸 안, 잘라서) ---------- */
  function clothClip(id) {
    switch (id) {
      case 'stripe': {
        let s = `<rect x="50" y="160" width="100" height="90" fill="#fff"/>`;
        for (let y = 170; y < 240; y += 14) s += `<rect x="50" y="${y}" width="100" height="7" fill="#8ec5ff"/>`;
        return s;
      }
      case 'overall':
        return `<rect x="50" y="160" width="100" height="90" fill="#ffe28a"/><rect x="50" y="200" width="100" height="50" fill="#8fb3e8"/><rect x="80" y="182" width="40" height="24" rx="4" fill="#8fb3e8" stroke="${OL}" stroke-width="2.4"/>
                <path d="M84 182 L76 166 M116 182 L124 166" stroke="#6f93cc" stroke-width="7" stroke-linecap="round"/><circle cx="85" cy="186" r="3.4" fill="#ffe28a" stroke="${OL}" stroke-width="1.6"/><circle cx="115" cy="186" r="3.4" fill="#ffe28a" stroke="${OL}" stroke-width="1.6"/>`;
      case 'raincoat':
        return `<rect x="50" y="160" width="100" height="90" fill="#ffd43b"/><path d="M100 164 V240" stroke="#f0b400" stroke-width="3"/><circle cx="108" cy="186" r="3.6" fill="#fff" stroke="${OL}" stroke-width="1.6"/><circle cx="108" cy="204" r="3.6" fill="#fff" stroke="${OL}" stroke-width="1.6"/><circle cx="108" cy="222" r="3.6" fill="#fff" stroke="${OL}" stroke-width="1.6"/>`;
      case 'dress':
        return `<rect x="50" y="160" width="100" height="90" fill="#ffb3cc"/><path d="M84 168 Q100 182 116 168" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="92" cy="190" r="3" fill="#fff"/><circle cx="108" cy="196" r="3" fill="#fff"/>`;
      case 'sailor':
        return `<rect x="50" y="160" width="100" height="90" fill="#fff"/><path d="M62 166 L100 196 L138 166 L138 160 L62 160Z" fill="#4c6ef5"/><path d="M68 170 L100 192 L132 170" fill="none" stroke="#fff" stroke-width="2.6"/><rect x="50" y="226" width="100" height="24" fill="#4c6ef5"/>`;
      case 'princess':
        return `<rect x="50" y="160" width="100" height="90" fill="#d0bfff"/><path d="M80 168 Q100 180 120 168" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` + sparkle(100, 192, 7, '#fff');
      case 'sparkledress':
        return `<rect x="50" y="160" width="100" height="90" fill="#91a7ff"/>` + sparkle(88, 186, 5) + sparkle(112, 194, 6);
    }
    return '';
  }
  /* 치마 (발 앞) */
  function clothOver(id) {
    switch (id) {
      case 'dress':
        return `<path d="M62 206 Q100 214 138 206 L150 236 Q140 244 130 236 Q120 244 110 236 Q100 244 90 236 Q80 244 70 236 Q60 244 50 236Z" ${st('#ff9fbf')}/><circle cx="76" cy="226" r="3" fill="#fff"/><circle cx="100" cy="228" r="3" fill="#fff"/><circle cx="124" cy="226" r="3" fill="#fff"/>`;
      case 'princess':
        return `<path d="M64 204 Q100 214 136 204 L158 240 Q100 254 42 240Z" ${st('#ffc2dd')}/><path d="M50 234 Q60 226 70 236 Q80 226 90 238 Q100 228 110 238 Q120 226 130 236 Q140 226 150 234" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` + sparkle(72, 218, 5, '#fff') + sparkle(126, 220, 5, '#fff') + sparkle(100, 224, 4, '#fff');
      case 'sparkledress': {
        let s = `<defs><linearGradient id="sdg" x1="0" x2="1"><stop offset="0" stop-color="#a5d8ff"/><stop offset=".5" stop-color="#d0bfff"/><stop offset="1" stop-color="#ffc9de"/></linearGradient></defs>`;
        s += `<path d="M64 204 Q100 214 136 204 L156 240 Q100 254 44 240Z" ${st('url(#sdg)')}/>`;
        return s + star(70, 228, 7, '#ffe066') + star(100, 234, 6, '#fff') + star(130, 226, 7, '#ffe066') + sparkle(86, 216, 4) + sparkle(116, 214, 4);
      }
      case 'raincoat':
        return `<path d="M60 222 Q100 236 140 222 L142 232 Q100 248 58 232Z" ${st('#ffd43b')}/>`;
    }
    return '';
  }

  /* ---------- 신발 ---------- */
  function foot(x, y, r, furF, shoe) {
    const g = (inner) => `<g transform="rotate(${r} ${x} ${y})">${inner}</g>`;
    switch (shoe) {
      case 'sneakers':
        return g(`<ellipse cx="${x + 2}" cy="${y}" rx="20" ry="12" ${st('#ff6b6b')}/><path d="M${x - 16} ${y + 6} Q${x + 2} ${y + 12} ${x + 20} ${y + 5}" fill="none" stroke="#fff" stroke-width="4"/><path d="M${x - 4} ${y - 8} l6 4 M${x + 4} ${y - 9} l6 4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`);
      case 'boots':
        return g(`<path d="M${x - 14} ${y - 18} h22 v14 q14 0 14 10 q0 8 -10 8 h-28 q-6 0 -6 -6Z" ${st('#ffd43b')}/>`);
      case 'shiny':
        return g(`<ellipse cx="${x + 2}" cy="${y}" rx="19" ry="11" ${st('#b197fc')}/><circle cx="${x + 2}" cy="${y - 7}" r="4" fill="#ffe066" stroke="${OL}" stroke-width="1.6"/>` + sparkle(x + 12, y - 2, 4));
      case 'roller':
        return g(`<path d="M${x - 14} ${y - 14} h18 q16 0 16 12 v4 h-36Z" ${st('#ff8fb6')}/><rect x="${x - 16}" y="${y + 1}" width="38" height="5" rx="2" fill="${OL}"/><circle cx="${x - 9}" cy="${y + 10}" r="5" ${st('#ffe066', '')}/><circle cx="${x + 15}" cy="${y + 10}" r="5" ${st('#ffe066', '')}/>`);
      case 'cloudshoes':
        return g(`<circle cx="${x - 10}" cy="${y + 2}" r="9" ${st('#fff')}/><circle cx="${x + 2}" cy="${y - 4}" r="11" ${st('#fff')}/><circle cx="${x + 14}" cy="${y + 2}" r="9" ${st('#fff')}/><path d="M${x - 16} ${y + 6} h34" stroke="#fff" stroke-width="8"/>` + sparkle(x + 20, y - 10, 4, '#a5d8ff'));
    }
    return g(`<ellipse cx="${x}" cy="${y}" rx="17" ry="10" ${st(furF)}/><path d="M${x + 6} ${y - 4} v6 M${x + 11} ${y - 3} v5" stroke="${OL}" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`);
  }

  /* ---------- 얼굴 ---------- */
  function eyes(expr) {
    const open = (x) => `<ellipse cx="${x}" cy="118" rx="7" ry="8.5" fill="${OL}"/><circle cx="${x + 2.4}" cy="114.5" r="2.8" fill="#fff"/><circle cx="${x - 2}" cy="121" r="1.2" fill="#fff"/>`;
    const smile = (x) => `<path d="M${x - 7} 120 Q${x} 110 ${x + 7} 120" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>`;
    switch (expr) {
      case 'happy': return smile(84) + smile(116);
      case 'wink': return open(84) + smile(116);
      case 'oops': return `<path d="M78 113 L90 121 L78 127" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M122 113 L110 121 L122 127" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'wow': return `<circle cx="84" cy="118" r="9" fill="${OL}"/><circle cx="116" cy="118" r="9" fill="${OL}"/>` + sparkle(87, 114, 4.5) + sparkle(119, 114, 4.5) + `<circle cx="81" cy="122" r="1.5" fill="#fff"/><circle cx="113" cy="122" r="1.5" fill="#fff"/>`;
    }
    return open(84) + open(116);
  }
  function mouth(expr) {
    if (expr === 'oops') return `<ellipse cx="100" cy="138" rx="5" ry="6" fill="#d9486a" stroke="${OL}" stroke-width="2.4"/>`;
    if (expr === 'happy' || expr === 'wow' || expr === 'wink')
      return `<path d="M91 132 Q100 148 109 132Z" fill="#ff7b9c" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>`;
    return `<path d="M92 133 Q96 139 100 133 Q104 139 108 133" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  function faceItem(id) {
    switch (id) {
      case 'glasses':
        return `<circle cx="84" cy="118" r="14" fill="#fff" fill-opacity=".25" stroke="#e8590c" stroke-width="3.4"/><circle cx="116" cy="118" r="14" fill="#fff" fill-opacity=".25" stroke="#e8590c" stroke-width="3.4"/><path d="M98 116 Q100 113 102 116" fill="none" stroke="#e8590c" stroke-width="3"/>`;
      case 'sunglasses':
        return `<rect x="68" y="108" width="30" height="20" rx="9" fill="#343a40" stroke="${OL}" stroke-width="2.4"/><rect x="102" y="108" width="30" height="20" rx="9" fill="#343a40" stroke="${OL}" stroke-width="2.4"/><path d="M98 114 h4" stroke="${OL}" stroke-width="3"/><path d="M74 113 l8 0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M108 113 l8 0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
      case 'heartglasses':
        return heart(84, 118, 13, '#ff8fb6', 2.6) + heart(116, 118, 13, '#ff8fb6', 2.6) + `<path d="M97 114 Q100 111 103 114" fill="none" stroke="${OL}" stroke-width="2.6"/>` + sparkle(80, 112, 3.5) + sparkle(112, 112, 3.5);
      case 'mustache':
        return `<path d="M100 130 Q90 124 82 130 Q76 136 70 130 Q74 142 86 138 Q96 136 100 132 Q104 136 114 138 Q126 142 130 130 Q124 136 118 130 Q110 124 100 130Z" fill="#8b5e3c" stroke="${OL}" stroke-width="2"/>`;
      case 'starsticker':
        return star(132, 134, 9, '#ffe066', 0.2, 2);
    }
    return '';
  }

  /* ---------- 머리 위 ---------- */
  function hatLayer(id) {
    switch (id) {
      case 'ribbon':
        return `<g transform="rotate(14 128 72)"><path d="M128 72 L108 60 Q102 72 108 84Z" ${st('#ff8fb6')}/><path d="M128 72 L148 60 Q154 72 148 84Z" ${st('#ff8fb6')}/><circle cx="128" cy="72" r="7" ${st('#ff6b9d')}/></g>`;
      case 'flowercrown': {
        let s = `<path d="M50 96 Q100 46 150 96" fill="none" stroke="#69db7c" stroke-width="5" stroke-linecap="round"/>`;
        const cols = ['#ffa8c5', '#fff3a3', '#b2f2bb', '#a5d8ff', '#ffa8c5'];
        [[54, 90], [72, 72], [100, 64], [128, 72], [146, 90]].forEach(([x, y], i) => { s += flower(x, y, 11, cols[i]); });
        return s;
      }
      case 'strawberry':
        return `<path d="M54 88 Q58 40 100 40 Q142 40 146 88 Q100 72 54 88Z" ${st('#ff6b6b')}/>` +
          [[76, 62], [92, 54], [110, 56], [126, 66], [86, 74], [116, 76], [100, 66]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.4" fill="#fff3bf"/>`).join('') +
          `<path d="M100 42 Q88 30 82 34 Q90 42 100 42 Q110 42 118 34 Q112 30 100 42Z" ${st('#51cf66')}/><path d="M100 42 V28" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
      case 'starband':
        return `<path d="M52 96 Q100 50 148 96" fill="none" stroke="#ffd43b" stroke-width="7" stroke-linecap="round"/><path d="M78 66 Q72 50 76 34 M122 66 Q128 50 124 34" fill="none" stroke="${OL}" stroke-width="2.4"/>` + star(76, 30, 12, '#ffe066') + star(124, 30, 12, '#ffe066');
      case 'crown':
        return `<path d="M68 76 L64 40 L82 56 L100 32 L118 56 L136 40 L132 76Z" ${st('#ffd43b')}/><circle cx="100" cy="62" r="5" fill="#ff6b8b" stroke="${OL}" stroke-width="2"/><circle cx="80" cy="66" r="3.6" fill="#74c0fc"/><circle cx="120" cy="66" r="3.6" fill="#74c0fc"/>` + sparkle(110, 46, 4);
      case 'wizard':
        return `<path d="M64 80 Q100 70 136 80 L112 6 Q106 0 102 8Z" ${st('#9775fa')}/><ellipse cx="100" cy="80" rx="46" ry="11" ${st('#845ef7')}/>` + star(104, 44, 9, '#ffe066') + sparkle(90, 62, 4) + sparkle(120, 58, 4) + `<circle cx="108" cy="8" r="6" fill="#ffe066" stroke="${OL}" stroke-width="2"/>`;
      case 'tiara':
        return `<path d="M64 80 Q100 60 136 80 L128 62 L116 70 L100 42 L84 70 L72 62Z" ${st('#e9ecef')}/><path d="M100 50 l7 12 l-7 10 l-7 -10Z" fill="#ff6b9d" stroke="${OL}" stroke-width="2"/><circle cx="76" cy="70" r="3.4" fill="#74c0fc"/><circle cx="124" cy="70" r="3.4" fill="#74c0fc"/>` + sparkle(112, 52, 5) + sparkle(86, 54, 4);
      case 'unicorn':
        return `<path d="M88 66 L104 8 L116 66Z" ${st('#ffe066')}/><path d="M92 54 L112 46 M95 40 L110 34 M99 26 L107 22" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>` + flower(72, 76, 10, '#ffc9de') + flower(130, 76, 10, '#d0bfff') + sparkle(126, 30, 6, '#fff');
    }
    return '';
  }

  /* ---------- 토리 ----------
     look: {fur, hat, cloth, face, shoes, back}
     pose: stand run0 run1 jump cheer, expr: normal happy oops wow wink */
  function tori(look = {}, pose = 'stand', expr = 'normal') {
    const F = FURS[look.fur] || FURS.white;
    const P = POSE[pose] || POSE.stand;
    const id = uid();
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260">`;
    s += backLayer(look.back);
    // 꼬리
    s += `<circle cx="56" cy="214" r="13" ${st('#fff')}/>`;
    // 몸
    s += `<ellipse cx="100" cy="202" rx="42" ry="37" ${st(F.f)}/>`;
    s += `<clipPath id="${id}b"><ellipse cx="100" cy="202" rx="40" ry="35"/></clipPath>`;
    s += `<ellipse cx="100" cy="210" rx="25" ry="22" fill="#fff" opacity=".75" clip-path="url(#${id}b)"/>`;
    if (look.cloth) s += `<g clip-path="url(#${id}b)">${clothClip(look.cloth)}</g><ellipse cx="100" cy="202" rx="42" ry="37" fill="none" stroke="${OL}" stroke-width="${SW}"/>`;
    // 발
    s += foot(P.L[0], P.L[1], P.L[2], F.f, look.shoes) + foot(P.R[0], P.R[1], P.R[2], F.f, look.shoes);
    s += clothOver(look.cloth);
    // 팔
    const armFill = ['raincoat', 'sailor', 'princess', 'sparkledress', 'stripe', 'overall', 'dress'].includes(look.cloth)
      ? ({ raincoat: '#ffd43b', sailor: '#fff', princess: '#d0bfff', sparkledress: '#91a7ff', stripe: '#fff', overall: '#ffe28a', dress: '#ffb3cc' })[look.cloth] : F.f;
    s += `<ellipse cx="64" cy="${194 + P.ay}" rx="10" ry="15" transform="rotate(${P.aL} 66 ${182 + P.ay})" ${st(armFill)}/>`;
    s += `<ellipse cx="136" cy="${194 + P.ay}" rx="10" ry="15" transform="rotate(${P.aR} 134 ${182 + P.ay})" ${st(armFill)}/>`;
    // 귀
    s += `<g transform="rotate(-12 82 84)"><ellipse cx="82" cy="46" rx="16" ry="42" ${st(F.f)}/><ellipse cx="82" cy="50" rx="7.5" ry="29" fill="#ffb3c9"/></g>`;
    s += `<g transform="rotate(16 120 84)"><ellipse cx="120" cy="46" rx="16" ry="42" ${st(F.f)}/><ellipse cx="120" cy="50" rx="7.5" ry="29" fill="#ffb3c9"/></g>`;
    // 머리
    s += `<ellipse cx="100" cy="118" rx="58" ry="52" ${st(F.f)}/>`;
    s += `<ellipse cx="80" cy="96" rx="14" ry="8" fill="#fff" opacity=".55" transform="rotate(-20 80 96)"/>`;
    // 볼
    if (look.face === 'heartcheeks') s += heart(70, 134, 8, '#ff9cbc', 1.6) + heart(130, 134, 8, '#ff9cbc', 1.6);
    else s += `<ellipse cx="70" cy="134" rx="10" ry="6.5" fill="#ffadc6" opacity=".85"/><ellipse cx="130" cy="134" rx="10" ry="6.5" fill="#ffadc6" opacity=".85"/>`;
    s += eyes(expr);
    s += `<path d="M96 126 Q100 124 104 126 Q100 131 96 126Z" fill="#ff8fab" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += mouth(expr);
    s += faceItem(look.face);
    s += hatLayer(look.hat);
    return s + `</svg>`;
  }

  /* ---------- 친구들 ---------- */
  const FRIENDS = [
    { id: 'piyo',   name: '삐약이',  kind: '병아리' },
    { id: 'dara',   name: '도토리',  kind: '다람쥐' },
    { id: 'gomi',   name: '꿀곰이',  kind: '아기곰' },
    { id: 'pengi',  name: '펭펭이',  kind: '펭귄' },
    { id: 'nyang',  name: '귤냥이',  kind: '고양이' },
    { id: 'mung',   name: '몽몽이',  kind: '강아지' },
    { id: 'yoyo',   name: '여울이',  kind: '아기 여우' },
    { id: 'hami',   name: '볼볼이',  kind: '햄스터' },
    { id: 'kkul',   name: '꿀꿀이',  kind: '아기 돼지' },
    { id: 'gaegul', name: '개굴이',  kind: '개구리' },
    { id: 'pan',    name: '판순이',  kind: '판다' },
    { id: 'mae',    name: '몽글이',  kind: '아기 양' },
  ];
  const TOPPERS = [
    { id: '', name: '없음' },
    { id: 'ribbon', name: '리본' },
    { id: 'flower', name: '꽃' },
    { id: 'crown', name: '왕관' },
    { id: 'party', name: '고깔' },
  ];
  function topper(id, x, y) {
    switch (id) {
      case 'ribbon': return `<path d="M${x} ${y} L${x - 14} ${y - 9} Q${x - 18} ${y} ${x - 14} ${y + 9}Z" ${st('#ff8fb6', 'stroke-width="2.4"')}/><path d="M${x} ${y} L${x + 14} ${y - 9} Q${x + 18} ${y} ${x + 14} ${y + 9}Z" ${st('#ff8fb6', 'stroke-width="2.4"')}/><circle cx="${x}" cy="${y}" r="5" fill="#ff6b9d" stroke="${OL}" stroke-width="2"/>`;
      case 'flower': return flower(x, y, 10, '#ffc9de');
      case 'crown': return `<path d="M${x - 14} ${y + 6} L${x - 16} ${y - 12} L${x - 7} ${y - 4} L${x} ${y - 16} L${x + 7} ${y - 4} L${x + 16} ${y - 12} L${x + 14} ${y + 6}Z" ${st('#ffd43b', 'stroke-width="2.4"')}/>`;
      case 'party': return `<path d="M${x - 12} ${y + 6} L${x} ${y - 22} L${x + 12} ${y + 6}Z" ${st('#74c0fc', 'stroke-width="2.4"')}/><circle cx="${x}" cy="${y - 22}" r="4" fill="#ffe066" stroke="${OL}" stroke-width="2"/><path d="M${x - 6} ${y - 4} l4 -2 M${x + 2} ${y - 10} l4 -2" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
    }
    return '';
  }
  function fEyes(xl, xr, y, r = 4.6) {
    return `<ellipse cx="${xl}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${OL}"/><circle cx="${xl + 1.6}" cy="${y - 2}" r="1.7" fill="#fff"/><ellipse cx="${xr}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${OL}"/><circle cx="${xr + 1.6}" cy="${y - 2}" r="1.7" fill="#fff"/>`;
  }
  const fBlush = (y = 70) => `<ellipse cx="38" cy="${y}" rx="7" ry="4.5" fill="#ffadc6" opacity=".9"/><ellipse cx="82" cy="${y}" rx="7" ry="4.5" fill="#ffadc6" opacity=".9"/>`;
  const fSmile = (y = 72) => `<path d="M54 ${y} Q60 ${y + 6} 66 ${y}" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`;
  const fFeet = (c) => `<ellipse cx="46" cy="122" rx="11" ry="7" ${st(c, 'stroke-width="2.8"')}/><ellipse cx="74" cy="122" rx="11" ry="7" ${st(c, 'stroke-width="2.8"')}/>`;
  const fBody = (c, belly) => `<ellipse cx="60" cy="102" rx="27" ry="23" ${st(c, 'stroke-width="3"')}/>` + (belly ? `<ellipse cx="60" cy="106" rx="16" ry="14" fill="${belly}"/>` : '');
  function friend(fid, top = '', hop = false) {
    const sw3 = 'stroke-width="3"';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 134" width="120" height="134">`;
    let topY = 24;
    switch (fid) {
      case 'piyo':
        s += fFeet('#ffa94d') + fBody('#ffe066') + `<ellipse cx="34" cy="100" rx="8" ry="12" transform="rotate(30 34 100)" ${st('#ffe066', sw3)}/><ellipse cx="86" cy="100" rx="8" ry="12" transform="rotate(-30 86 100)" ${st('#ffe066', sw3)}/>`;
        s += `<circle cx="60" cy="58" r="33" ${st('#ffe066', sw3)}/><path d="M58 26 Q54 14 60 12 M62 26 Q66 14 72 16" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>`;
        s += fEyes(48, 72, 56) + fBlush(68) + `<path d="M54 64 L66 64 L60 72Z" fill="#ffa94d" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`;
        topY = 26; break;
      case 'dara':
        s += `<path d="M84 110 Q120 100 110 60 Q104 34 86 44 Q100 60 92 82 Q86 96 76 104Z" ${st('#c98f63', sw3)}/><path d="M96 54 Q104 70 96 90" fill="none" stroke="#e8c4a0" stroke-width="5" stroke-linecap="round"/>`;
        s += fFeet('#c98f63') + fBody('#d9a37a', '#f5e1cc');
        s += `<path d="M34 34 L36 14 L50 28Z" ${st('#d9a37a', sw3)}/><path d="M86 34 L84 14 L70 28Z" ${st('#d9a37a', sw3)}/>`;
        s += `<circle cx="60" cy="58" r="32" ${st('#d9a37a', sw3)}/><ellipse cx="60" cy="70" rx="17" ry="12" fill="#f5e1cc"/>`;
        s += fEyes(47, 73, 54) + fBlush(66) + `<ellipse cx="60" cy="64" rx="4" ry="3" fill="${OL}"/>` + fSmile(68);
        break;
      case 'gomi':
        s += fFeet('#b98557') + fBody('#c99a6e', '#f1dcc4');
        s += `<circle cx="32" cy="32" r="12" ${st('#c99a6e', sw3)}/><circle cx="32" cy="32" r="5.5" fill="#f1dcc4"/><circle cx="88" cy="32" r="12" ${st('#c99a6e', sw3)}/><circle cx="88" cy="32" r="5.5" fill="#f1dcc4"/>`;
        s += `<circle cx="60" cy="58" r="33" ${st('#c99a6e', sw3)}/><ellipse cx="60" cy="70" rx="15" ry="11" ${st('#f1dcc4', 'stroke-width="2"')}/>`;
        s += fEyes(46, 74, 54) + fBlush(66) + `<ellipse cx="60" cy="65" rx="5" ry="3.6" fill="${OL}"/>` + fSmile(70);
        break;
      case 'pengi':
        s += `<ellipse cx="46" cy="124" rx="11" ry="6" ${st('#ffa94d', 'stroke-width="2.6"')}/><ellipse cx="74" cy="124" rx="11" ry="6" ${st('#ffa94d', 'stroke-width="2.6"')}/>`;
        s += fBody('#5b6b8c', '#f8f9fa') + `<ellipse cx="32" cy="100" rx="7" ry="16" transform="rotate(20 32 100)" ${st('#5b6b8c', sw3)}/><ellipse cx="88" cy="100" rx="7" ry="16" transform="rotate(-20 88 100)" ${st('#5b6b8c', sw3)}/>`;
        s += `<circle cx="60" cy="58" r="33" ${st('#5b6b8c', sw3)}/><path d="M60 46 Q44 36 36 52 Q32 74 60 84 Q88 74 84 52 Q76 36 60 46Z" fill="#f8f9fa"/>`;
        s += fEyes(48, 72, 58) + fBlush(70) + `<path d="M53 66 L67 66 L60 74Z" fill="#ffa94d" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
        break;
      case 'nyang':
        s += `<path d="M86 112 Q112 110 108 82" fill="none" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M86 112 Q112 110 108 82" fill="none" stroke="#ffc285" stroke-width="7" stroke-linecap="round"/>`;
        s += fFeet('#ffc285') + fBody('#ffc285', '#fff4e6');
        s += `<path d="M30 40 L32 12 L54 28Z" ${st('#ffc285', sw3)}/><path d="M90 40 L88 12 L66 28Z" ${st('#ffc285', sw3)}/><path d="M35 34 L36 20 L46 28Z" fill="#ffb3c9"/><path d="M85 34 L84 20 L74 28Z" fill="#ffb3c9"/>`;
        s += `<circle cx="60" cy="58" r="33" ${st('#ffc285', sw3)}/><path d="M52 30 l2 8 M60 28 v9 M68 30 l-2 8" stroke="#f08c3a" stroke-width="3" stroke-linecap="round"/>`;
        s += fEyes(46, 74, 56) + fBlush(68) + `<path d="M57 63 h6 l-3 3Z" fill="#ff8fab" stroke="${OL}" stroke-width="1.6"/>` + `<path d="M54 68 Q57 72 60 68 Q63 72 66 68" fill="none" stroke="${OL}" stroke-width="2.2" stroke-linecap="round"/>`;
        s += `<path d="M30 62 h-12 M30 68 h-11 M90 62 h12 M90 68 h11" stroke="${OL}" stroke-width="1.8" stroke-linecap="round"/>`;
        break;
      case 'mung':
        s += fFeet('#fbe7c6') + fBody('#fbe7c6', '#fffaf0');
        s += `<circle cx="60" cy="58" r="33" ${st('#fbe7c6', sw3)}/>`;
        s += `<ellipse cx="28" cy="58" rx="11" ry="22" transform="rotate(14 28 58)" ${st('#c08a5b', sw3)}/><ellipse cx="92" cy="58" rx="11" ry="22" transform="rotate(-14 92 58)" ${st('#c08a5b', sw3)}/>`;
        s += `<ellipse cx="73" cy="52" rx="10" ry="9" fill="#e0b58a"/>` + fEyes(47, 73, 54) + fBlush(66) + `<ellipse cx="60" cy="64" rx="5" ry="3.6" fill="${OL}"/>` + `<path d="M56 72 Q60 80 64 72Z" fill="#ff8fab" stroke="${OL}" stroke-width="1.8"/>` + fSmile(68);
        break;
      case 'yoyo':
        s += `<path d="M84 108 Q118 110 112 74 Q100 92 82 96Z" ${st('#ffa45c', sw3)}/><path d="M112 74 Q108 86 100 90 Q112 92 112 74Z" fill="#fff"/>`;
        s += fFeet('#ffa45c') + fBody('#ffa45c', '#fff4e6');
        s += `<path d="M28 40 L28 8 L54 28Z" ${st('#ffa45c', sw3)}/><path d="M92 40 L92 8 L66 28Z" ${st('#ffa45c', sw3)}/><path d="M29 18 L29 10 L37 16Z" fill="${OL}"/><path d="M91 18 L91 10 L83 16Z" fill="${OL}"/>`;
        s += `<circle cx="60" cy="58" r="33" ${st('#ffa45c', sw3)}/><path d="M28 60 Q44 62 60 82 Q76 62 92 60 Q88 84 60 90 Q32 84 28 60Z" fill="#fff4e6"/>`;
        s += fEyes(46, 74, 54) + fBlush(66) + `<ellipse cx="60" cy="70" rx="4.5" ry="3.4" fill="${OL}"/>` + fSmile(74);
        break;
      case 'hami':
        s += fFeet('#f6d2a8') + fBody('#f6d2a8', '#fff8ef');
        s += `<circle cx="34" cy="30" r="9" ${st('#f6d2a8', sw3)}/><circle cx="34" cy="30" r="4" fill="#ffb3c9"/><circle cx="86" cy="30" r="9" ${st('#f6d2a8', sw3)}/><circle cx="86" cy="30" r="4" fill="#ffb3c9"/>`;
        s += `<ellipse cx="60" cy="60" rx="36" ry="32" ${st('#f6d2a8', sw3)}/><ellipse cx="38" cy="70" rx="13" ry="11" fill="#fff8ef"/><ellipse cx="82" cy="70" rx="13" ry="11" fill="#fff8ef"/><ellipse cx="60" cy="72" rx="9" ry="8" fill="#fff8ef"/>`;
        s += fEyes(47, 73, 56) + `<ellipse cx="38" cy="70" rx="6" ry="4" fill="#ffadc6"/><ellipse cx="82" cy="70" rx="6" ry="4" fill="#ffadc6"/>` + `<path d="M57 66 h6 l-3 3Z" fill="#ff8fab"/>` + `<path d="M55 71 Q57.5 74 60 71 Q62.5 74 65 71" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`;
        topY = 28; break;
      case 'kkul':
        s += fFeet('#ffb3c6') + fBody('#ffc4d3');
        s += `<path d="M30 40 L28 16 L50 30Z" ${st('#ffc4d3', sw3)}/><path d="M90 40 L92 16 L70 30Z" ${st('#ffc4d3', sw3)}/>`;
        s += `<circle cx="60" cy="58" r="33" ${st('#ffc4d3', sw3)}/><ellipse cx="60" cy="68" rx="13" ry="9" ${st('#ff9fb8', 'stroke-width="2.4"')}/><ellipse cx="55" cy="68" rx="2.6" ry="3.4" fill="${OL}"/><ellipse cx="65" cy="68" rx="2.6" ry="3.4" fill="${OL}"/>`;
        s += fEyes(45, 75, 52) + fBlush(64) + `<path d="M55 80 Q60 84 65 80" fill="none" stroke="${OL}" stroke-width="2.2" stroke-linecap="round"/>`;
        break;
      case 'gaegul':
        s += fFeet('#8ce99a') + fBody('#8ce99a', '#e6fcf5');
        s += `<ellipse cx="60" cy="64" rx="36" ry="28" ${st('#8ce99a', sw3)}/><circle cx="40" cy="38" r="14" ${st('#8ce99a', sw3)}/><circle cx="80" cy="38" r="14" ${st('#8ce99a', sw3)}/>`;
        s += `<circle cx="40" cy="38" r="8" fill="#fff"/><circle cx="80" cy="38" r="8" fill="#fff"/>` + fEyes(41, 81, 39, 4.6);
        s += fBlush(66) + `<path d="M42 70 Q60 86 78 70" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>`;
        topY = 22; break;
      case 'pan':
        s += fFeet('#495057') + fBody('#f8f9fa') + `<ellipse cx="34" cy="100" rx="8" ry="13" transform="rotate(30 34 100)" ${st('#495057', sw3)}/><ellipse cx="86" cy="100" rx="8" ry="13" transform="rotate(-30 86 100)" ${st('#495057', sw3)}/>`;
        s += `<circle cx="32" cy="32" r="12" ${st('#495057', sw3)}/><circle cx="88" cy="32" r="12" ${st('#495057', sw3)}/>`;
        s += `<circle cx="60" cy="58" r="33" ${st('#f8f9fa', sw3)}/><ellipse cx="45" cy="56" rx="9" ry="12" transform="rotate(30 45 56)" fill="#495057"/><ellipse cx="75" cy="56" rx="9" ry="12" transform="rotate(-30 75 56)" fill="#495057"/>`;
        s += `<circle cx="46" cy="55" r="4" fill="#fff"/><circle cx="74" cy="55" r="4" fill="#fff"/><circle cx="46.5" cy="55.5" r="2.4" fill="${OL}"/><circle cx="74.5" cy="55.5" r="2.4" fill="${OL}"/>`;
        s += fBlush(70) + `<ellipse cx="60" cy="66" rx="4.5" ry="3.2" fill="${OL}"/>` + fSmile(70);
        break;
      case 'mae':
        s += fFeet('#d8c3b0') + fBody('#ffffff');
        [[34, 40], [46, 28], [62, 24], [78, 28], [88, 42], [92, 60], [86, 78], [34, 78], [28, 60]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="14" ${st('#fff', sw3)}/>`; });
        s += `<circle cx="60" cy="56" r="30" fill="#fff"/><ellipse cx="60" cy="62" rx="22" ry="21" ${st('#ffe9d6', 'stroke-width="2.6"')}/>`;
        s += `<ellipse cx="34" cy="62" rx="10" ry="5" transform="rotate(-20 34 62)" ${st('#ffe9d6', 'stroke-width="2.4"')}/><ellipse cx="86" cy="62" rx="10" ry="5" transform="rotate(20 86 62)" ${st('#ffe9d6', 'stroke-width="2.4"')}/>`;
        s += fEyes(51, 69, 60, 3.8) + `<ellipse cx="46" cy="70" rx="5" ry="3" fill="#ffadc6"/><ellipse cx="74" cy="70" rx="5" ry="3" fill="#ffadc6"/>` + `<path d="M56 71 Q60 75 64 71" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`;
        topY = 16; break;
    }
    s += topper(top, 60, topY);
    return s + `</svg>`;
  }
  /* 실루엣 (아직 못 구한 친구) */
  function friendShadow(fid) {
    return friend(fid).replace(/fill="(?!none)[^"]*"/g, 'fill="#c9bfd6"').replace(new RegExp(`stroke="${OL}"`, 'g'), 'stroke="#b3a7c4"');
  }

  /* ---------- 선물 상자 · 당근 ---------- */
  const carrotSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 12 Q24 2 18 6 Q24 10 28 14 Q26 4 32 2 Q34 10 31 14 Q38 6 42 10 Q36 12 32 16Z" fill="#69db7c" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 18 Q30 12 40 18 Q40 34 30 56 Q20 34 20 18Z" fill="#ff922b" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M24 26 h6 M26 36 h5 M28 46 h3" stroke="#e8590c" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  function giftSVG(open = false) {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">`;
    s += `<rect x="24" y="70" width="112" height="78" rx="12" ${st('#ff8fb6')}/><rect x="70" y="70" width="20" height="78" fill="#ffe066" stroke="${OL}" stroke-width="3"/>`;
    const lid = `<rect x="16" y="50" width="128" height="28" rx="10" ${st('#ffa8c5')}/><rect x="70" y="50" width="20" height="28" fill="#ffe066" stroke="${OL}" stroke-width="3"/><path d="M80 50 Q56 18 46 34 Q44 48 80 50 Q116 48 114 34 Q104 18 80 50Z" ${st('#ffe066')}/>`;
    s += open ? `<g transform="translate(-10 -38) rotate(-18 80 64)">${lid}</g>` + sparkle(52, 60, 10) + sparkle(110, 56, 12) + sparkle(80, 40, 8) : lid;
    return s + `</svg>`;
  }

  /* ---------- 사진관 배경 ---------- */
  const BACKDROPS = [
    { id: 'meadow', name: '꽃밭' }, { id: 'forest', name: '숲속' }, { id: 'beach', name: '바닷가' },
    { id: 'rainbow', name: '무지개' }, { id: 'night', name: '밤하늘' }, { id: 'party', name: '생일 파티' },
    { id: 'snow', name: '눈 오는 날' }, { id: 'candy', name: '사탕 나라' },
  ];
  function backdrop(id, W = 1000, H = 600) {
    const g = H * 0.78;
    let s = '';
    const grad = (a, b) => `<defs><linearGradient id="bg_${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg_${id})"/>`;
    const cloud = (x, y, k = 1, c = '#fff') => `<g fill="${c}" opacity=".95"><circle cx="${x}" cy="${y}" r="${26 * k}"/><circle cx="${x + 30 * k}" cy="${y - 12 * k}" r="${32 * k}"/><circle cx="${x + 64 * k}" cy="${y}" r="${24 * k}"/><rect x="${x}" y="${y}" width="${64 * k}" height="${24 * k}"/></g>`;
    switch (id) {
      case 'meadow':
        s += grad('#bfe6ff', '#eaf7ff') + cloud(120, 110) + cloud(720, 80, 1.2) + `<circle cx="880" cy="100" r="46" fill="#ffe066"/>`;
        s += `<path d="M0 ${g - 60} Q250 ${g - 160} 520 ${g - 60} T${W} ${g - 80} V${H} H0Z" fill="#b2f2bb"/><rect y="${g}" width="${W}" height="${H - g}" fill="#8ce99a"/>`;
        for (let i = 0; i < 14; i++) s += flower(40 + i * 72, g + 30 + (i % 3) * 22, 11, ['#ffa8c5', '#fff3a3', '#d0bfff', '#a5d8ff'][i % 4]);
        break;
      case 'forest':
        s += grad('#d3f9d8', '#f4fce3');
        for (let i = 0; i < 8; i++) { const x = i * 140 + 20; s += `<rect x="${x + 38}" y="${g - 140}" width="24" height="150" fill="#a87b5a"/><circle cx="${x + 50}" cy="${g - 170}" r="70" fill="${i % 2 ? '#69db7c' : '#51cf66'}"/>`; }
        s += `<rect y="${g}" width="${W}" height="${H - g}" fill="#c0eb75"/>`;
        for (let i = 0; i < 10; i++) s += `<circle cx="${60 + i * 100}" cy="${g - 220 + (i % 4) * 40}" r="5" fill="#fff3a3" opacity=".9"/>`;
        break;
      case 'beach':
        s += grad('#ffe8cc', '#fff9db') + `<circle cx="820" cy="130" r="60" fill="#ffd43b"/>` + cloud(140, 100);
        s += `<rect y="${g - 120}" width="${W}" height="140" fill="#74c0fc"/><path d="M0 ${g - 110} Q50 ${g - 125} 100 ${g - 110} T200 ${g - 110} T300 ${g - 110} T400 ${g - 110} T500 ${g - 110} T600 ${g - 110} T700 ${g - 110} T800 ${g - 110} T900 ${g - 110} T1000 ${g - 110}" fill="none" stroke="#fff" stroke-width="6"/>`;
        s += `<rect y="${g}" width="${W}" height="${H - g}" fill="#ffe8a3"/>` + star(140, g + 50, 16, '#ff922b') + star(880, g + 60, 14, '#ff8fa3');
        break;
      case 'rainbow': {
        s += grad('#e5dbff', '#fff0f6');
        const cols = ['#ff8fa3', '#ffc078', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'];
        cols.forEach((c, i) => { s += `<path d="M${120 + i * 26} ${g} A${380 - i * 26} ${380 - i * 26} 0 0 1 ${880 - i * 26} ${g}" fill="none" stroke="${c}" stroke-width="26"/>`; });
        s += cloud(60, g - 40, 1.4) + cloud(820, g - 40, 1.4) + `<rect y="${g}" width="${W}" height="${H - g}" fill="#fcc2d7"/>`;
        break;
      }
      case 'night':
        s += grad('#364fc7', '#9775fa');
        for (let i = 0; i < 30; i++) s += star((i * 137) % W, (i * 71) % (g - 80) + 20, 4 + (i % 3) * 3, '#fff3a3', 0, 0);
        s += `<circle cx="820" cy="120" r="56" fill="#fff3bf"/><circle cx="845" cy="105" r="50" fill="#5f3dc4" opacity=".9"/>`;
        s += `<rect y="${g}" width="${W}" height="${H - g}" fill="#5c7cfa"/>`;
        break;
      case 'party':
        s += grad('#fff0f6', '#ffe3ec');
        for (let i = 0; i < 12; i++) s += `<path d="M${i * 90} 0 L${i * 90 + 45} 60 L${i * 90 + 90} 0Z" fill="${['#ff8fa3', '#ffe066', '#74c0fc', '#8ce99a'][i % 4]}"/>`;
        [[90, 200, '#ff8fa3'], [180, 150, '#74c0fc'], [830, 180, '#ffe066'], [920, 230, '#b197fc']].forEach(([x, y, c]) => { s += `<path d="M${x} ${y + 40} Q${x + 10} ${y + 120} ${x} ${g}" fill="none" stroke="${OL}" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="34" ry="42" fill="${c}"/>`; });
        s += `<rect y="${g}" width="${W}" height="${H - g}" fill="#fcc2d7"/>`;
        s += `<rect x="440" y="${g - 90}" width="120" height="90" rx="10" fill="#fff" stroke="${OL}" stroke-width="3"/><path d="M440 ${g - 70} Q470 ${g - 50} 500 ${g - 70} T560 ${g - 70}" fill="none" stroke="#ff8fb6" stroke-width="10"/>`;
        for (let i = 0; i < 3; i++) s += `<rect x="${468 + i * 26}" y="${g - 122}" width="8" height="32" fill="#74c0fc"/><ellipse cx="${472 + i * 26}" cy="${g - 128}" rx="5" ry="8" fill="#ffd43b"/>`;
        break;
      case 'snow':
        s += grad('#d0ebff', '#f8f9fa');
        s += `<path d="M0 ${g - 50} Q300 ${g - 170} 600 ${g - 40} T${W} ${g - 70} V${H} H0Z" fill="#fff"/><rect y="${g}" width="${W}" height="${H - g}" fill="#f1f3f5"/>`;
        for (let i = 0; i < 40; i++) s += `<circle cx="${(i * 89) % W}" cy="${(i * 53) % (g)}" r="${3 + (i % 3) * 2}" fill="#fff"/>`;
        s += `<circle cx="140" cy="${g - 30}" r="40" fill="#fff" stroke="#dee2e6" stroke-width="3"/><circle cx="140" cy="${g - 92}" r="28" fill="#fff" stroke="#dee2e6" stroke-width="3"/><circle cx="132" cy="${g - 96}" r="3" fill="${OL}"/><circle cx="148" cy="${g - 96}" r="3" fill="${OL}"/><path d="M140 ${g - 88} l14 4 l-14 3Z" fill="#ff922b"/>`;
        break;
      case 'candy':
        s += grad('#ffdeeb', '#fff0f6');
        [[100, 160], [300, 120], [700, 140], [900, 180]].forEach(([x, y], i) => { s += `<rect x="${x - 5}" y="${y}" width="10" height="${g - y}" fill="#fff" stroke="${OL}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="40" fill="${['#ff8fa3', '#74c0fc', '#8ce99a', '#ffe066'][i]}" stroke="${OL}" stroke-width="3"/><path d="M${x - 26} ${y} A26 26 0 0 1 ${x + 26} ${y}" fill="none" stroke="#fff" stroke-width="6"/>`; });
        s += `<rect y="${g}" width="${W}" height="${H - g}" fill="#f783ac"/>`;
        for (let i = 0; i < 12; i++) s += `<circle cx="${40 + i * 84}" cy="${g + 40 + (i % 2) * 30}" r="10" fill="${['#fff', '#ffe066', '#74c0fc'][i % 3]}"/>`;
        break;
    }
    return s;
  }

  const STICKERS = ['💖', '⭐', '🌸', '🎀', '🌈', '🦋', '🍓', '🎈', '✨', '🍭', '☁️', '🎵', '🥕', '👑', '🍰', '🌙'];

  /* 앱 아이콘 */
  function iconSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd6e7"/><stop offset="1" stop-color="#d0ebff"/></linearGradient></defs><rect width="512" height="512" fill="url(#ig)"/>` +
      `<g transform="translate(96 40) scale(1.6)">${tori({ fur: 'white', hat: 'ribbon' }, 'cheer', 'happy').replace(/<\/?svg[^>]*>/g, '')}</g>` + sparkle(80, 100, 26) + sparkle(430, 140, 20) + sparkle(420, 420, 16) + `</svg>`;
  }

  return { OL, FURS, ITEMS, CATS, FRIENDS, TOPPERS, BACKDROPS, STICKERS, tori, friend, friendShadow, carrotSVG, giftSVG, backdrop, iconSVG, star, heart, sparkle, flower };
})();
if (typeof module !== 'undefined') module.exports = ART;
