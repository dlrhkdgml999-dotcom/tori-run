/* 토리의 반짝 달리기 — 여정 지도 (섬 4개, 토리가 길을 따라 걸어가요) */
'use strict';
const Journey = (() => {
  const VW = 4700, VH = 700;
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

  function island(w) {
    const x0 = 140 + w * 1130;
    const col = ['#b2f2bb', '#8ce99a', '#ffe8a3', '#e5dbff'][w], edge = ['#8ce99a', '#69db7c', '#ffd8a8', '#d0bfff'][w];
    let s = `<g>`;
    s += `<ellipse cx="${x0 + 500}" cy="420" rx="560" ry="250" fill="${edge}"/><ellipse cx="${x0 + 500}" cy="405" rx="540" ry="232" fill="${col}"/>`;
    s += `<ellipse cx="${x0 + 260}" cy="300" rx="200" ry="120" fill="${col}"/><ellipse cx="${x0 + 820}" cy="290" rx="220" ry="140" fill="${col}"/>`;
    // 꾸밈
    const deco = [];
    if (w === 0) {
      for (let i = 0; i < 10; i++) deco.push(ART.flower(x0 + 60 + i * 95, 560 + (i % 3) * 22, 12, ['#ffa8c5', '#fff3a3', '#d0bfff', '#a5d8ff'][i % 4]));
      [[x0 + 70, 380], [x0 + 520, 600]].forEach(([x, y]) => deco.push(`<g fill="#69db7c"><circle cx="${x}" cy="${y}" r="28"/><circle cx="${x + 34}" cy="${y - 10}" r="34"/><circle cx="${x + 68}" cy="${y}" r="26"/></g>`));
    } else if (w === 1) {
      [[x0 + 30, 330], [x0 + 250, 660], [x0 + 520, 250], [x0 + 800, 650], [x0 + 1030, 470], [x0 + 470, 640]].forEach(([x, y], i) => deco.push(`<rect x="${x - 8}" y="${y - 70}" width="16" height="70" fill="#a87b5a"/><circle cx="${x}" cy="${y - 90}" r="${40 + (i % 2) * 8}" fill="${i % 2 ? '#51cf66' : '#40c057'}"/><circle cx="${x - 12}" cy="${y - 100}" r="7" fill="#ff8787"/>`));
    } else if (w === 2) {
      const palm = (x, y) => {
        let p = `<path d="M${x} ${y} Q${x + 14} ${y - 60} ${x + 6} ${y - 120}" fill="none" stroke="#c08a5b" stroke-width="12" stroke-linecap="round"/>`;
        for (let k = 0; k < 5; k++) {
          const a = -2.6 + k * 0.8, cx = x + 6 + Math.cos(a) * 34, cy = y - 120 + Math.sin(a) * 34;
          p += `<ellipse cx="${cx}" cy="${cy}" rx="38" ry="10" transform="rotate(${a * 57} ${cx} ${cy})" fill="#51cf66"/>`;
        }
        return p;
      };
      [[x0 + 80, 360], [x0 + 520, 600], [x0 + 980, 420]].forEach(([x, y]) => deco.push(palm(x, y)));
      deco.push(ART.star(x0 + 300, 600, 18, '#ff922b') + ART.star(x0 + 800, 590, 14, '#ff8fa3'));
    } else {
      const cols = ['#ffadc0', '#ffd8a8', '#fff3a3', '#c3fae8', '#a5d8ff', '#d0bfff'];
      cols.forEach((cc, i) => deco.push(`<path d="M${x0 + 120 + i * 16} 470 A${380 - i * 16} ${330 - i * 16} 0 0 1 ${x0 + 880 - i * 16} 470" fill="none" stroke="${cc}" stroke-width="16" opacity=".7"/>`));
      [[x0 + 120, 600], [x0 + 560, 610], [x0 + 980, 560]].forEach(([x, y], i) => deco.push(`<rect x="${x - 4}" y="${y - 70}" width="8" height="70" fill="#fff" stroke="#6e5363" stroke-width="2"/><circle cx="${x}" cy="${y - 80}" r="24" fill="${['#ff8fa3', '#74c0fc', '#8ce99a'][i]}" stroke="#6e5363" stroke-width="3"/>`));
      // 무지개 성
      const cx = x0 + 900, cy = 290;
      deco.push(`<g transform="translate(${cx} ${cy - 30})"><rect x="-90" y="-120" width="180" height="120" rx="10" fill="#fff0f6" stroke="#6e5363" stroke-width="4"/><rect x="-120" y="-170" width="50" height="170" rx="8" fill="#ffdeeb" stroke="#6e5363" stroke-width="4"/><rect x="70" y="-170" width="50" height="170" rx="8" fill="#ffdeeb" stroke="#6e5363" stroke-width="4"/><path d="M-125 -170 L-95 -215 L-65 -170Z M65 -170 L95 -215 L125 -170Z M-60 -120 L0 -185 L60 -120Z" fill="#b197fc" stroke="#6e5363" stroke-width="4" stroke-linejoin="round"/><rect x="-24" y="-60" width="48" height="60" rx="24" fill="#d0bfff" stroke="#6e5363" stroke-width="3"/></g>`);
    }
    return s + deco.join('') + `</g>`;
  }

  function svg() {
    const st = S();
    let s = `<svg class="jmap" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMinYMid meet">`;
    s += `<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5d8ff"/><stop offset="1" stop-color="#d0ebff"/></linearGradient></defs><rect width="${VW}" height="${VH}" fill="url(#sea)"/>`;
    for (let i = 0; i < 46; i++) s += `<path d="M${(i * 211) % VW} ${60 + (i * 97) % 600} q14 -10 28 0 q14 10 28 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
    for (let w = 0; w < 4; w++) s += island(w);
    // 다리 (보스를 이기면 생겨요)
    for (let w = 0; w < 3; w++) {
      const a = NODES[w * 4 + 3], b = NODES[w * 4 + 4];
      const ok = cleared(a);
      s += `<g opacity="${ok ? 1 : 0.35}"><path d="${seg(a, b).d}" fill="none" stroke="#a87b5a" stroke-width="34" stroke-linecap="round"/><path d="${seg(a, b).d}" fill="none" stroke="#e8c39e" stroke-width="24" stroke-dasharray="6 14" stroke-linecap="butt"/></g>`;
    }
    // 길
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i], b = NODES[i + 1];
      if (a.w !== b.w) continue;
      const done = cleared(a);
      s += `<path d="${seg(a, b).d}" fill="none" stroke="${done ? '#fff' : '#ffffff99'}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${done ? '0' : '2 22'}"/>`;
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
      if (i === nx) s += `<circle cx="${n.x}" cy="${n.y}" r="66" fill="#fff" opacity=".6" class="pulse"/>`;
      s += `<circle cx="${n.x}" cy="${n.y + 6}" r="50" fill="#6e5363" opacity=".18"/><circle cx="${n.x}" cy="${n.y}" r="50" fill="${op ? col : '#dee2e6'}" stroke="#6e5363" stroke-width="5"/>`;
      s += `<circle cx="${n.x}" cy="${n.y}" r="38" fill="#fff" opacity=".25"/><text x="${n.x}" y="${n.y + 17}" text-anchor="middle" font-family="Jua, sans-serif" font-size="48" fill="#fff" stroke="#6e5363" stroke-width="2" paint-order="stroke">${op ? n.s + 1 : '🔒'}</text>`;
      if (op) {
        s += `<g font-size="30" text-anchor="middle">${[0, 1, 2].map((k) => `<text x="${n.x - 34 + k * 34}" y="${n.y + 92}" fill="${k < stars ? '#ffc107' : '#e9dfe5'}" stroke="#6e5363" stroke-width="1.6" paint-order="stroke">★</text>`).join('')}</g>`;
        s += [0, 1, 2].map((k) => `<circle cx="${n.x - 22 + k * 22}" cy="${n.y + 112}" r="8" fill="${gold[k] ? '#ffd43b' : '#fff'}" stroke="${gold[k] ? '#f59f00' : '#c9bfd6'}" stroke-width="3"/>`).join('');
      }
      s += Story_place(got ? ART.friend(fr.id, got.top) : ART.friendShadow(fr.id), n.x + 74, n.y - 8, 64, got ? '' : 'opacity=".7"');
      s += `</g>`;
    });
    // 끝: 무지개 마을
    const last = NODES[NODES.length - 1];
    s += `<g transform="translate(${last.x + 230} ${last.y + 150})"><text x="0" y="0" text-anchor="middle" font-family="Jua, sans-serif" font-size="30" fill="#845ef7">무지개 마을 🏠</text></g>`;
    // 토리
    s += `<g id="jTori"><g class="jbob">${Story_place(ART.tori(st.look, 'stand', 'happy'), 0, 0, 110)}</g></g>`;
    return s + `</svg>`;
  }
  function Story_place(svgStr, x, y, w, extra = '') {
    const m = svgStr.match(/viewBox="0 0 (\d+) (\d+)"/);
    const vw = +m[1], vh = +m[2], h = w * vh / vw;
    return `<g ${extra}>` + svgStr.replace('<svg ', `<svg x="${x - w / 2}" y="${y - h}" `).replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`) + '</g>';
  }

  /* 토리 위치·걷기 */
  let at = 0, walking = false;
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
        if (idx >= path.length) { walking = false; at = i; setTori(B.x, B.y); done && done(); return; }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  return { NODES, mount, walkTo, open, cleared, nextIdx, get at() { return at; }, get walking() { return walking; } };
})();
