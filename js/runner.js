/* 토리의 반짝 달리기 — 달리기 (캔버스) */
'use strict';
const Runner = (() => {
  let cv, c, W = 0, H = 0, dpr = 1, u = 1, gy = 0, tx = 0;
  let raf = 0, last = 0, G = null, paused = false;
  const SPEED = 340, GAP = 1180, OW = 104;

  const THEMES = {
    m: { sky: ['#a5dcff', '#e7f6ff'], far: ['#b2f2bb', '#94e3a0'], top: '#69db7c', top2: '#51cf66', soil: '#d4a373', soil2: '#c08b5c', obst: ['rock', 'log'], amb: 'butterfly', mid: 'bush', sun: true },
    k: { sky: ['#b8f0d8', '#f1fbe4'], far: ['#8fd19e', '#6fbf83'], top: '#40c057', top2: '#2f9e44', soil: '#b08968', soil2: '#9c7656', obst: ['stump', 'mushroom'], amb: 'firefly', mid: 'tree' },
    e: { sky: ['#ffd6a5', '#fff4e6'], far: ['#74c0fc', '#4dabf7'], top: '#ffe8a3', top2: '#fcd77a', soil: '#f8d98f', soil2: '#eec46d', obst: ['castle', 'shell'], amb: 'bubble', mid: 'palm', sea: true, sun: true },
    r: { sky: ['#d9ccff', '#ffeef6'], far: ['#ffffff', '#f3eaff'], top: '#fcc2d7', top2: '#f783ac', soil: '#fff0f6', soil2: '#ffdeeb', obst: ['gift', 'cloud'], amb: 'sparkle', mid: 'candy', rainbow: true },
  };

  function init() {
    cv = document.getElementById('cv'); c = cv.getContext('2d');
    resize(); window.addEventListener('resize', resize);
    cv.addEventListener('pointerdown', (e) => { if (G) { e.preventDefault(); tap(); } });
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    u = Math.min(H / 800, W / 760);
    gy = H * 0.84; tx = W * 0.3;
  }

  /* ---------- 시작 ---------- */
  function start(opt) {
    const T = THEMES[opt.world] || THEMES.m;
    const obs = [], items = [];
    let x = 1150;
    for (let i = 0; i < opt.count; i++) {
      obs.push({ x, type: T.obst[i % 2], qi: i, asked: false, done: false, jumpReady: false });
      // 사이사이 당근
      if (i < opt.count) {
        const a = x + OW + 230, b = x + GAP - 420;
        const pat = i === 0 ? 'line' : ['line', 'arc', 'high', 'arc', 'line', 'high'][(i + opt.seed) % 6];
        if (pat === 'line') for (let k = 0; k < 5; k++) items.push({ x: a + k * 62, y: 60, kind: 'c' });
        if (pat === 'arc') for (let k = 0; k < 6; k++) items.push({ x: a + k * 58, y: 60 + Math.sin((k / 5) * Math.PI) * 190, kind: 'c' });
        if (pat === 'high') { for (let k = 0; k < 4; k++) items.push({ x: a + 20 + k * 58, y: 200, kind: 'c' }); }
        if (i % 3 === 2) items.push({ x: b - 30, y: 270, kind: 's' });   // 반짝 별
        if (i === 1 || i === 5) items.push({ x: (a + b) / 2 + 40, y: 330, kind: 'g' });   // 황금 당근
      }
      x += GAP;
    }
    const finishX = obs[obs.length - 1].x + 1000;
    G = {
      opt, T, obs, items, finishX, scroll: 0, speed: 0, target: SPEED, state: 'run',
      tori: { y: 0, vy: 0, air: false, expr: 'normal', exprT: 0, pose: 'run0', poseT: 0, squash: 0 },
      hist: [], parts: [], amb: [], time: 0, rescueT: 0, flash: 0, tapHint: !!opt.tapHint, look: opt.look,
    };
    for (let i = 0; i < 14; i++) G.amb.push(newAmb(true));
    paused = false;
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function stop() { G = null; cancelAnimationFrame(raf); c.clearRect(0, 0, W, H); }
  function setPaused(p) { paused = p; if (!p) last = performance.now(); }

  function tap() {
    if (!G || paused) return;
    const t = G.tori;
    if ((G.state === 'run') && !t.air) {
      t.vy = 1000 * u; t.air = true; Sfx.jump();
      if (G.tapHint) { G.tapHint = false; G.opt.onHint && G.opt.onHint(false); }
    }
  }
  function answered(kind) {
    if (!G) return;
    const o = G.obs.find((o) => o.asked && !o.done);
    if (o) o.jumpReady = true;
    G.state = 'run'; G.target = SPEED;
    react(kind === 'first' ? 'happy' : kind === 'second' ? 'wink' : 'normal', 1.4);
  }
  function react(expr, secs = 1) { if (G) { G.tori.expr = expr; G.tori.exprT = secs; } }

  /* ---------- 진행 ---------- */
  function loop(now) {
    if (!G) return;
    raf = requestAnimationFrame(loop);
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (paused || document.hidden) dt = 0;
    const n = window.__fast || 1;
    for (let i = 0; i < n && G; i++) update(dt);
    if (G) draw();
  }
  function update(dt) {
    if (!dt) return;
    const g = G, t = g.tori;
    g.time += dt;
    // 속도
    const acc = 1500;
    if (g.speed < g.target) g.speed = Math.min(g.target, g.speed + acc * dt);
    else if (g.speed > g.target) g.speed = Math.max(g.target, g.speed - acc * 1.3 * dt);
    g.scroll += g.speed * u * dt;
    // 점프
    if (t.air) {
      t.vy -= 2700 * u * dt; t.y += t.vy * dt;
      if (t.y <= 0) { t.y = 0; t.vy = 0; t.air = false; t.squash = 0.18; addDust(); }
    }
    if (t.squash > 0) t.squash = Math.max(0, t.squash - dt * 0.9);
    if (t.exprT > 0) { t.exprT -= dt; if (t.exprT <= 0) t.expr = 'normal'; }
    g.hist.push({ t: g.time, y: t.y }); while (g.hist.length > 90) g.hist.shift();
    // 걷는 모양
    t.poseT += dt * (g.speed / SPEED);
    if (t.air) t.pose = 'jump';
    else if (g.state === 'rescue' && g.speed < 5) t.pose = 'cheer';
    else if (g.speed < 20) t.pose = 'stand';
    else t.pose = (Math.floor(t.poseT / 0.14) % 2) ? 'run1' : 'run0';

    const me = g.scroll / u + tx / u;                // 토리 세상 위치 (기준 단위)
    // 장애물
    for (const o of g.obs) {
      if (o.done) continue;
      const d = o.x - (me + 50);
      if (!o.asked && g.state === 'run' && d <= 275) {
        o.asked = true; g.state = 'ask'; g.target = 0; g.askAt = g.time;
      }
      if (o.asked && g.state === 'ask' && g.speed === 0 && !o.shown) { o.shown = true; g.opt.onAsk(o.qi); }
      if (o.jumpReady && !t.air && d <= 100 && d > -OW) { t.vy = 1150 * u; t.air = true; Sfx.jump(); o.jumpReady = false; }
      if (d < -OW - 60) { o.done = true; g.opt.onPass && g.opt.onPass(o.qi); }
      break;
    }
    // 아이템
    for (const it of g.items) {
      if (it.got) continue;
      const sx = (it.x * u) - g.scroll;
      if (sx < -50) { it.got = true; it.miss = true; continue; }
      if (Math.abs(sx - tx) < 58 * u && it.y > t.y / u - 20 && it.y < t.y / u + 200) {
        it.got = true;
        const sy = gy - it.y * u;
        if (it.kind === 'c') { Sfx.carrot(); g.opt.onCarrot(1, sx, sy, 'c'); burst(sx, sy, '#ff922b', 6); }
        else if (it.kind === 'g') { Sfx.star(); g.opt.onCarrot(5, sx, sy, 'g'); burst(sx, sy, '#ffd43b', 16); react('wow', 0.9); }
        else { Sfx.star(); g.opt.onCarrot(3, sx, sy, 's'); burst(sx, sy, '#fff3a3', 14); react('happy', 0.8); }
      }
    }
    // 첫 판 안내: 높은 당근이 보이면
    if (g.tapHint && !g.hintShown) {
      const hi = g.items.find((it) => !it.got && it.y >= 150 && it.x * u - g.scroll < W * 0.95);
      if (hi && g.state === 'run') { g.hintShown = true; g.opt.onHint && g.opt.onHint(true); }
    }
    // 도착
    if (g.state === 'run' && me >= g.finishX - 30 && g.obs.every((o) => o.done)) {
      g.state = 'rescue'; g.target = 0; g.rescueT = 0;
    }
    if (g.state === 'rescue') {
      if (g.speed === 0) {
        g.rescueT += dt;
        if (g.rescueT > 0.5 && !g.popped) {
          g.popped = true; Sfx.pop(); react('wow', 2);
          const fx = (g.finishX + 230) * u - g.scroll;
          burst(fx, gy - 120 * u, '#a5d8ff', 26); burst(fx, gy - 120 * u, '#ffc2d9', 20);
          for (let i = 0; i < 6; i++) g.parts.push({ x: fx + (Math.random() - .5) * 80, y: gy - 160 * u, vx: (Math.random() - .5) * 60, vy: -80 - Math.random() * 60, life: 2, max: 2, kind: 'heart', size: 18 + Math.random() * 10 });
        }
        if (g.rescueT > 2.3 && !g.ended) { g.ended = true; g.opt.onFinish(); }
      }
    }
    // 조각들
    for (const p of g.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind !== 'heart') p.vy += 500 * dt; }
    g.parts = g.parts.filter((p) => p.life > 0);
    for (const a of g.amb) { a.x += (a.vx - g.speed * 0.25) * dt; a.y += Math.sin(g.time * a.f + a.ph) * a.wob * dt; a.ph += dt; }
    g.amb = g.amb.filter((a) => a.x > -40);
    while (g.amb.length < 14) g.amb.push(newAmb(false));
  }
  function newAmb(any) {
    return { x: any ? Math.random() * W : W + 20 + Math.random() * 200, y: H * (0.12 + Math.random() * 0.5), vx: -10 - Math.random() * 30, f: 1 + Math.random() * 2, ph: Math.random() * 6, wob: 20 + Math.random() * 30, s: 0.7 + Math.random() * 0.6, c: Math.floor(Math.random() * 4) };
  }
  function burst(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 100 + Math.random() * 260;
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 0.7 + Math.random() * 0.4, max: 1.1, kind: 'spark', col, size: 4 + Math.random() * 6 });
    }
  }
  function addDust() {
    for (let i = 0; i < 8; i++) G.parts.push({ x: tx + (Math.random() - .5) * 60 * u, y: gy, vx: (Math.random() - .5) * 140, vy: -40 - Math.random() * 60, life: 0.4, max: 0.4, kind: 'dust', col: 'rgba(255,255,255,.8)', size: 6 + Math.random() * 6 });
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    const g = G, T = g.T;
    // 하늘
    const sk = c.createLinearGradient(0, 0, 0, gy);
    sk.addColorStop(0, T.sky[0]); sk.addColorStop(1, T.sky[1]);
    c.fillStyle = sk; c.fillRect(0, 0, W, H);
    if (T.sun) { c.fillStyle = 'rgba(255,230,120,.35)'; circle(W * 0.83, H * 0.2, 90 * u); c.fillStyle = '#ffe066'; circle(W * 0.83, H * 0.2, 56 * u); }
    if (T.rainbow) drawRainbow(W * 0.62 - g.scroll * 0.03, gy - 40 * u, 420 * u);
    // 구름
    for (let i = 0; i < 5; i++) {
      const span = W + 400 * u;
      const x = ((i * 397 * u - g.scroll * 0.08) % span + span) % span - 200 * u;
      cloud(x, H * (0.1 + (i % 3) * 0.09), (0.8 + (i % 2) * 0.4) * u);
    }
    // 먼 언덕
    if (T.sea) {
      c.fillStyle = T.far[0]; c.fillRect(0, gy - 200 * u, W, 210 * u);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 5 * u; c.lineCap = 'round';
      for (let row = 0; row < 3; row++) {
        c.beginPath();
        const yy = gy - (170 - row * 55) * u, off = (g.scroll * (0.2 + row * 0.1) + g.time * 30) % (120 * u);
        for (let x = -off; x < W + 120 * u; x += 120 * u) { c.moveTo(x, yy); c.quadraticCurveTo(x + 30 * u, yy - 10 * u, x + 60 * u, yy); }
        c.stroke();
      }
    } else {
      hills(g.scroll * 0.18, gy - 150 * u, 130 * u, 520 * u, T.far[0]);
      hills(g.scroll * 0.3 + 200 * u, gy - 70 * u, 90 * u, 380 * u, T.far[1]);
    }
    // 가운데 장식
    const midSpan = 330 * u;
    for (let i = -1; i < W / midSpan + 2; i++) {
      const base = Math.floor(g.scroll * 0.55 / midSpan);
      const n = base + i;
      const x = n * midSpan - g.scroll * 0.55 + ((n * 97) % 120) * u;
      midDeco(T.mid, x, gy - 6 * u, n);
    }
    // 땅
    c.fillStyle = T.soil; c.fillRect(0, gy, W, H - gy);
    c.fillStyle = T.soil2;
    const st = 90 * u, off = g.scroll % st;
    for (let x = -off; x < W; x += st) { c.beginPath(); c.ellipse(x + 30 * u, gy + 50 * u, 16 * u, 7 * u, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = T.top; roundRect(-10, gy - 10 * u, W + 20, 26 * u, 12 * u); c.fill();
    c.fillStyle = T.top2;
    const bs = 46 * u, boff = g.scroll % bs;
    for (let x = -boff; x < W + bs; x += bs) { c.beginPath(); c.arc(x, gy + 14 * u, 10 * u, 0, Math.PI); c.fill(); }
    // 결승 깃발 + 친구
    drawFinish();
    // 장애물
    for (const o of g.obs) {
      const sx = o.x * u - g.scroll;
      if (sx > W + 200 || sx < -300) continue;
      drawObstacle(o.type, sx, gy, OW * u, o);
    }
    // 아이템
    for (const it of g.items) {
      if (it.got) continue;
      const sx = it.x * u - g.scroll; if (sx > W + 60 || sx < -60) continue;
      const bob = Math.sin(g.time * 4 + it.x) * 5 * u;
      const sy = gy - it.y * u + bob;
      if (it.kind === 'c') drawCarrot(sx, sy, 1);
      else if (it.kind === 'g') { c.save(); c.globalAlpha = 0.4 + 0.2 * Math.sin(g.time * 6); c.fillStyle = '#ffe066'; circle(sx, sy, 36 * u); c.restore(); drawCarrot(sx, sy, 1.5, true); }
      else drawStar(sx, sy, 24 * u, '#ffe066', g.time * 2);
    }
    // 친구들 (뒤에서 따라옴)
    const team = g.opt.team || [];
    team.forEach((f, i) => {
      const lag = (i + 1) * 0.16;
      const h = g.hist.find((p) => p.t >= g.time - lag) || { y: 0 };
      const hop = g.speed > 20 ? Math.abs(Math.sin(g.time * 9 + i)) * 14 * u : (g.state === 'rescue' ? Math.abs(Math.sin(g.time * 7 + i)) * 20 * u : 0);
      const fw = 92 * u, fh = fw * 134 / 120;
      const fx = tx - 130 * u - i * 98 * u;
      shadow(fx, gy, 34 * u * (1 - Math.min(h.y / 500, 0.6)));
      const im = ImgCache.get('f:' + f.id + ':' + f.top, () => ART.friend(f.id, f.top));
      if (im.ok) c.drawImage(im.img, fx - fw / 2, gy - fh - h.y - hop + 6 * u, fw, fh);
    });
    // 토리
    const t = g.tori;
    const th = 196 * u, tw = th * 200 / 260;
    shadow(tx, gy, 52 * u * (1 - Math.min(t.y / 600, 0.6)));
    const key = JSON.stringify(g.look) + t.pose + t.expr;
    const im = ImgCache.get(key, () => ART.tori(g.look, t.pose, t.expr));
    const bob = (!t.air && g.speed > 20) ? Math.abs(Math.sin(t.poseT / 0.14 * Math.PI)) * 6 * u : 0;
    c.save();
    c.translate(tx, gy - t.y - bob + 4 * u);
    const sq = t.squash;
    c.scale(1 + sq, 1 - sq);
    if (im.ok) c.drawImage(im.img, -tw / 2, -th, tw, th);
    else { // 그림 준비 중이면 그 전 그림
      const fb = ImgCache.get(JSON.stringify(g.look) + 'stand' + 'normal', () => ART.tori(g.look, 'stand', 'normal'));
      if (fb.ok) c.drawImage(fb.img, -tw / 2, -th, tw, th);
    }
    c.restore();
    // 조각
    for (const p of g.parts) {
      const a = Math.max(0, p.life / p.max);
      c.globalAlpha = a;
      if (p.kind === 'heart') heartPath(p.x, p.y, p.size * u, '#ff8fb6');
      else if (p.kind === 'dust') { c.fillStyle = p.col; circle(p.x, p.y, p.size * u); }
      else drawStar(p.x, p.y, p.size * u, p.col, p.life * 6);
      c.globalAlpha = 1;
    }
    // 분위기 (나비·반딧불·방울·반짝이)
    for (const a of g.amb) drawAmb(T.amb, a);
  }

  /* ---------- 그림 조각 ---------- */
  const OLc = '#6e5363';
  function circle(x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function roundRect(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ol(w = 3.4) { c.strokeStyle = OLc; c.lineWidth = w * u; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  function shadow(x, y, r) { c.fillStyle = 'rgba(110,83,99,.16)'; c.beginPath(); c.ellipse(x, y + 2 * u, r, r * 0.22, 0, 0, Math.PI * 2); c.fill(); }
  function cloud(x, y, k) {
    c.fillStyle = 'rgba(255,255,255,.92)';
    c.beginPath(); c.arc(x, y, 26 * k, 0, Math.PI * 2); c.arc(x + 32 * k, y - 14 * k, 34 * k, 0, Math.PI * 2); c.arc(x + 68 * k, y, 26 * k, 0, Math.PI * 2); c.fill();
    c.fillRect(x, y - 2 * k, 68 * k, 26 * k);
  }
  function hills(off, y, h, w, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, gy + 10);
    const o = off % w;
    for (let x = -o - w; x < W + w; x += w) { c.lineTo(x, y + h * 0.5); c.quadraticCurveTo(x + w * 0.5, y - h * 0.6, x + w, y + h * 0.5); }
    c.lineTo(W, gy + 10); c.closePath(); c.fill();
  }
  function drawRainbow(x, y, r) {
    const cols = ['#ffadc0', '#ffd8a8', '#fff3a3', '#c3fae8', '#a5d8ff', '#d0bfff'];
    c.lineWidth = 22 * u; c.globalAlpha = 0.75;
    cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(x, y, r - i * 20 * u, Math.PI, 0); c.stroke(); });
    c.globalAlpha = 1;
  }
  function drawStar(x, y, r, col, rot = 0) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2 + rot; const rr = i % 2 ? r * 0.48 : r; c.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
    c.closePath(); c.fillStyle = col; c.fill(); if (r > 10 * u) ol(2.4);
  }
  function heartPath(x, y, s, col) {
    c.beginPath(); c.moveTo(x, y + s * 0.9);
    c.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
    c.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
    c.fillStyle = col; c.fill(); ol(2);
  }
  function drawCarrot(x, y, k, gold) {
    const s = 26 * u * k;
    c.save(); c.translate(x, y); c.rotate(0.35);
    c.fillStyle = '#69db7c'; c.beginPath(); c.ellipse(-s * 0.18, -s * 0.95, s * 0.16, s * 0.42, -0.4, 0, Math.PI * 2); c.ellipse(s * 0.18, -s * 0.95, s * 0.16, s * 0.42, 0.4, 0, Math.PI * 2); c.fill(); ol(2.2);
    c.beginPath(); c.moveTo(-s * 0.42, -s * 0.55); c.quadraticCurveTo(0, -s * 0.8, s * 0.42, -s * 0.55); c.quadraticCurveTo(s * 0.4, s * 0.2, 0, s * 0.95); c.quadraticCurveTo(-s * 0.4, s * 0.2, -s * 0.42, -s * 0.55);
    c.fillStyle = gold ? '#ffd43b' : '#ff922b'; c.fill(); ol(2.6);
    c.strokeStyle = gold ? '#f59f00' : '#e8590c'; c.lineWidth = 2.4 * u;
    c.beginPath(); c.moveTo(-s * 0.2, -s * 0.25); c.lineTo(s * 0.05, -s * 0.25); c.moveTo(-s * 0.12, s * 0.15); c.lineTo(s * 0.08, s * 0.15); c.stroke();
    if (gold) { c.fillStyle = '#fff'; drawStar(s * 0.5, -s * 0.6, 7 * u, '#fff', 0); }
    c.restore();
  }
  function sleepy(x, y, k = 1) { // 잠자는 눈
    c.strokeStyle = OLc; c.lineWidth = 3 * u * k; c.lineCap = 'round';
    c.beginPath(); c.arc(x - 14 * u * k, y, 6 * u * k, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.beginPath(); c.arc(x + 14 * u * k, y, 6 * u * k, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,143,171,.6)'; c.beginPath(); c.ellipse(x - 26 * u * k, y + 10 * u * k, 7 * u * k, 4 * u * k, 0, 0, 7); c.ellipse(x + 26 * u * k, y + 10 * u * k, 7 * u * k, 4 * u * k, 0, 0, 7); c.fill();
  }
  function zzz(x, y) {
    if (!G) return;
    c.fillStyle = '#9b8291'; c.font = `${22 * u}px Jua, sans-serif`;
    const t = (G.time * 0.8) % 1;
    c.globalAlpha = 1 - t; c.fillText('z', x + t * 20 * u, y - t * 30 * u); c.globalAlpha = 1;
  }
  function drawObstacle(type, x, y, w, o) {
    const h = w;
    c.save();
    shadow(x + w / 2, y, w * 0.55);
    switch (type) {
      case 'rock':
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 6 * u, y - h * 0.7, x + w * 0.35, y - h * 0.78); c.quadraticCurveTo(x + w * 0.95, y - h * 0.9, x + w, y); c.closePath();
        c.fillStyle = '#ced4da'; c.fill(); ol();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x + w * 0.35, y - h * 0.58, 10 * u, 6 * u, -0.4, 0, 7); c.fill();
        sleepy(x + w * 0.52, y - h * 0.38); zzz(x + w * 0.9, y - h * 0.8); break;
      case 'log':
        roundRect(x, y - h * 0.55, w, h * 0.55, h * 0.27); c.fillStyle = '#c08a5b'; c.fill(); ol();
        c.fillStyle = '#e8c39e'; c.beginPath(); c.ellipse(x + w - h * 0.14, y - h * 0.275, h * 0.13, h * 0.25, 0, 0, 7); c.fill(); ol(2.6);
        c.strokeStyle = '#a0704a'; c.lineWidth = 2.4 * u; c.beginPath(); c.ellipse(x + w - h * 0.14, y - h * 0.275, h * 0.06, h * 0.12, 0, 0, 7); c.stroke();
        c.fillStyle = '#69db7c'; c.beginPath(); c.ellipse(x + w * 0.3, y - h * 0.6, 12 * u, 6 * u, -0.5, 0, 7); c.fill(); ol(2);
        sleepy(x + w * 0.4, y - h * 0.3, 0.8); break;
      case 'stump':
        roundRect(x + w * 0.08, y - h * 0.72, w * 0.84, h * 0.72, 10 * u); c.fillStyle = '#b07d56'; c.fill(); ol();
        c.fillStyle = '#e8c39e'; c.beginPath(); c.ellipse(x + w / 2, y - h * 0.72, w * 0.42, h * 0.12, 0, 0, 7); c.fill(); ol(2.6);
        c.strokeStyle = '#c99b72'; c.lineWidth = 2 * u; c.beginPath(); c.ellipse(x + w / 2, y - h * 0.72, w * 0.22, h * 0.06, 0, 0, 7); c.stroke();
        c.fillStyle = '#51cf66'; c.beginPath(); c.ellipse(x + w * 0.75, y - h * 0.86, 10 * u, 16 * u, 0.6, 0, 7); c.fill(); ol(2);
        sleepy(x + w / 2, y - h * 0.38); zzz(x + w * 0.95, y - h * 0.9); break;
      case 'mushroom':
        roundRect(x + w * 0.32, y - h * 0.5, w * 0.36, h * 0.5, 10 * u); c.fillStyle = '#fff4e6'; c.fill(); ol();
        c.beginPath(); c.moveTo(x - 4 * u, y - h * 0.45); c.quadraticCurveTo(x + w / 2, y - h * 1.25, x + w + 4 * u, y - h * 0.45); c.closePath(); c.fillStyle = '#ff6b6b'; c.fill(); ol();
        c.fillStyle = '#fff'; [[0.28, 0.62], [0.55, 0.8], [0.75, 0.6]].forEach(([a, b]) => circle(x + w * a, y - h * b, 7 * u));
        sleepy(x + w / 2, y - h * 0.24, 0.6); break;
      case 'castle':
        c.fillStyle = '#ffd8a8';
        roundRect(x, y - h * 0.5, w, h * 0.5, 6 * u); c.fill(); ol();
        roundRect(x + w * 0.28, y - h * 0.86, w * 0.44, h * 0.4, 6 * u); c.fill(); ol();
        for (let i = 0; i < 3; i++) { c.fillStyle = '#ffd8a8'; c.fillRect(x + w * (0.3 + i * 0.15), y - h * 0.94, w * 0.08, h * 0.1); }
        c.strokeStyle = OLc; c.lineWidth = 2.4 * u; c.beginPath(); c.moveTo(x + w / 2, y - h * 0.94); c.lineTo(x + w / 2, y - h * 1.2); c.stroke();
        c.fillStyle = '#ff8fb6'; c.beginPath(); c.moveTo(x + w / 2, y - h * 1.2); c.lineTo(x + w / 2 + 22 * u, y - h * 1.13); c.lineTo(x + w / 2, y - h * 1.06); c.fill();
        sleepy(x + w / 2, y - h * 0.28, 0.8); break;
      case 'shell':
        c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x, y - h * 0.4); c.quadraticCurveTo(x + w / 2, y - h * 1.1, x + w, y - h * 0.4); c.closePath();
        c.fillStyle = '#ffc9de'; c.fill(); ol();
        c.strokeStyle = '#f783ac'; c.lineWidth = 3 * u; c.beginPath();
        for (let i = 1; i < 5; i++) { c.moveTo(x + w / 2, y - 4 * u); c.lineTo(x + w * i / 5, y - h * (0.42 + 0.3 * Math.sin(i / 5 * Math.PI))); }
        c.stroke();
        sleepy(x + w / 2, y - h * 0.32, 0.6); break;
      case 'gift':
        roundRect(x + 4 * u, y - h * 0.7, w - 8 * u, h * 0.7, 10 * u); c.fillStyle = '#b197fc'; c.fill(); ol();
        c.fillStyle = '#ffe066'; c.fillRect(x + w * 0.42, y - h * 0.7, w * 0.16, h * 0.7); roundRect(x, y - h * 0.82, w, h * 0.16, 8 * u); c.fillStyle = '#d0bfff'; c.fill(); ol();
        c.fillStyle = '#ffe066'; c.beginPath(); c.ellipse(x + w * 0.38, y - h * 0.9, 14 * u, 9 * u, 0.5, 0, 7); c.ellipse(x + w * 0.62, y - h * 0.9, 14 * u, 9 * u, -0.5, 0, 7); c.fill(); ol(2);
        sleepy(x + w * 0.5, y - h * 0.38, 0.6); break;
      case 'cloud':
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(x + w * 0.25, y - h * 0.3, h * 0.3, 0, 7); c.arc(x + w * 0.55, y - h * 0.5, h * 0.38, 0, 7); c.arc(x + w * 0.82, y - h * 0.28, h * 0.28, 0, 7); c.fill();
        c.fillRect(x + w * 0.2, y - h * 0.3, w * 0.65, h * 0.3); ol(0);
        c.strokeStyle = '#d0bfff'; c.lineWidth = 3 * u; c.stroke();
        sleepy(x + w * 0.55, y - h * 0.38, 0.7); zzz(x + w, y - h * 0.85); break;
    }
    c.restore();
  }
  function midDeco(kind, x, y, n) {
    c.save();
    switch (kind) {
      case 'bush':
        c.fillStyle = n % 2 ? '#8ce99a' : '#69db7c';
        c.beginPath(); c.arc(x, y - 22 * u, 28 * u, 0, 7); c.arc(x + 34 * u, y - 32 * u, 34 * u, 0, 7); c.arc(x + 68 * u, y - 20 * u, 26 * u, 0, 7); c.fill();
        if (n % 3 === 0) { c.fillStyle = '#ffa8c5'; circle(x + 20 * u, y - 44 * u, 7 * u); c.fillStyle = '#fff3a3'; circle(x + 50 * u, y - 52 * u, 7 * u); }
        break;
      case 'tree':
        c.fillStyle = '#a87b5a'; c.fillRect(x + 22 * u, y - 120 * u, 18 * u, 120 * u);
        c.fillStyle = n % 2 ? '#69db7c' : '#51cf66';
        c.beginPath(); c.arc(x + 31 * u, y - 140 * u, 56 * u, 0, 7); c.arc(x - 6 * u, y - 112 * u, 36 * u, 0, 7); c.arc(x + 66 * u, y - 112 * u, 36 * u, 0, 7); c.fill();
        if (n % 3 === 0) { c.fillStyle = '#ff6b6b'; circle(x + 10 * u, y - 130 * u, 7 * u); circle(x + 50 * u, y - 150 * u, 7 * u); }
        break;
      case 'palm':
        c.strokeStyle = '#c08a5b'; c.lineWidth = 14 * u; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20 * u, y - 80 * u, x + 8 * u, y - 160 * u); c.stroke();
        c.fillStyle = '#51cf66';
        for (let i = 0; i < 5; i++) { c.save(); c.translate(x + 8 * u, y - 160 * u); c.rotate(-2.6 + i * 0.8); c.beginPath(); c.ellipse(36 * u, 0, 40 * u, 11 * u, 0, 0, 7); c.fill(); c.restore(); }
        break;
      case 'candy':
        c.fillStyle = '#fff'; c.fillRect(x + 26 * u, y - 110 * u, 8 * u, 110 * u);
        c.fillStyle = ['#ff8fa3', '#74c0fc', '#8ce99a', '#ffe066'][((n % 4) + 4) % 4];
        circle(x + 30 * u, y - 120 * u, 30 * u);
        c.strokeStyle = '#fff'; c.lineWidth = 5 * u; c.beginPath(); c.arc(x + 30 * u, y - 120 * u, 17 * u, 0.3, 4.5); c.stroke();
        break;
    }
    c.restore();
  }
  function drawFinish() {
    const g = G;
    const fx = g.finishX * u - g.scroll;
    if (fx > W + 400 || fx < -400) return;
    // 깃발 아치
    c.strokeStyle = OLc; c.lineWidth = 4 * u;
    c.fillStyle = '#fff'; roundRect(fx - 6 * u, gy - 230 * u, 12 * u, 230 * u, 6 * u); c.fill(); c.stroke();
    const cols = ['#ff8fb6', '#ffe066', '#74c0fc', '#8ce99a', '#b197fc'];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = cols[i];
      c.beginPath(); c.moveTo(fx + 6 * u + i * 26 * u, gy - 226 * u); c.lineTo(fx + 32 * u + i * 26 * u, gy - 226 * u); c.lineTo(fx + 19 * u + i * 26 * u, gy - 196 * u); c.closePath(); c.fill(); ol(2);
    }
    c.strokeStyle = OLc; c.lineWidth = 2 * u; c.beginPath(); c.moveTo(fx + 6 * u, gy - 226 * u); c.lineTo(fx + 140 * u, gy - 226 * u); c.stroke();
    // 구할 친구
    const bx = (g.finishX + 230) * u - g.scroll, by = gy;
    const fw = 110 * u, fh = fw * 134 / 120;
    const fid = g.opt.rescue;
    if (fid) {
      const hop = g.popped ? Math.abs(Math.sin(g.time * 8)) * 26 * u : Math.sin(g.time * 3) * 3 * u;
      const im = ImgCache.get('f:' + fid + ':', () => ART.friend(fid, ''));
      shadow(bx, by, 40 * u);
      if (im.ok) c.drawImage(im.img, bx - fw / 2, by - fh - hop + 6 * u, fw, fh);
      if (!g.popped) { // 비눗방울
        const r = 92 * u + Math.sin(g.time * 3) * 3 * u;
        c.save();
        const gr = c.createRadialGradient(bx - r * 0.3, by - fh / 2 - r * 0.3, r * 0.1, bx, by - fh / 2, r);
        gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.7, 'rgba(165,216,255,.25)'); gr.addColorStop(1, 'rgba(208,191,255,.55)');
        c.fillStyle = gr; c.beginPath(); c.arc(bx, by - fh / 2 - 4 * u, r, 0, 7); c.fill();
        c.strokeStyle = 'rgba(177,151,252,.8)'; c.lineWidth = 4 * u; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(bx - r * 0.45, by - fh / 2 - r * 0.45, 14 * u, 8 * u, -0.7, 0, 7); c.fill();
        c.restore();
        c.fillStyle = '#6e5363'; c.font = `${26 * u}px Jua, sans-serif`; c.textAlign = 'center';
        c.fillText('도와줘!', bx, by - fh - 70 * u + Math.sin(g.time * 4) * 4 * u); c.textAlign = 'left';
      }
    } else { // 보물 상자
      const open = g.popped;
      c.save(); c.translate(bx, by);
      shadow(0, 0, 60 * u);
      roundRect(-56 * u, -70 * u, 112 * u, 70 * u, 12 * u); c.fillStyle = '#d08c60'; c.fill(); ol();
      c.fillStyle = '#ffd43b'; c.fillRect(-10 * u, -70 * u, 20 * u, 70 * u);
      c.save(); if (open) { c.translate(-56 * u, -70 * u); c.rotate(-0.6); c.translate(56 * u, 70 * u); }
      roundRect(-60 * u, -100 * u, 120 * u, 36 * u, 14 * u); c.fillStyle = '#e8a372'; c.fill(); ol();
      c.restore();
      if (open) for (let i = 0; i < 5; i++) drawCarrot(-40 * u + i * 20 * u, -96 * u - Math.abs(Math.sin(g.time * 6 + i)) * 30 * u, 0.9, i === 2);
      c.restore();
    }
  }
  function drawAmb(kind, a) {
    const s = a.s * u;
    switch (kind) {
      case 'butterfly': {
        const flap = Math.abs(Math.sin(G.time * 10 + a.ph)) * 0.8 + 0.2;
        const col = ['#ffa8c5', '#fff3a3', '#d0bfff', '#a5d8ff'][a.c];
        c.fillStyle = col;
        c.beginPath(); c.ellipse(a.x - 8 * s, a.y, 9 * s * flap, 12 * s, -0.4, 0, 7); c.ellipse(a.x + 8 * s, a.y, 9 * s * flap, 12 * s, 0.4, 0, 7); c.fill();
        c.fillStyle = OLc; c.fillRect(a.x - 1.5 * s, a.y - 8 * s, 3 * s, 16 * s); break;
      }
      case 'firefly':
        c.globalAlpha = 0.5 + 0.5 * Math.sin(G.time * 4 + a.ph);
        c.fillStyle = 'rgba(255,243,163,.5)'; circle(a.x, a.y, 12 * s); c.fillStyle = '#fff3a3'; circle(a.x, a.y, 5 * s); c.globalAlpha = 1; break;
      case 'bubble':
        c.strokeStyle = 'rgba(116,192,252,.7)'; c.lineWidth = 2.4 * u; c.beginPath(); c.arc(a.x, a.y, 12 * s, 0, 7); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.8)'; circle(a.x - 4 * s, a.y - 4 * s, 3 * s); break;
      case 'sparkle':
        c.globalAlpha = 0.6 + 0.4 * Math.sin(G.time * 5 + a.ph);
        drawStar(a.x, a.y, 9 * s, ['#fff3a3', '#ffc9de', '#d0bfff', '#c5f6fa'][a.c], G.time + a.ph); c.globalAlpha = 1; break;
    }
  }

  return { init, start, stop, tap, answered, react, setPaused, get active() { return !!G; }, get state() { return G && G.state; }, _G: () => G };
})();
