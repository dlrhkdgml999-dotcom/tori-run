/* 포포의 반짝 모험 — 여정 지도 (섬 4개, 포포가 길을 따라 걸어가요) */
'use strict';
const Journey = (() => {
  const VW = 4920, VH = 700;
  const WCOL = ['#74c0fc', '#69db7c', '#ffa94d', '#b197fc'];
  /* 칸: 월드마다 판 3개 + 보스 */
  const NODES = [];
  QS.WORLDS.forEach((wd, w) => {
    const x0 = 140 + w * 1130;
    [[110, 480], [370, 330], [630, 470], [900, 290]].forEach(([dx, y], k) => {
      NODES.push({ w, s: k < 3 ? k : 'b', x: x0 + dx, y, key: wd.id + (k < 3 ? k : 'b') });
    });
  });
  const S = () => Store.S;
  const cleared = (n) => (n.s === 'b' ? !!(S().boss || {})[n.w] : (S().stars[n.key] || 0) > 0);
  const open = (i) => i === 0 || cleared(NODES[i - 1]);
  const nextIdx = () => { const i = NODES.findIndex((n) => !cleared(n)); return i < 0 ? NODES.length - 1 : i; };

  function seg(a, b) {   // 두 칸 사이 곡선 (가운데를 살짝 띄움)
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 60;
    return { d: `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`, mx, my };
  }
  function pointOn(a, b, t) {
    const { mx, my } = seg(a, b);
    return { x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y };
  }

  /* 부드러운 섬 모양 (Catmull-Rom → 베지어) */
  function blob(cx, cy, rx, ry, seed, k = 1, dx = 0, dy = 0) {
    const n = 18, pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const r = 1 + 0.07 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 5 + seed * 2.1) + 0.03 * Math.sin(a * 7 + seed * 0.7);
      pts.push([cx + dx + Math.cos(a) * rx * r * k, cy + dy + Math.sin(a) * ry * r * k]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  const ISLE = [
    { g: ['#c9f5bd', '#8fdc8f'], name: '숫자 들판' }, { g: ['#b4ebb4', '#5fbf78'], name: '글자 숲' },
    { g: ['#fff6d6', '#ffe19a'], name: 'ABC 바닷가' }, { g: ['#f6ecff', '#d9c4ff'], name: '무지개 길' },
  ];
  const OLm = '#6e5363';
  function tree(x, y, k, c1, c2) {
    return `<ellipse cx="${x}" cy="${y + 4}" rx="${30 * k}" ry="${8 * k}" fill="#000" opacity=".1"/><rect x="${x - 6 * k}" y="${y - 50 * k}" width="${12 * k}" height="${52 * k}" rx="5" fill="#a87b5a"/>` +
      `<circle cx="${x}" cy="${y - 64 * k}" r="${34 * k}" fill="${c2}"/><circle cx="${x - 6 * k}" cy="${y - 72 * k}" r="${26 * k}" fill="${c1}"/><circle cx="${x - 14 * k}" cy="${y - 84 * k}" r="${9 * k}" fill="#fff" opacity=".35"/>`;
  }
  function pine(x, y, k, c1, c2) {
    return `<ellipse cx="${x}" cy="${y + 4}" rx="${24 * k}" ry="${7 * k}" fill="#000" opacity=".1"/><rect x="${x - 5 * k}" y="${y - 20 * k}" width="${10 * k}" height="${22 * k}" fill="#a87b5a"/>` +
      [0, 1, 2].map((i) => `<path d="M${x - (34 - i * 8) * k} ${y - (14 + i * 26) * k} L${x} ${y - (58 + i * 26) * k} L${x + (34 - i * 8) * k} ${y - (14 + i * 26) * k}Z" fill="${i % 2 ? c1 : c2}"/>`).join('');
  }
  function palm(x, y, k = 1) {
    let p = `<ellipse cx="${x}" cy="${y + 4}" rx="${30 * k}" ry="${7 * k}" fill="#000" opacity=".1"/><path d="M${x} ${y} Q${x + 14 * k} ${y - 60 * k} ${x + 6 * k} ${y - 120 * k}" fill="none" stroke="#c08a5b" stroke-width="${12 * k}" stroke-linecap="round"/>`;
    for (let i = 0; i < 6; i++) {
      const a = -2.9 + i * 0.68, cx = x + 6 * k + Math.cos(a) * 34 * k, cy = y - 120 * k + Math.sin(a) * 30 * k;
      p += `<ellipse cx="${cx}" cy="${cy}" rx="${40 * k}" ry="${11 * k}" transform="rotate(${a * 57} ${cx} ${cy})" fill="${i % 2 ? '#51cf66' : '#69db7c'}"/>`;
    }
    return p + `<circle cx="${x + 2 * k}" cy="${y - 114 * k}" r="${6 * k}" fill="#a87b5a"/><circle cx="${x + 12 * k}" cy="${y - 112 * k}" r="${6 * k}" fill="#a87b5a"/>`;
  }
  function flowers(x, y, cols) { return cols.map((c, i) => ART.flower(x + i * 22 - (cols.length - 1) * 11, y + (i % 2) * 10, 9, c)).join(''); }
  function ribbon(x, y, text, col) {
    const w = 46 + text.length * 30;
    return `<g><path d="M${x - w / 2 - 40} ${y + 8} l30 -6 v36 l-30 -6 l14 -12Z" fill="${col}" stroke="${OLm}" stroke-width="3" stroke-linejoin="round" filter="brightness(.9)"/><path d="M${x + w / 2 + 40} ${y + 8} l-30 -6 v36 l30 -6 l-14 -12Z" fill="${col}" stroke="${OLm}" stroke-width="3" stroke-linejoin="round"/>` +
      `<rect x="${x - w / 2 - 12}" y="${y - 10}" width="${w + 24}" height="50" rx="14" fill="${col}" stroke="${OLm}" stroke-width="3.4"/><rect x="${x - w / 2 - 4}" y="${y - 4}" width="${w + 8}" height="8" rx="4" fill="#fff" opacity=".35"/>` +
      `<text x="${x}" y="${y + 26}" text-anchor="middle" font-family="Jua, sans-serif" font-size="30" fill="#fff" stroke="${OLm}" stroke-width="5" paint-order="stroke">${text}</text></g>`;
  }
  function island(w) {
    const x0 = 140 + w * 1130, cx = x0 + 505, cy = 410, rx = 505, ry = 236, sd = w * 2.3 + 1;
    const I = ISLE[w];
    let s = `<defs><linearGradient id="ig${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${I.g[0]}"/><stop offset="1" stop-color="${I.g[1]}"/></linearGradient></defs>`;
    s += `<path d="${blob(cx, cy, rx, ry, sd, 1.16)}" fill="#c5f1ff" opacity=".7"/>`;
    s += `<path d="${blob(cx, cy, rx, ry, sd, 1.07)}" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="3 18" stroke-linecap="round" opacity=".9"/>`;
    s += `<path d="${blob(cx, cy, rx, ry, sd, 1.0, 0, 16)}" fill="#3f8fbf" opacity=".22"/>`;
    s += `<path d="${blob(cx, cy, rx, ry, sd, 1.02)}" fill="#ffeab8"/>`;
    s += `<path d="${blob(cx, cy, rx, ry, sd, 0.93, 0, -6)}" fill="url(#ig${w})"/>`;
    s += `<path d="${blob(cx, cy, rx, ry, sd, 0.62, -60, -60)}" fill="#fff" opacity=".14"/>`;
    // 풀 결
    for (let i = 0; i < 22; i++) {
      const gx = x0 + 80 + ((i * 173) % 860), gy = 250 + ((i * 97) % 300);
      s += `<path d="M${gx} ${gy} l5 -10 l5 10 M${gx + 12} ${gy + 2} l4 -8 l4 8" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" opacity=".08"/>`;
    }
    const D = [];
    if (w === 0) {
      [[x0 + 20, 400, 1], [x0 + 250, 260, 0.9], [x0 + 760, 600, 1.1], [x0 + 1010, 470, 0.9], [x0 + 480, 640, 0.8]].forEach(([x, y, k]) => D.push(tree(x, y, k, '#9be596', '#6fd17f')));
      D.push(flowers(x0 + 240, 590, ['#ffa8c5', '#fff3a3', '#d0bfff']) + flowers(x0 + 520, 230, ['#a5d8ff', '#ffa8c5']) + flowers(x0 + 1000, 330, ['#fff3a3', '#ffa8c5', '#ffffff']));
      // 풍차
      const mx = x0 + 760, my = 300;
      D.push(`<g><path d="M${mx - 26} ${my} L${mx - 16} ${my - 90} L${mx + 16} ${my - 90} L${mx + 26} ${my}Z" fill="#fff4e6" stroke="${OLm}" stroke-width="3"/><path d="M${mx - 22} ${my - 90} L${mx} ${my - 116} L${mx + 22} ${my - 90}Z" fill="#ff8fa3" stroke="${OLm}" stroke-width="3"/><rect x="${mx - 8}" y="${my - 30}" width="16" height="30" rx="8" fill="#ffd8a8" stroke="${OLm}" stroke-width="2"/><g class="mill" style="transform-origin:${mx}px ${my - 96}px">${[0, 1, 2, 3].map((i) => `<rect x="${mx - 6}" y="${my - 156}" width="12" height="60" rx="5" fill="#fff" stroke="${OLm}" stroke-width="2.6" transform="rotate(${i * 90} ${mx} ${my - 96})"/>`).join('')}<circle cx="${mx}" cy="${my - 96}" r="7" fill="#ffd43b" stroke="${OLm}" stroke-width="2.4"/></g></g>`);
    } else if (w === 1) {
      [[x0 + 30, 380, 1], [x0 + 230, 640, 0.9], [x0 + 520, 250, 0.8], [x0 + 800, 640, 1], [x0 + 1030, 480, 0.9]].forEach(([x, y, k], i) => D.push(i % 2 ? pine(x, y, k, '#51cf66', '#2f9e44') : tree(x, y, k, '#8ce99a', '#51cf66')));
      [[x0 + 600, 600], [x0 + 140, 300]].forEach(([x, y]) => D.push(pine(x, y, 0.8, '#69db7c', '#37b24d')));
      [[x0 + 470, 610], [x0 + 1000, 330]].forEach(([x, y]) => D.push(`<rect x="${x - 5}" y="${y - 18}" width="10" height="18" rx="4" fill="#fff4e6" stroke="${OLm}" stroke-width="2"/><path d="M${x - 18} ${y - 14} Q${x} ${y - 44} ${x + 18} ${y - 14}Z" fill="#ff6b6b" stroke="${OLm}" stroke-width="2.4"/><circle cx="${x - 6}" cy="${y - 26}" r="3.4" fill="#fff"/><circle cx="${x + 7}" cy="${y - 22}" r="3" fill="#fff"/>`));
    } else if (w === 2) {
      [[x0 + 60, 380], [x0 + 520, 640], [x0 + 1010, 440]].forEach(([x, y]) => D.push(palm(x, y)));
      const ux = x0 + 240, uy = 610;   // 파라솔
      D.push(`<path d="M${ux} ${uy} L${ux + 8} ${uy - 80}" stroke="${OLm}" stroke-width="4"/><path d="M${ux - 50} ${uy - 70} Q${ux + 8} ${uy - 130} ${ux + 66} ${uy - 70}Z" fill="#ff8fa3" stroke="${OLm}" stroke-width="3"/><path d="M${ux - 20} ${uy - 96} Q${ux + 8} ${uy - 130} ${ux + 8} ${uy - 70} M${ux + 36} ${uy - 96} Q${ux + 8} ${uy - 130} ${ux + 8} ${uy - 70}" fill="#fff" opacity=".8"/>`);
      D.push(ART.star(x0 + 320, 260, 16, '#ff922b') + ART.star(x0 + 820, 610, 13, '#ff8fa3') + `<ellipse cx="${x0 + 700}" cy="240" rx="16" ry="11" fill="#ffc9de" stroke="${OLm}" stroke-width="2.4"/>`);
    } else {
      const cols = ['#ffadc0', '#ffd8a8', '#fff3a3', '#c3fae8', '#a5d8ff', '#d0bfff'];
      cols.forEach((cc, i) => D.push(`<path d="M${x0 + 140 + i * 16} 470 A${370 - i * 16} ${320 - i * 16} 0 0 1 ${x0 + 880 - i * 16} 470" fill="none" stroke="${cc}" stroke-width="16" opacity=".75"/>`));
      [[x0 + 270, 650], [x0 + 560, 650], [x0 + 1040, 600]].forEach(([x, y], i) => D.push(`<rect x="${x - 4}" y="${y - 70}" width="8" height="70" fill="#fff" stroke="${OLm}" stroke-width="2"/><circle cx="${x}" cy="${y - 80}" r="24" fill="${['#ff8fa3', '#74c0fc', '#8ce99a'][i]}" stroke="${OLm}" stroke-width="3"/><path d="M${x - 14} ${y - 80} A14 14 0 0 1 ${x + 14} ${y - 80}" fill="none" stroke="#fff" stroke-width="5"/>`));
      const ccx = x0 + 900, ccy = 260;
      D.push(`<g transform="translate(${ccx} ${ccy})"><rect x="-90" y="-120" width="180" height="120" rx="10" fill="#fff0f6" stroke="${OLm}" stroke-width="4"/><rect x="-120" y="-170" width="50" height="170" rx="8" fill="#ffdeeb" stroke="${OLm}" stroke-width="4"/><rect x="70" y="-170" width="50" height="170" rx="8" fill="#ffdeeb" stroke="${OLm}" stroke-width="4"/><path d="M-125 -170 L-95 -215 L-65 -170Z M65 -170 L95 -215 L125 -170Z M-60 -120 L0 -185 L60 -120Z" fill="#b197fc" stroke="${OLm}" stroke-width="4" stroke-linejoin="round"/><rect x="-24" y="-60" width="48" height="60" rx="24" fill="#d0bfff" stroke="${OLm}" stroke-width="3"/><path d="M-95 -215 v-26 l20 8 l-20 8" fill="#ff8fb6" stroke="${OLm}" stroke-width="2"/><path d="M95 -215 v-26 l20 8 l-20 8" fill="#ffe066" stroke="${OLm}" stroke-width="2"/></g>`);
    }
    s += D.join('');
    s += ribbon(x0 + 160, 196, `${QS.WORLDS[w].icon} ${I.name}`, WCOL[w]);
    return s;
  }

  function svg() {
    const st = S();
    let s = `<svg class="jmap" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMinYMid meet">`;
    s += `<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0f7"/><stop offset=".6" stop-color="#63c0ef"/><stop offset="1" stop-color="#4fb0e6"/></linearGradient>
      <radialGradient id="seaLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      ${WCOL.map((c, i) => `<radialGradient id="ng${i}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${c}"/></radialGradient>`).join('')}</defs>
      <rect width="${VW}" height="${VH}" fill="url(#sea)"/>`;
    for (let i = 0; i < 9; i++) s += `<ellipse cx="${(i * 577 + 200) % VW}" cy="${120 + (i * 211) % 460}" rx="260" ry="110" fill="url(#seaLight)"/>`;
    for (let i = 0; i < 40; i++) s += `<path d="M${(i * 211) % VW} ${40 + (i * 97) % 640} q12 -7 24 0 q12 7 24 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>`;
    for (let i = 0; i < 18; i++) s += `<g class="glint" style="animation-delay:${(i * 0.37) % 3}s">${ART.sparkle((i * 293 + 90) % VW, 30 + (i * 151) % 650, 7, '#fff')}</g>`;
    // 나침반
    s += `<g transform="translate(64 640)" opacity=".85"><circle r="40" fill="#fff8e6" stroke="${OLm}" stroke-width="3"/><path d="M0 -34 L8 0 L0 34 L-8 0Z" fill="#ff8fa3" stroke="${OLm}" stroke-width="2"/><path d="M-34 0 L0 -8 L34 0 L0 8Z" fill="#a5d8ff" stroke="${OLm}" stroke-width="2"/><circle r="5" fill="${OLm}"/><text y="-44" text-anchor="middle" font-family="Jua, sans-serif" font-size="18" fill="${OLm}">N</text></g>`;
    // 바다 물고기 (가끔 퐁!)
    [[600, 650, 0], [1700, 120, 1.2], [2850, 660, 2.4], [3950, 110, 3.3], [1180, 300, 1.8], [3420, 330, 0.6]].forEach(([x, y, dl]) => {
      s += `<g class="fish" style="animation-delay:${dl}s"><ellipse cx="${x}" cy="${y}" rx="26" ry="16" fill="${['#ffa94d', '#ff8fa3', '#74c0fc'][Math.round(dl) % 3]}" stroke="#6e5363" stroke-width="3"/><path d="M${x + 22} ${y} l18 -12 v24Z" fill="${['#ffa94d', '#ff8fa3', '#74c0fc'][Math.round(dl) % 3]}" stroke="#6e5363" stroke-width="3" stroke-linejoin="round"/><circle cx="${x - 12}" cy="${y - 4}" r="3.4" fill="#6e5363"/></g>`;
    });
    for (let w = 0; w < 4; w++) s += island(w);
    // 오늘의 병 편지
    if (st.bottleDay !== today()) {
      const spots = [[480, 100], [1520, 92], [2620, 98], [3720, 92], [4840, 640]];
      const [bx, by] = spots[new Date().getDate() % spots.length];
      s += `<g class="bottle" data-a="bottle"><circle cx="${bx}" cy="${by}" r="58" fill="#fff" opacity=".001"/><ellipse cx="${bx}" cy="${by + 26}" rx="44" ry="10" fill="#fff" opacity=".6"/><rect x="${bx - 18}" y="${by - 34}" width="36" height="58" rx="14" fill="#c5f6fa" stroke="#6e5363" stroke-width="4"/><rect x="${bx - 8}" y="${by - 50}" width="16" height="18" rx="4" fill="#d08c60" stroke="#6e5363" stroke-width="3"/><rect x="${bx - 10}" y="${by - 16}" width="20" height="26" rx="3" fill="#fff3bf" stroke="#e8c36b" stroke-width="2" transform="rotate(-8 ${bx} ${by})"/><text x="${bx + 38}" y="${by - 30}" font-size="30">✨</text></g>`;
    }
    // 다리 (보스를 이기면 생겨요)
    for (let w = 0; w < 3; w++) {
      const a = NODES[w * 4 + 3], b = NODES[w * 4 + 4];
      const ok = cleared(a);
      const d = seg(a, b).d;
      s += `<g opacity="${ok ? 1 : 0.4}"><path d="${d}" fill="none" stroke="#000" stroke-width="40" stroke-linecap="round" opacity=".12" transform="translate(0 12)"/><path d="${d}" fill="none" stroke="#8c6242" stroke-width="40" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#e8c39e" stroke-width="32" stroke-dasharray="14 5" stroke-linecap="butt"/><path d="${d}" fill="none" stroke="#c99b72" stroke-width="3" transform="translate(0 -20)"/><path d="${d}" fill="none" stroke="#c99b72" stroke-width="3" transform="translate(0 20)"/></g>`;
    }
    // 보너스 길 (보스를 이긴 섬마다, 하루 한 번)
    for (let w = 0; w < 4; w++) {
      if (!(st.boss || {})[w]) continue;
      const a = NODES[w * 4 + 3], b = NODES[w * 4 + 4] || { x: a.x + 300, y: a.y + 260 };
      const p = w < 3 ? pointOn(a, b, 0.5) : { x: a.x + 190, y: a.y + 330 };
      const done = st.bonusDay === today();
      s += `<g class="bonusSign ${done ? 'done' : ''}" data-a="bonusRun" data-w="${w}" style="cursor:pointer"><rect x="${p.x - 70}" y="${p.y - 96}" width="140" height="66" rx="18" fill="${done ? '#e9ecef' : '#fff3bf'}" stroke="#6e5363" stroke-width="4"/><text x="${p.x}" y="${p.y - 70}" text-anchor="middle" font-size="24" font-family="Jua, sans-serif" fill="#6e5363">🎁 보너스</text><text x="${p.x}" y="${p.y - 42}" text-anchor="middle" font-size="20" font-family="Jua, sans-serif" fill="${done ? '#adb5bd' : '#f08c00'}">${done ? '내일 또!' : '당근 비 🥕'}</text><rect x="${p.x - 5}" y="${p.y - 30}" width="10" height="34" fill="#a87b5a"/></g>`;
    }
    // 길
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i], b = NODES[i + 1];
      if (a.w !== b.w) continue;
      const done = cleared(a);
      const d = seg(a, b).d;
      s += `<path d="${d}" fill="none" stroke="#000" stroke-width="22" stroke-linecap="round" stroke-dasharray="1 30" opacity=".1" transform="translate(0 5)"/>`;
      s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-dasharray="1 30" opacity="${done ? 1 : 0.75}"/>`;
      if (done) s += `<path d="${d}" fill="none" stroke="#ffd43b" stroke-width="11" stroke-linecap="round" stroke-dasharray="1 30"/>`;
    }
    // 칸
    const nx = nextIdx();
    NODES.forEach((n, i) => {
      const op = open(i), dn = cleared(n);
      const col = WCOL[n.w];
      if (n.s === 'b') {
        const won = !!(st.boss || {})[n.w];
        s += `<g class="node ${op ? '' : 'lock'} ${i === nx ? 'next' : ''}" data-a="node" data-i="${i}" style="cursor:pointer">`;
        s += `<ellipse cx="${n.x}" cy="${n.y + 40}" rx="96" ry="26" fill="${op ? '#ced4da' : '#e9ecef'}" stroke="#6e5363" stroke-width="4"/>`;
        s += Story_place(ART.boss(n.w, won ? 'happy' : 'angry'), n.x, n.y + 46, op ? 210 : 170, op ? '' : 'opacity=".45"');
        if (won) s += Story_place(ART.badge(n.w), n.x + 92, n.y - 30, 70);
        s += `<rect x="${n.x - 80}" y="${n.y + 62}" width="160" height="40" rx="20" fill="#fff" stroke="#6e5363" stroke-width="3"/><text x="${n.x}" y="${n.y + 90}" text-anchor="middle" font-family="Jua, sans-serif" font-size="24" fill="#6e5363">${op ? (won ? '친구가 됐어요' : '보스!') : '🔒'}</text></g>`;
        return;
      }
      const stars = st.stars[n.key] || 0, gold = (st.gold || {})[n.key] || [];
      const fr = ART.FRIENDS[n.w * 3 + n.s], got = st.friends[fr.id];
      s += `<g class="node ${op ? '' : 'lock'} ${i === nx ? 'next' : ''}" data-a="node" data-i="${i}" style="cursor:pointer">`;
      if (i === nx) s += `<circle cx="${n.x}" cy="${n.y}" r="70" fill="#fff" opacity=".55" class="pulse"/>`;
      s += `<ellipse cx="${n.x}" cy="${n.y + 46}" rx="46" ry="12" fill="#000" opacity=".14"/>`;
      s += `<circle cx="${n.x}" cy="${n.y + 7}" r="52" fill="${op ? '#5a4252' : '#b8aab4'}"/><circle cx="${n.x}" cy="${n.y}" r="52" fill="${op ? `url(#ng${n.w})` : '#e6e1e5'}" stroke="${OLm}" stroke-width="4"/>`;
      s += `<circle cx="${n.x}" cy="${n.y}" r="42" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/><ellipse cx="${n.x - 16}" cy="${n.y - 24}" rx="16" ry="8" fill="#fff" opacity=".6" transform="rotate(-25 ${n.x - 16} ${n.y - 24})"/>`;
      s += `<text x="${n.x}" y="${n.y + 18}" text-anchor="middle" font-family="Jua, sans-serif" font-size="50" fill="#fff" stroke="${OLm}" stroke-width="6" paint-order="stroke">${op ? n.s + 1 : '🔒'}</text>`;
      if (op) {
        s += `<rect x="${n.x - 58}" y="${n.y + 62}" width="116" height="62" rx="20" fill="#fff" opacity=".92" stroke="${OLm}" stroke-width="2.4"/>`;
        s += `<g font-size="26" text-anchor="middle">${[0, 1, 2].map((k) => `<text x="${n.x - 30 + k * 30}" y="${n.y + 92}" fill="${k < stars ? '#ffc107' : '#e9dfe5'}" stroke="${OLm}" stroke-width="1.4" paint-order="stroke">★</text>`).join('')}</g>`;
        s += [0, 1, 2].map((k) => `<circle cx="${n.x - 22 + k * 22}" cy="${n.y + 109}" r="7" fill="${gold[k] ? '#ffd43b' : '#fff'}" stroke="${gold[k] ? '#f59f00' : '#d8cdd6'}" stroke-width="3"/>`).join('');
      }
      s += Story_place(got ? ART.friend(fr.id, got.top) : ART.friendShadow(fr.id), n.x + 74, n.y - 8, 64, got ? '' : 'opacity=".7"');
      s += `</g>`;
    });
    // 다음 칸 화살표
    const nn = NODES[nx];
    if (nn && !cleared(nn)) s += `<g class="jarrow"><path d="M${nn.x - 26} ${nn.y - 196} h52 l-26 34Z" fill="#ff6b9d" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><rect x="${nn.x - 48}" y="${nn.y - 250}" width="96" height="46" rx="23" fill="#ff6b9d" stroke="#fff" stroke-width="5"/><text x="${nn.x}" y="${nn.y - 217}" text-anchor="middle" font-family="Jua, sans-serif" font-size="28" fill="#fff">여기!</text></g>`;
    // 끝: 무지개 마을
    const last = NODES[NODES.length - 1];
    const vx = last.x + 380, vy = last.y + 120, home = cleared(last);
    s += `<g transform="translate(${vx} ${vy})" opacity="${home ? 1 : 0.55}"><ellipse cx="0" cy="40" rx="120" ry="40" fill="#fff0f6" stroke="#d0bfff" stroke-width="4"/><rect x="-50" y="-40" width="100" height="80" rx="10" fill="#fff" stroke="#6e5363" stroke-width="4"/><path d="M-66 -36 L0 -96 L66 -36Z" fill="#ff8fb6" stroke="#6e5363" stroke-width="4" stroke-linejoin="round"/><rect x="-16" y="0" width="32" height="40" rx="14" fill="#ffd8a8" stroke="#6e5363" stroke-width="3"/><circle cx="-30" cy="-12" r="10" fill="#a5d8ff" stroke="#6e5363" stroke-width="3"/><circle cx="30" cy="-12" r="10" fill="#a5d8ff" stroke="#6e5363" stroke-width="3"/>${home ? ART.heart(0, -120, 14, '#ff6b9d', 2.4) : ''}<text x="0" y="104" text-anchor="middle" font-family="Jua, sans-serif" font-size="28" fill="#845ef7">무지개 마을</text></g>`;
    // 떠다니는 구름
    [[300, 40, 1], [1500, 600, 0.8], [2400, 30, 1.1], [3300, 620, 0.9], [4300, 50, 1]].forEach(([x, y, k], i) => {
      s += `<g class="mcloud" style="animation-delay:${-i * 7}s" opacity=".85"><g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="60" cy="40" rx="90" ry="26" fill="#9ccbe8" opacity=".35"/><circle cx="20" cy="22" r="30" fill="#fff"/><circle cx="62" cy="6" r="40" fill="#fff"/><circle cx="108" cy="22" r="30" fill="#fff"/><rect x="20" y="20" width="88" height="32" rx="16" fill="#fff"/></g></g>`;
    });
    // 포포
    s += `<g id="jTori"><g class="jbob">${Story_place(ART.tori(st.look, 'stand', 'happy'), 0, 0, 110)}</g></g>`;
    return s + `</svg>`;
  }
  function Story_place(svgStr, x, y, w, extra = '') {
    const m = svgStr.match(/viewBox="0 0 (\d+) (\d+)"/);
    const vw = +m[1], vh = +m[2], h = w * vh / vw;
    return `<g ${extra}>` + svgStr.replace('<svg ', `<svg x="${x - w / 2}" y="${y - h}" `).replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`) + '</g>';
  }

  /* 포포 위치·걷기 */
  let at = 0, walking = false, after = null;
  function onIdle(fn) { if (!walking) fn(); else after = fn; }
  function setTori(x, y, face = 1) {
    const g = document.getElementById('jTori'); if (!g) return;
    g.setAttribute('transform', `translate(${x} ${y - 44}) scale(${face} 1)`);
  }
  function scrollTo(x, smooth) {
    const box = document.querySelector('.jbox'), svgEl = document.querySelector('.jmap'); if (!box || !svgEl) return;
    const k = svgEl.getBoundingClientRect().height / VH;
    box.scrollTo({ left: x * k - box.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
  }
  function mount(container, pos) {
    container.innerHTML = `<div class="jbox">${svg()}</div>`;
    at = Math.max(0, Math.min(NODES.length - 1, pos == null ? nextIdx() : pos));
    if (!open(at)) at = nextIdx();
    const n = NODES[at]; setTori(n.x, n.y);
    requestAnimationFrame(() => scrollTo(n.x, false));
  }
  /* 칸 i까지 걸어가기 */
  function walkTo(i, done) {
    if (walking) return;
    if (i === at) { done && done(); return; }
    const dir = i > at ? 1 : -1;
    const path = [];
    for (let k = at; k !== i; k += dir) path.push([k, k + dir]);
    walking = true;
    let idx = 0, t0 = performance.now();
    const step = (now) => {
      const [a, b] = path[idx];
      const A = NODES[a], B = NODES[b];
      const dur = A.w !== B.w ? 900 : 520;
      const t = Math.min(1, (now - t0) / dur);
      const p = dir > 0 ? pointOn(A, B, t) : pointOn(B, A, 1 - t);
      const hop = Math.abs(Math.sin(t * Math.PI * 3)) * 16;
      setTori(p.x, p.y - hop, B.x >= A.x ? 1 : -1);
      if (idx === 0 && t < 0.05 || t > 0.5) scrollTo(p.x, false);
      if (t >= 1) {
        Sfx.tap(); idx++; t0 = now;
        if (idx >= path.length) { walking = false; at = i; setTori(B.x, B.y); done && done(); const f = after; after = null; if (f) setTimeout(f, 60); return; }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  return { NODES, mount, walkTo, onIdle, open, cleared, nextIdx, get at() { return at; }, get walking() { return walking; } };
})();
