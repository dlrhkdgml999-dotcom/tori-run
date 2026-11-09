/* 포포의 반짝 모험 — 달리기 (캔버스)
   기준 단위: 화면 높이 800일 때 1 = 1px (u 배율) */
'use strict';
const Runner = (() => {
  let cv, c, W = 0, H = 0, dpr = 1, u = 1, gy = 0, tx = 0;
  let raf = 0, last = 0, G = null, paused = false, holding = false;
  const SPEED = 340, SEG = 2400, OW = 104, BLOCK_Y = 300, POLE_H = 460;

  /* 월드마다 풍경: 하늘 3색, 산 3겹, 풀, 흙 */
  const THEMES = {
    m: { sky: ['#73c4f2', '#bde4fa', '#fff3db'], ridges: [['#d5e8f5', '#eef6fb', -270, 120, 430, 0.05, 1], ['#ace0b4', '#d0f0cf', -160, 80, 300, 0.14, 2], ['#86d290', '#aee6aa', -70, 50, 210, 0.3, 3]],
      grass: ['#9ae48f', '#5cc460'], soil: ['#ecc79c', '#d6a473'], obst: ['rock', 'log'], amb: 'butterfly', mid: 'bush', sun: true, rays: true, fore: 'tuft' },
    k: { sky: ['#6ccdb8', '#c4eed6', '#fffbe0'], ridges: [['#c6e6d4', '#e4f4ea', -270, 110, 380, 0.05, 4], ['#83c99a', '#a9dfb5', -170, 90, 160, 0.14, 5], ['#5bb277', '#7fcb8f', -80, 60, 120, 0.3, 6]],
      grass: ['#7ad683', '#3fa85a'], soil: ['#cfa47c', '#ab805b'], obst: ['stump', 'mushroom'], amb: 'firefly', mid: 'tree', rays: true, fore: 'tuft' },
    e: { sky: ['#56bdf3', '#a6e1fb', '#fff1d4'], ridges: [['#b9dff2', '#dcf0fa', -250, 70, 500, 0.04, 7]], sea: true,
      grass: ['#fff0c4', '#f3d08a'], soil: ['#ffe3a8', '#f1c77a'], obst: ['castle', 'shell'], amb: 'bubble', mid: 'palm', sun: true, fore: 'shell' },
    r: { sky: ['#b39dff', '#ffc4e4', '#fff3f9'], ridges: [['#ece0ff', '#f8f2ff', -270, 110, 400, 0.05, 8], ['#ffd8ee', '#fff0f8', -170, 80, 260, 0.14, 9], ['#ffc2df', '#ffe0ef', -80, 55, 190, 0.3, 10]],
      grass: ['#ffd2e8', '#f58fbf'], soil: ['#fff2f8', '#ffd9eb'], obst: ['gift', 'cloud'], amb: 'sparkle', mid: 'candy', rainbow: true, fore: 'sugar' },
  };
  /* 지금 시간·계절 */
  function envNow(over) {
    const d = new Date(), h = d.getHours(), m = d.getMonth() + 1;
    const env = {
      phase: h >= 19 || h < 6 ? 'night' : h >= 17 ? 'sunset' : 'day',
      season: m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter',
    };
    return Object.assign(env, over || {});
  }

  function init() {
    cv = document.getElementById('cv'); c = cv.getContext('2d');
    resize(); window.addEventListener('resize', resize);
    cv.addEventListener('pointerdown', (e) => { if (G) { e.preventDefault(); if (!catchFlyer(e.clientX, e.clientY)) tap(); } });
    window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    u = Math.min(H / 800, W / 760);
    gy = H * 0.84; tx = W * 0.3;
  }

  /* ---------- 한 판 만들기 ---------- */
  function start(opt) {
    const T = THEMES[opt.world] || THEMES.m;
    const env = envNow(opt.env || window.__env);
    const obs = [], items = [];
    const boss = opt.mode === 'boss';
    const hurdles = [];
    let x = 1150;
    if (!boss) {
      for (let i = 0; i < opt.count; i++) {
        obs.push({ x, type: T.obst[i % 2], qi: i, asked: false, done: false, jumpReady: false });
        const o = x + OW;
        // 당근 줄
        const pat = ['line', 'arc', 'high', 'arc', 'line'][(i + opt.seed) % 5];
        const a = o + 200;
        if (pat === 'line') for (let k = 0; k < 5; k++) items.push({ x: a + k * 62, y: 60, kind: 'c' });
        if (pat === 'arc') for (let k = 0; k < 6; k++) items.push({ x: a + k * 58, y: 60 + Math.sin((k / 5) * Math.PI) * 170, kind: 'c' });
        if (pat === 'high') for (let k = 0; k < 4; k++) items.push({ x: a + 20 + k * 58, y: 200, kind: 'c' });
        // 뛰어넘는 장애물 두 개 (위로 당근 무지개)
        const h1 = o + 700, h2 = o + 1520;
        const tall2 = i % 2 === 1;
        hurdles.push({ x: h1, w: 60, h: 58, tall: false });
        hurdles.push({ x: h2, w: 60, h: tall2 ? 104 : 58, tall: tall2 });
        for (let k = 0; k < 5; k++) items.push({ x: h1 - 90 + k * 60, y: 90 + Math.sin((k / 4) * Math.PI) * 110, kind: 'c' });
        items.push({ x: h2 + 30, y: tall2 ? 250 : 200, kind: 's' });
        // ❓ 선물 구름
        const gives = ['carrots', 'gold', Math.random() < 0.5 ? 'star' : 'balloon', ['carrots', 'star', 'balloon'][Math.floor(Math.random() * 3)], 'carrots'][i];
        if (gives) items.push({ x: o + 1120, y: BLOCK_Y, kind: 'q', gives, bump: 0 });
        if (i === 2) items.push({ x: o + 1880, y: 300, kind: 'big' });
        // 숨은 황금 당근 (꾹 또는 2단 점프로)
        if (i === 1) items.push({ x: o + 1330, y: 430, kind: 'G', gi: 0 });
        if (i === 3) items.push({ x: o + 1860, y: 450, kind: 'G', gi: 2 });
        x += SEG;
      }
    }
    if (opt.mode === 'bonus') {   // 보너스 길: 문제 없이 당근이 가득
      for (let k = 0; k < 44; k++) {
        const bx = 700 + k * 150;
        const p = k % 11;
        if (p < 4) items.push({ x: bx, y: 60 + Math.sin(k) * 20, kind: 'c' }, { x: bx + 60, y: 120 + (k % 3) * 60, kind: 'c' });
        else if (p < 7) items.push({ x: bx, y: 200 + (p - 4) * 50, kind: 'c' }, { x: bx + 50, y: 260, kind: 'c' });
        else if (p === 7) items.push({ x: bx, y: BLOCK_Y, kind: 'q', gives: k % 2 ? 'star' : 'balloon', bump: 0 });
        else if (p === 8) items.push({ x: bx, y: 300, kind: 'big' });
        else items.push({ x: bx, y: 240, kind: 's' }, { x: bx + 70, y: 60, kind: 'c' });
      }
    }
    const finishX = boss ? 1e9 : opt.mode === 'bonus' ? 7600 : obs[obs.length - 1].x + 2150;
    G = {
      opt, T, env, obs, items, hurdles, finishX, boss, bumps: 0, scroll: 0, speed: 0, target: SPEED, state: 'run',
      tori: { y: 0, vy: 0, air: false, dbl: false, holdT: 0, expr: 'normal', exprT: 0, pose: 'run0', poseT: 0, squash: 0 },
      hist: [], parts: [], amb: [], seasonal: [], time: 0, rescueT: 0, look: opt.look,
      power: null, streak: 0, streakT: 0, shake: 0, gold: [false, false, false],
      flag: 1, pole: null, poleHinted: false, tapHint: !!opt.tapHint,
      bossS: boss ? { hp: opt.hp, max: opt.hp, mood: 'angry', moodT: 0, x: 0, y: 0, shots: [], phaseT: 1.3, won: false, wind: 0 } : null,
      stars: Array.from({ length: 40 }, (_, i) => ({ x: (i * 157) % 1000 / 1000, y: (i * 89) % 520 / 1000, r: 1 + (i % 3), p: i })),
    };
    for (let i = 0; i < 8; i++) G.amb.push(newAmb(true));
    for (let i = 0; i < 10; i++) G.seasonal.push(newSeason(true));
    paused = false;
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function stop() { G = null; cancelAnimationFrame(raf); c.clearRect(0, 0, W, H); }
  function setPaused(p) { paused = p; if (!p) last = performance.now(); }

  /* ---------- 조작 ---------- */
  function tap() {
    if (!G || paused) return;
    const t = G.tori;
    holding = true;
    if ((G.state === 'run' || G.state === 'walk') && !(G.power && G.power.k === 'balloon')) {
      if (!t.air) {
        t.vy = 900 * u; t.air = true; t.dbl = false; t.holdT = 0; Sfx.jump();
        if (G.tapHint) { G.tapHint = false; G.opt.onHint && G.opt.onHint(false); }
      } else if (!t.dbl) {   // 2단 점프
        t.dbl = true; t.vy = Math.max(t.vy, 0) * 0.2 + 780 * u; t.holdT = 0.14; Sfx.jump2();
        ring(tx, gy - t.y - 60 * u); G.dbls = (G.dbls || 0) + 1;
        G.opt.onDouble && G.opt.onDouble();
      }
    }
  }
  function release() { holding = false; }
  /* 황금 나비(낮) · 별똥별(밤): 톡 잡으면 당근 10 */
  function catchFlyer(x, y) {
    const f = G && G.flyer;
    if (!f || f.caught || f.gone) return false;
    if (Math.hypot(x - f.x, y - f.y) > 70 * u) return false;
    f.caught = true; Sfx.gold(); burst(f.x, f.y, '#ffd43b', 24); burst(f.x, f.y, '#fff', 10);
    G.opt.onFlyer && G.opt.onFlyer(f.x, f.y, f.kind);
    return true;
  }
  function answered(kind) {
    if (!G) return;
    const o = G.obs.find((o) => o.asked && !o.done);
    if (o) o.jumpReady = true;
    G.state = 'run'; G.target = SPEED;
    react(kind === 'first' ? 'happy' : kind === 'second' ? 'wink' : 'normal', 1.4);
  }
  function react(expr, secs = 1) { if (G) { G.tori.expr = expr; G.tori.exprT = secs; } }
  function cheer(text) {   // 같이 달리는 친구가 한마디
    if (!G || !(G.opt.team || []).length) return;
    G.talk = { i: Math.floor(Math.random() * G.opt.team.length), text, t: 1.6 };
  }
  function power(k) {
    if (!G || G.boss) return;
    G.power = { k, t: k === 'star' ? 6 : 4.5, max: k === 'star' ? 6 : 4.5 };
    if (k === 'balloon') {   // 하늘 당근 길
      const me = (G.scroll + tx) / u;
      for (let i = 0; i < 12; i++) G.items.push({ x: me + 260 + i * 78, y: 430 + Math.sin(i / 2) * 40, kind: 'c', sky: true });
      G.tori.air = true;
    }
    Sfx.power(); react('wow', 1.2);
    G.opt.onPower && G.opt.onPower(k);
  }
  /* 보스: 당근 던지기 */
  function bossAttack(dmg) {
    if (!G || !G.boss) return;
    const B = G.bossS;
    B.shots.push({ t: 0, dmg, big: dmg >= 2 });
    B.phaseT = 3.6; B.puffT = 0.35;
    G.state = 'run'; G.target = SPEED * 0.6;
    react('happy', 1.2); Sfx.jump();
  }
  function bossTaunt() {
    if (!G || !G.boss) return;
    const B = G.bossS; B.mood = 'angry'; B.moodT = 0.9; B.wind = 0.9; Sfx.wind();
  }

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
    if (g.shake > 0) g.shake = Math.max(0, g.shake - dt);
    // 파워업
    const P = g.power;
    if (P && g.state !== 'ask') { P.t -= dt; if (P.t <= 0) { g.power = null; if (P.k === 'balloon') { t.air = true; t.vy = 0; } } }
    const spd = g.target * (P && P.k === 'star' && g.state === 'run' ? 1.35 : 1) * (g.opt.slow ? 0.8 : 1);
    const acc = 1500;
    if (g.speed < spd) g.speed = Math.min(spd, g.speed + acc * dt);
    else if (g.speed > spd) g.speed = Math.max(spd, g.speed - acc * 1.3 * dt);
    g.scroll += g.speed * u * dt;
    // 점프 (꾹 누르면 더 높이)
    if (g.power && g.power.k === 'balloon') {
      const goal = 300 * u + Math.sin(g.time * 3) * 12 * u;
      t.y += (goal - t.y) * Math.min(1, dt * 3); t.vy = 0; t.air = true;
    } else if (t.air) {
      let grav = 2700 * u;
      if (holding && t.vy > 0 && t.holdT < 0.28) { grav *= 0.35; t.holdT += dt; }
      t.vy -= grav * dt; t.y += t.vy * dt;
      if (t.y <= 0) { t.y = 0; t.vy = 0; t.air = false; t.dbl = false; t.squash = 0.18; addDust(); }
    }
    if (t.squash > 0) t.squash = Math.max(0, t.squash - dt * 0.9);
    if (t.exprT > 0) { t.exprT -= dt; if (t.exprT <= 0) t.expr = 'normal'; }
    if (g.streakT > 0) { g.streakT -= dt; if (g.streakT <= 0) g.streak = 0; }
    g.hist.push({ t: g.time, y: t.y }); while (g.hist.length > 90) g.hist.shift();
    // 모양
    t.poseT += dt * (g.speed / SPEED);
    if (g.state === 'pole') t.pose = 'cheer';
    else if (t.air) t.pose = 'jump';
    else if ((g.state === 'rescue' || g.state === 'bossWin') && g.speed < 5) t.pose = 'cheer';
    else if (g.speed < 20) t.pose = 'stand';
    else t.pose = (Math.floor(t.poseT / 0.14) % 2) ? 'run1' : 'run0';

    const me = (g.scroll + tx) / u;
    if (g.boss) updateBoss(dt);
    else {
      // 장애물
      for (const o of g.obs) {
        if (o.done) continue;
        const d = o.x - (me + 50);
        if (!o.asked && g.state === 'run' && d <= 275) {
          o.asked = true; g.state = 'ask'; g.target = 0;
          if (g.power && g.power.k === 'balloon') { g.power = null; t.vy = 0; }
        }
        if (o.asked && g.state === 'ask' && g.speed === 0 && !o.shown) { o.shown = true; g.opt.onAsk(o.qi); }
        if (o.jumpReady && !t.air && d <= (g.opt.slow ? 52 : 100) && d > -OW) { t.vy = 1150 * u; t.air = true; t.holdT = 1; Sfx.jump(); o.jumpReady = false; }
        if (d < -OW - 60) { o.done = true; g.opt.onPass && g.opt.onPass(o.qi); }
        break;
      }
      // 황금 당근 첫 안내
      if (g.opt.goldHint && !g.goldHinted && g.state === 'run') {
        const gi = g.items.find((it) => it.kind === 'G' && !it.got && it.x * u - g.scroll < W * 0.9);
        if (gi) { g.goldHinted = true; g.opt.onHint && g.opt.onHint('gold'); }
      }
      // 깃대
      if (g.state === 'run' && g.obs.every((o) => o.done)) {
        if (!g.poleHinted && me > g.finishX - 520) { g.poleHinted = true; g.opt.onHint && g.opt.onHint('pole'); }
        if (me >= g.finishX - 46) {
          const h = t.air ? t.y / u : 30;
          const tier = h >= 250 ? 4 : h >= 170 ? 3 : h >= 90 ? 2 : 1;
          g.pole = { h: Math.max(h, 30), tier, slide: 0 };
          g.state = 'pole'; g.target = 0; g.speed = 0; t.air = false; t.vy = 0; t.y = Math.max(h, 30) * u;
          g.flag = 1;
          Sfx.pole(tier); g.shake = 0.25;
          g.opt.onPole && g.opt.onPole(tier);
        }
      }
      if (g.state === 'pole') {
        t.y = Math.max(0, t.y - 380 * u * dt);
        g.flag = Math.max(0, g.flag - dt * 1.2);
        if (t.y <= 0 && g.flag <= 0.02) { g.state = 'walk'; g.target = 170; }
      }
      if (g.state === 'walk' && me >= g.finishX + 150) { g.state = 'rescue'; g.target = 0; g.rescueT = 0; g.opt.onHint && g.opt.onHint(null); }
      if (g.state === 'rescue' && g.speed === 0) {
        g.rescueT += dt;
        if (g.rescueT > 0.5 && !g.popped) {
          g.popped = true; Sfx.pop(); react('wow', 2);
          const fx = (g.finishX + 360) * u - g.scroll;
          burst(fx, gy - 120 * u, '#a5d8ff', 26); burst(fx, gy - 120 * u, '#ffc2d9', 20);
          hearts(fx, gy - 160 * u);
          fireworks(5);
        }
        if (g.rescueT > 3.0 && !g.ended) { g.ended = true; g.opt.onFinish({ gold: g.gold.slice(), pole: g.pole ? g.pole.tier : 1 }); }
      }
    }
    // 뛰어넘는 장애물
    for (const hd of g.hurdles) {
      if (hd.hit || hd.smashed) continue;
      if (g.state === 'ask') continue;
      if (hd.roll) hd.x -= 260 * dt;
      if (me + 22 > hd.x && me - 22 < hd.x + hd.w && t.y / u < hd.h - 4) {
        if (P && P.k === 'star') {   // 무지개 별: 부숴요
          hd.smashed = true; Sfx.bonk(); burst(hd.x * u - g.scroll + hd.w * u / 2, gy - hd.h * u / 2, '#ffd43b', 18); g.shake = 0.12;
        } else {
          hd.hit = true; g.bumps++;
          g.speed = Math.min(g.speed, 90); t.vy = 420 * u; t.air = true; t.dbl = true; t.holdT = 1;
          react('oops', 0.9); Sfx.bump(); g.shake = 0.15;
          g.opt.onBump && g.opt.onBump();
        }
      } else if (!hd.passed && me - 22 > hd.x + hd.w) {
        hd.passed = true; g.cleared = (g.cleared || 0) + 1;
        g.opt.onClear && g.opt.onClear(hd.tall);
      }
    }
    // 처음 하는 친구: 장애물이 보이면 점프 안내
    if (g.tapHint && !g.hintShown && g.state === 'run') {
      const h = g.hurdles.find((hd) => !hd.passed && hd.x * u - g.scroll < W * 0.85);
      if (h) { g.hintShown = true; g.opt.onHint && g.opt.onHint(true); }
    }
    // 행운: 판마다 한 번, 하늘을 가로질러요
    if (!g.boss && g.time > 9 && !g.flyer && Math.random() < dt * 0.15) {
      const night = g.env.phase === 'night';
      g.flyer = { kind: night ? 'meteor' : 'butterfly', x: W + 40, y: H * (0.18 + Math.random() * 0.15), vx: night ? -520 : -170, t: 0 };
    }
    if (g.flyer && !g.flyer.gone) {
      const f = g.flyer; f.t += dt; f.x += f.vx * dt; f.y += (f.kind === 'meteor' ? 60 : Math.sin(f.t * 5) * 60) * dt;
      if (f.caught) { f.y -= 200 * dt; if (f.t > 9) f.gone = true; }
      if (f.x < -60) f.gone = true;
    }
    // 아이템
    const magnet = P && P.k === 'star';
    for (const it of g.items) {
      if (it.got) continue;
      if (it.kind === 'q') {   // 선물 구름: 머리로 콩
        if (it.bump > 0) it.bump = Math.max(0, it.bump - dt * 4);
        if (it.used) continue;
        const sx = it.x * u - g.scroll;
        const head = t.y / u + 186;
        if (g.opt.blockHint && !g.blockHinted && sx < W * 0.85 && g.state === 'run') { g.blockHinted = true; g.opt.onHint && g.opt.onHint('block'); }
        if (t.vy > 0 && Math.abs(sx - tx) < 85 * u && head >= it.y - 10 && head <= it.y + 46) {
          it.used = true; it.bump = 1; t.vy = -60 * u; t.y = (it.y - 188) * u; g.shake = 0.15; Sfx.bonk();
          openBlock(it, sx, gy - (it.y + 32) * u);
        }
        continue;
      }
      if (it.rise) { it.y += 240 * dt; it.rise -= dt; if (it.rise <= 0) it.rise = 0; }
      let sx = it.x * u - g.scroll;
      if (magnet && Math.abs(sx - tx) < 320 * u && sx > tx - 60 * u) {   // 끌어당기기
        it.x -= (sx - tx) / u * dt * 5; it.y += ((t.y / u + 90) - it.y) * dt * 5; sx = it.x * u - g.scroll;
      }
      if (sx < -60) { it.got = true; continue; }
      if (Math.abs(sx - tx) < 58 * u && it.y > t.y / u - 20 && it.y < t.y / u + 200) {
        it.got = true;
        const sy = gy - it.y * u;
        if (it.kind === 'c') { g.streak++; g.streakT = 1.1; Sfx.carrot(g.streak); g.opt.onCarrot(1, sx, sy, 'c'); burst(sx, sy, '#ff922b', 6); }
        else if (it.kind === 'big') { Sfx.star(); g.opt.onCarrot(5, sx, sy, 'big'); burst(sx, sy, '#ffd43b', 16); react('wow', 0.9); }
        else if (it.kind === 's') { Sfx.star(); g.opt.onCarrot(3, sx, sy, 's'); burst(sx, sy, '#fff3a3', 14); react('happy', 0.8); }
        else if (it.kind === 'G') {
          g.gold[it.gi] = true; Sfx.gold(); g.shake = 0.2; burst(sx, sy, '#ffd43b', 30); burst(sx, sy, '#fff', 12); react('wow', 1.5);
          g.opt.onGold && g.opt.onGold(it.gi, sx, sy);
        }
      }
    }
    // 조각들
    for (const p of g.parts) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'rocket') { if (p.life <= 0) { explode(p.x, p.y, p.col); } }
      else if (p.kind !== 'heart' && p.kind !== 'goldpop') p.vy += 500 * dt;
    }
    g.parts = g.parts.filter((p) => p.life > 0);
    if (magnet && Math.random() < 0.7) g.parts.push({ x: tx - 30 * u, y: gy - t.y - (40 + Math.random() * 120) * u, vx: -200 - Math.random() * 100, vy: (Math.random() - .5) * 40, life: 0.5, max: 0.5, kind: 'spark', col: ['#ff8fa3', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'][Math.floor(Math.random() * 5)], size: 5 + Math.random() * 5 });
    for (const a of g.amb) { a.x += (a.vx - g.speed * 0.25) * dt; a.y += Math.sin(g.time * a.f + a.ph) * a.wob * dt; a.ph += dt; }
    g.amb = g.amb.filter((a) => a.x > -40);
    while (g.amb.length < 8) g.amb.push(newAmb(false));
    for (const s of g.seasonal) { s.x += (s.vx - g.speed * 0.4) * dt; s.y += s.vy * dt; s.rot += s.vr * dt; if (s.y > H + 20 || s.x < -30) Object.assign(s, newSeason(false)); }
  }
  function openBlock(it, x, y) {
    const g = G;
    if (it.gives === 'gold') {   // 구름 속 황금 당근: 톡 튀어나와 바로 내 것
      g.gold[1] = true; Sfx.gold(); burst(x, y - 40 * u, '#ffd43b', 30); burst(x, y - 40 * u, '#fff', 12); react('wow', 1.5);
      g.parts.push({ x, y: y - 30 * u, vx: 0, vy: -160, life: 1.1, max: 1.1, kind: 'goldpop', size: 1 });
      g.opt.onGold && g.opt.onGold(1, x, y);
    } else if (it.gives === 'star' || it.gives === 'balloon') {
      power(it.gives);
      burst(x, y, '#fff3a3', 18);
    } else {
      for (let i = 0; i < 6; i++) g.items.push({ x: it.x - 40 + i * 30, y: it.y + 60, kind: 'c', rise: 0.25 + i * 0.04 });
      burst(x, y, '#ff922b', 14);
    }
    g.opt.onBlock && g.opt.onBlock(it.gives);
  }
  /* 보스 진행 */
  function updateBoss(dt) {
    const g = G, B = g.bossS;
    const asking = g.state === 'ask';
    B.ox = B.ox == null ? W * 0.74 : B.ox + ((asking ? W * 0.8 : W * 0.72) - B.ox) * Math.min(1, dt * 3);
    B.oy = B.oy == null ? gy - 330 * u : B.oy + ((asking ? gy - 200 * u : gy - 330 * u) - B.oy) * Math.min(1, dt * 3);
    B.x = B.ox + Math.sin(g.time * 1.3) * 18 * u;
    B.y = B.oy + Math.sin(g.time * 2.1) * 14 * u;
    if (B.moodT > 0) { B.moodT -= dt; if (B.moodT <= 0 && !B.won) B.mood = 'angry'; }
    if (B.wind > 0) {
      B.wind -= dt;
      if (Math.random() < 0.6) g.parts.push({ x: B.x - 80 * u, y: B.y + (Math.random() * 80 - 20) * u, vx: -500 - Math.random() * 200, vy: (Math.random() - .5) * 60, life: 0.8, max: 0.8, kind: 'wind', col: 'rgba(255,255,255,.8)', size: 30 + Math.random() * 30 });
      react('oops', 0.4);
    }
    // 당근 날아가기
    for (const sh of B.shots) {
      sh.t += dt / 0.55;
      if (sh.t >= 1 && !sh.hit) {
        sh.hit = true;
        B.hp = Math.max(0, B.hp - sh.dmg); B.mood = 'hurt'; B.moodT = 0.9; g.shake = sh.big ? 0.35 : 0.22;
        Sfx.hit(sh.big); burst(B.x, B.y, '#ff922b', 20); burst(B.x, B.y, '#fff', 10);
        g.opt.onBossHp && g.opt.onBossHp(B.hp, B.max);
        if (B.hp <= 0) { B.won = true; B.mood = 'happy'; g.state = 'bossWin'; g.target = 0; g.rescueT = 0; Sfx.pop(); hearts(B.x, B.y); fireworks(6); react('wow', 3); }
      }
    }
    B.shots = B.shots.filter((s) => s.t < 1.2);
    if (g.state === 'run' && B.puffT > 0) {
      B.puffT -= dt;
      if (B.puffT <= 0) { const me = (g.scroll + tx) / u; g.hurdles.push({ x: me + (W - tx) / u + 40, w: 56, h: 56, roll: true, puff: true }); Sfx.wind(); B.mood = 'angry'; }
    }
    if (g.state === 'run') {
      B.phaseT -= dt;
      if (B.phaseT <= 0 && !B.shots.length) { g.state = 'ask'; g.target = 0; B.phaseT = 1.6; }
    }
    if (g.state === 'ask' && g.speed === 0 && !B.asking) { B.asking = true; g.opt.onAsk(-1); }
    if (g.state !== 'ask') B.asking = false;
    if (g.state === 'bossWin') {
      g.rescueT += dt;
      if (g.rescueT > 3.2 && !g.ended) { g.ended = true; g.opt.onFinish({ gold: [false, false, false], pole: 0 }); }
    }
    // 보스판에도 가끔 당근
    if (g.state === 'run' && Math.random() < dt * 0.8) {
      const me = (g.scroll + tx) / u;
      g.items.push({ x: me + W / u, y: 60 + Math.random() * 140, kind: 'c' });
    }
  }
  function newAmb(any) {
    return { x: any ? Math.random() * W : W + 20 + Math.random() * 200, y: H * (0.12 + Math.random() * 0.5), vx: -10 - Math.random() * 30, f: 1 + Math.random() * 2, ph: Math.random() * 6, wob: 20 + Math.random() * 30, s: 0.7 + Math.random() * 0.6, c: Math.floor(Math.random() * 4) };
  }
  function newSeason(any) {
    return { x: Math.random() * (W + 200), y: any ? Math.random() * H : -20, vx: -20 - Math.random() * 30, vy: 40 + Math.random() * 50, rot: Math.random() * 6, vr: (Math.random() - .5) * 3, s: 0.6 + Math.random() * 0.7, c: Math.floor(Math.random() * 3) };
  }
  function burst(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 100 + Math.random() * 260;
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 0.7 + Math.random() * 0.4, max: 1.1, kind: 'spark', col, size: 4 + Math.random() * 6 });
    }
  }
  function hearts(x, y) {
    for (let i = 0; i < 7; i++) G.parts.push({ x: x + (Math.random() - .5) * 100, y, vx: (Math.random() - .5) * 60, vy: -70 - Math.random() * 70, life: 2.2, max: 2.2, kind: 'heart', size: 16 + Math.random() * 12 });
  }
  function fireworks(n) {
    const cols = ['#ff8fb6', '#ffe066', '#74c0fc', '#8ce99a', '#b197fc', '#ffa94d'];
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (!G) return;
        G.parts.push({ x: W * (0.35 + Math.random() * 0.55), y: gy, vx: (Math.random() - .5) * 60, vy: -(520 + Math.random() * 200) * u, life: 0.75 + Math.random() * 0.2, max: 1, kind: 'rocket', col: cols[i % cols.length], size: 5 });
        Sfx.whistle();
      }, i * 380);
    }
  }
  function explode(x, y, col) {
    for (let i = 0; i < 34; i++) {
      const a = (Math.PI * 2 / 34) * i, s = 160 + Math.random() * 60;
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.1, max: 1.1, kind: 'spark', col, size: 4 + Math.random() * 3 });
    }
    Sfx.boom();
  }
  function addDust() {
    for (let i = 0; i < 8; i++) G.parts.push({ x: tx + (Math.random() - .5) * 60 * u, y: gy, vx: (Math.random() - .5) * 140, vy: -40 - Math.random() * 60, life: 0.4, max: 0.4, kind: 'dust', col: 'rgba(255,255,255,.8)', size: 6 + Math.random() * 6 });
  }

  /* ---------- 그리기 ---------- */
  function skyColors() {
    const ph = G.env.phase;
    if (ph === 'night') return ['#1f2766', '#4b4aa8', '#8e78d4'];
    if (ph === 'sunset') return ['#ff8fab', '#ffbfa3', '#ffe6c4'];
    return G.T.sky;
  }
  function ridge(L, scroll) {
    const [col, col2, base0, amp0, per0, par, seed] = L;
    const base = gy + base0 * u, amp = amp0 * u, per = per0 * u, off = scroll * par;
    const gr = c.createLinearGradient(0, base - amp, 0, gy);
    gr.addColorStop(0, col2); gr.addColorStop(0.55, col); gr.addColorStop(1, col);
    c.fillStyle = gr; c.beginPath(); c.moveTo(-10, gy + 10);
    let first = true;
    for (let x = -10; x <= W + 12; x += 12) {
      const v = (x + off) / per;
      const y = base - amp * (0.55 + 0.28 * Math.sin(v + seed) + 0.17 * Math.sin(v * 2.3 + seed * 1.7));
      if (first) { c.lineTo(x, y); first = false; } else c.lineTo(x, y);
    }
    c.lineTo(W + 12, gy + 10); c.closePath(); c.fill();
  }
  function drawBackground() {
    const g = G, T = g.T, env = g.env;
    const sc = skyColors();
    const sk = c.createLinearGradient(0, 0, 0, gy);
    sk.addColorStop(0, sc[0]); sk.addColorStop(0.55, sc[1]); sk.addColorStop(1, sc[2]);
    c.fillStyle = sk; c.fillRect(-20, -20, W + 40, H + 40);
    // 해·달
    const sx = W * 0.8, sy = H * 0.2;
    if (env.phase === 'night') {
      for (const s of g.stars) { c.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(g.time * 1.6 + s.p)); c.fillStyle = '#fff8d6'; circle(s.x * W, s.y * H, s.r * u * 1.3); }
      c.globalAlpha = 1;
      glow(sx, sy, 170 * u, 'rgba(255,246,200,.35)');
      c.fillStyle = '#fff6d6'; circle(sx, sy, 46 * u);
      c.fillStyle = 'rgba(230,214,170,.55)'; circle(sx - 14 * u, sy - 8 * u, 9 * u); circle(sx + 12 * u, sy + 12 * u, 7 * u); circle(sx + 16 * u, sy - 16 * u, 5 * u);
    } else {
      const sunY = env.phase === 'sunset' ? gy - 150 * u : sy;
      glow(sx, sunY, 220 * u, env.phase === 'sunset' ? 'rgba(255,170,120,.55)' : 'rgba(255,246,190,.75)');
      if (T.sun || env.phase === 'sunset') { c.fillStyle = env.phase === 'sunset' ? '#ffb070' : '#fff1a8'; circle(sx, sunY, 52 * u); c.fillStyle = 'rgba(255,255,255,.55)'; circle(sx - 14 * u, sunY - 14 * u, 18 * u); }
    }
    // 빛줄기
    if (T.rays && env.phase === 'day') {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const sw = Math.sin(g.time * 0.4 + i) * 20 * u;
        c.fillStyle = `rgba(255,250,220,${0.05 + (i % 2) * 0.03})`;
        c.beginPath(); c.moveTo(W * 0.92 + i * 30 * u, -20); c.lineTo(W * 0.92 + i * 30 * u + 60 * u, -20);
        c.lineTo(W * (0.15 + i * 0.13) + sw + 120 * u, gy); c.lineTo(W * (0.15 + i * 0.13) + sw, gy); c.closePath(); c.fill();
      }
      c.restore();
    }
    if (T.rainbow) drawRainbow(W * 0.6 - g.scroll * 0.02, gy - 60 * u, 440 * u);
    // 구름 (아래 그림자 있는 뭉게구름)
    for (let i = 0; i < 6; i++) {
      const span = W + 500 * u;
      const k = (0.7 + (i % 3) * 0.3) * u;
      const x = ((i * 331 * u - g.scroll * (0.04 + (i % 3) * 0.02) - g.time * 6 * u) % span + span) % span - 250 * u;
      cloud(x, H * (0.08 + (i % 4) * 0.07), k, env.phase === 'night');
    }
    // 산 / 바다
    if (T.sea) {
      ridge(T.ridges[0], g.scroll);
      const hz = gy - 210 * u;
      const sea = c.createLinearGradient(0, hz, 0, gy);
      sea.addColorStop(0, '#7fd0f5'); sea.addColorStop(0.5, '#4fb6ea'); sea.addColorStop(1, '#3aa3dc');
      c.fillStyle = sea; c.fillRect(0, hz, W, gy - hz + 4);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, hz, W, 3 * u);
      for (let row = 0; row < 4; row++) {
        const yy = hz + (30 + row * 42) * u, off = ((g.scroll * (0.15 + row * 0.08) + g.time * (12 + row * 6)) % (160 * u));
        c.fillStyle = `rgba(255,255,255,${0.25 + row * 0.12})`;
        for (let x = -off; x < W + 160 * u; x += 160 * u) { c.beginPath(); c.ellipse(x + (row % 2) * 70 * u, yy, (26 + row * 8) * u, 2.6 * u, 0, 0, 7); c.fill(); }
      }
      // 반짝이는 물결
      for (let i = 0; i < 10; i++) { const a = Math.max(0, Math.sin(g.time * 3 + i * 1.7)); if (a < 0.6) continue; c.globalAlpha = a - 0.4; drawStar((i * 157 + 40) % W, hz + (20 + (i * 37) % 160) * u, 6 * u, '#fff', 0); c.globalAlpha = 1; }
      // 젖은 모래 + 파도 거품
      const foam = gy - 14 * u + Math.sin(g.time * 1.6) * 4 * u;
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(0, gy);
      for (let x = 0; x <= W + 30; x += 30) c.lineTo(x, foam + Math.sin(x / 40 + g.time * 2 + g.scroll / 60) * 4 * u);
      c.lineTo(W + 30, gy + 4); c.lineTo(0, gy + 4); c.fill();
    } else {
      T.ridges.forEach((L) => ridge(L, g.scroll));
    }
    // 가운데 장식
    const midSpan = 300 * u;
    for (let i = -1; i < W / midSpan + 2; i++) {
      const n = Math.floor(g.scroll * 0.55 / midSpan) + i;
      midDeco(T.mid, n * midSpan - g.scroll * 0.55 + ((n * 97) % 110) * u, gy - 4 * u, n);
    }
    // 땅
    const winter = env.season === 'winter';
    const sg = c.createLinearGradient(0, gy, 0, H);
    sg.addColorStop(0, T.soil[0]); sg.addColorStop(1, T.soil[1]);
    c.fillStyle = sg; c.fillRect(0, gy, W, H - gy + 20);
    // 흙 줄무늬·조약돌
    c.fillStyle = 'rgba(110,83,99,.07)';
    const band = 260 * u, bo = g.scroll % band;
    for (let x = -bo - band; x < W + band; x += band) { c.beginPath(); c.ellipse(x + band / 2, gy + 74 * u, band * 0.42, 9 * u, 0, 0, 7); c.fill(); }
    const stp = 120 * u, off = g.scroll % stp;
    for (let x = -off; x < W + stp; x += stp) {
      const k = Math.floor((x + g.scroll) / stp) % 3;
      c.fillStyle = 'rgba(110,83,99,.12)'; c.beginPath(); c.ellipse(x + 40 * u, gy + (44 + k * 22) * u, (9 + k * 3) * u, (5 + k) * u, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x + 37 * u, gy + (42 + k * 22) * u, 4 * u, 2 * u, 0, 0, 7); c.fill();
    }
    // 풀 띠
    const gg = c.createLinearGradient(0, gy - 14 * u, 0, gy + 18 * u);
    gg.addColorStop(0, winter ? '#ffffff' : T.grass[0]); gg.addColorStop(1, winter ? '#dbe9f5' : T.grass[1]);
    c.fillStyle = gg; c.fillRect(-10, gy - 8 * u, W + 20, 20 * u);
    const bs = 40 * u, boff = g.scroll % bs;
    for (let x = -boff; x < W + bs; x += bs) { c.beginPath(); c.arc(x + bs / 2, gy + 11 * u, bs / 2, 0, Math.PI); c.fill(); }
    // 풀잎
    if (!T.sea) {
      c.fillStyle = winter ? '#ffffff' : T.grass[0];
      const ts = 16 * u, to = g.scroll % ts;
      for (let x = -to; x < W + ts; x += ts) {
        const hh = (6 + (Math.floor((x + g.scroll) / ts) % 3) * 3) * u;
        c.beginPath(); c.moveTo(x, gy - 7 * u); c.quadraticCurveTo(x + ts * 0.3, gy - 7 * u - hh, x + ts * 0.6, gy - 7 * u - hh * 1.1); c.lineTo(x + ts * 0.5, gy - 7 * u); c.fill();
      }
    }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, gy - 8 * u, W, 2 * u);
    // 땅 위 작은 꽃
    if (!winter && !T.sea) {
      const fs = 170 * u, fo = g.scroll % fs;
      for (let x = -fo; x < W + fs; x += fs) {
        const k = Math.floor((x + g.scroll) / fs);
        const col = ['#ffa8c5', '#fff3a3', '#d0bfff', '#ffffff', '#a5d8ff'][((k % 5) + 5) % 5];
        tinyFlower(x + 30 * u, gy - 9 * u, col);
        if (k % 2) tinyFlower(x + 52 * u, gy - 6 * u, '#ffffff');
      }
    }
    // 밤·노을 색 덧칠 (배경만)
    if (env.phase === 'night') { c.fillStyle = 'rgba(36,34,110,.30)'; c.fillRect(-20, -20, W + 40, H + 40); }
    else if (env.phase === 'sunset') { c.fillStyle = 'rgba(255,130,90,.10)'; c.fillRect(-20, -20, W + 40, H + 40); }
  }
  function glow(x, y, r, col) {
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function tinyFlower(x, y, col) {
    c.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; circle(x + Math.cos(a) * 4 * u, y + Math.sin(a) * 4 * u, 3 * u); }
    c.fillStyle = '#ffd43b'; circle(x, y, 2.4 * u);
  }
  function drawForeground() {
    const g = G, T = g.T;
    const fs = 210 * u, fo = (g.scroll * 1.25) % fs;
    for (let x = -fo - fs; x < W + fs; x += fs) {
      const k = Math.floor((x + g.scroll * 1.25) / fs);
      if (((k % 3) + 3) % 3 === 1) continue;
      const bx = x + ((k * 53) % 90) * u, by = H + 6;
      c.save();
      if (T.fore === 'tuft') {
        c.fillStyle = g.env.season === 'winter' ? 'rgba(235,242,250,.95)' : T.grass[1];
        for (let i = 0; i < 6; i++) {
          const a = -0.9 + i * 0.36, hh = (46 + (i % 3) * 16) * u;
          c.beginPath(); c.moveTo(bx + i * 8 * u, by); c.quadraticCurveTo(bx + i * 8 * u + Math.sin(a) * hh * 0.4, by - hh * 0.6, bx + i * 8 * u + Math.sin(a) * hh * 0.7 + Math.sin(g.time * 2 + i) * 3 * u, by - hh); c.lineTo(bx + i * 8 * u + 9 * u, by); c.fill();
        }
      } else if (T.fore === 'shell') {
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(bx, by - 18 * u, 40 * u, 12 * u, 0, 0, 7); c.fill();
        drawStar(bx + 20 * u, by - 30 * u, 14 * u, '#ffa94d', 0.3);
      } else {
        for (let i = 0; i < 5; i++) drawStar(bx + i * 16 * u, by - (20 + (i % 2) * 18) * u, 7 * u, ['#ffe066', '#ffffff', '#c5f6fa'][i % 3], g.time + i);
      }
      c.restore();
    }
    // 가장자리 살짝 어둡게
    const vg = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.45, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(60,30,70,0)'); vg.addColorStop(1, 'rgba(60,30,70,.16)');
    c.fillStyle = vg; c.fillRect(-20, -20, W + 40, H + 40);
  }
  function draw() {
    const g = G, T = g.T, env = g.env;
    c.save();
    if (g.shake > 0) c.translate((Math.random() - .5) * 14 * u * g.shake * 3, (Math.random() - .5) * 14 * u * g.shake * 3);
    drawBackground();

    if (!g.boss) drawFinish();
    for (const o of g.obs) {
      const sx = o.x * u - g.scroll;
      if (sx > W + 200 || sx < -300) continue;
      drawObstacle(o.type, sx, gy, OW * u);
    }
    for (const hd of g.hurdles) {
      if (hd.smashed) continue;
      const sx = hd.x * u - g.scroll; if (sx > W + 120 || sx < -160) continue;
      drawHurdle(hd, sx, gy);
    }
    // 아이템
    for (const it of g.items) {
      if (it.got) continue;
      const sx = it.x * u - g.scroll; if (sx > W + 80 || sx < -80) continue;
      const bob = Math.sin(g.time * 4 + it.x) * 5 * u;
      const sy = gy - it.y * u + bob;
      if (it.kind === 'c') drawCarrot(sx, sy, 1);
      else if (it.kind === 'big') { c.save(); c.globalAlpha = 0.4 + 0.2 * Math.sin(g.time * 6); c.fillStyle = '#ffe066'; circle(sx, sy, 34 * u); c.restore(); drawCarrot(sx, sy, 1.4, 'gold'); }
      else if (it.kind === 's') drawStar(sx, sy, 24 * u, '#ffe066', g.time * 2);
      else if (it.kind === 'G') drawGold(sx, sy);
      else if (it.kind === 'q') drawBlock(sx, gy - (it.y + 32) * u - it.bump * 18 * u, it.used);
    }
    // 친구들
    const team = g.opt.team || [];
    team.forEach((f, i) => {
      const lag = (i + 1) * 0.16;
      const h = g.hist.find((p) => p.t >= g.time - lag) || { y: 0 };
      const hop = g.speed > 20 ? Math.abs(Math.sin(g.time * 9 + i)) * 14 * u : ((g.state === 'rescue' || g.state === 'bossWin') ? Math.abs(Math.sin(g.time * 7 + i)) * 20 * u : 0);
      const fw = 92 * u, fh = fw * 134 / 120;
      const fx = tx - 130 * u - i * 98 * u;
      const fy = Math.min(h.y, 260 * u);
      shadow(fx, gy, 34 * u * (1 - Math.min(fy / 500, 0.6)));
      const im = ImgCache.get('f:' + f.id + ':' + f.top, () => ART.friend(f.id, f.top));
      if (im.ok) c.drawImage(im.img, fx - fw / 2, gy - fh - fy - hop + 6 * u, fw, fh);
    });
    if (g.talk && g.talk.t > 0) {
      g.talk.t -= 1 / 60;
      const fx = tx - 130 * u - g.talk.i * 98 * u, fy = gy - 150 * u;
      c.save(); c.font = `${22 * u}px Jua, sans-serif`;
      const w = c.measureText(g.talk.text).width + 26 * u;
      c.globalAlpha = Math.min(1, g.talk.t * 3);
      c.fillStyle = '#fff'; roundRect(fx - w / 2, fy - 44 * u, w, 40 * u, 18 * u); c.fill(); ol(2.4);
      c.beginPath(); c.moveTo(fx - 8 * u, fy - 5 * u); c.lineTo(fx, fy + 8 * u); c.lineTo(fx + 8 * u, fy - 5 * u); c.fill();
      c.fillStyle = '#6e5363'; c.textAlign = 'center'; c.fillText(g.talk.text, fx, fy - 17 * u); c.textAlign = 'left';
      c.restore();
    }
    // 보스
    if (g.boss) drawBoss();
    // 포포
    drawTori();
    // 조각
    for (const p of g.parts) {
      const a = Math.max(0, p.life / p.max);
      c.globalAlpha = a;
      if (p.kind === 'heart') heartPath(p.x, p.y, p.size * u, '#ff8fb6');
      else if (p.kind === 'dust') { c.fillStyle = p.col; circle(p.x, p.y, p.size * u); }
      else if (p.kind === 'wind') { c.strokeStyle = p.col; c.lineWidth = 4 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x + p.size * u * 0.5, p.y - 8 * u, p.x + p.size * u, p.y); c.stroke(); }
      else if (p.kind === 'goldpop') { c.globalAlpha = Math.min(1, a * 2); drawGold(p.x, p.y); }
      else if (p.kind === 'rocket') { c.globalAlpha = 1; c.fillStyle = p.col; circle(p.x, p.y, 5 * u); c.fillStyle = 'rgba(255,255,255,.6)'; circle(p.x, p.y + 10 * u, 3 * u); }
      else drawStar(p.x, p.y, p.size * u, p.col, p.life * 6);
      c.globalAlpha = 1;
    }
    for (const a of g.amb) drawAmb(g.env.phase === 'night' && g.T.amb === 'butterfly' ? 'firefly' : g.T.amb, a);
    drawFlyer();
    drawForeground();
    drawSeason();
    // 파워업 남은 시간
    if (g.power) {
      const k = g.power.t / g.power.max;
      c.fillStyle = 'rgba(255,255,255,.85)'; roundRect(tx - 50 * u, gy - g.tori.y - 240 * u, 100 * u, 14 * u, 7 * u); c.fill();
      c.fillStyle = g.power.k === 'star' ? '#ffd43b' : '#ff8fb6'; roundRect(tx - 50 * u, gy - g.tori.y - 240 * u, 100 * u * k, 14 * u, 7 * u); c.fill();
    }
    c.restore();
  }
  function drawTori() {
    const g = G, t = g.tori;
    const th = 196 * u, tw = th * 200 / 260;
    shadow(tx, gy, 52 * u * (1 - Math.min(t.y / 600, 0.6)));
    const P = g.power;
    if (P && P.k === 'star') {   // 무지개 빛
      const hue = (g.time * 360) % 360;
      c.save(); c.globalAlpha = 0.45; c.fillStyle = `hsl(${hue},100%,75%)`; circle(tx, gy - t.y - 100 * u, 105 * u); c.restore();
    }
    if (P && P.k === 'balloon') {   // 풍선 다발
      const cols = ['#ff8fa3', '#74c0fc', '#ffe066'];
      cols.forEach((col, i) => {
        const bx = tx + (i - 1) * 34 * u, by = gy - t.y - 290 * u - (i === 1 ? 24 * u : 0) + Math.sin(g.time * 3 + i) * 4 * u;
        c.strokeStyle = '#6e5363'; c.lineWidth = 1.6 * u; c.beginPath(); c.moveTo(tx, gy - t.y - 150 * u); c.lineTo(bx, by + 30 * u); c.stroke();
        c.fillStyle = col; c.beginPath(); c.ellipse(bx, by, 24 * u, 30 * u, 0, 0, 7); c.fill(); ol(2.6);
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(bx - 8 * u, by - 10 * u, 5 * u, 8 * u, -0.4, 0, 7); c.fill();
      });
    }
    const key = JSON.stringify(g.look) + t.pose + t.expr;
    const im = ImgCache.get(key, () => ART.tori(g.look, t.pose, t.expr));
    const bob = (!t.air && g.speed > 20) ? Math.abs(Math.sin(t.poseT / 0.14 * Math.PI)) * 6 * u : 0;
    c.save();
    c.translate(tx, gy - t.y - bob + 4 * u);
    c.scale(1 + t.squash, 1 - t.squash);
    if (im.ok) c.drawImage(im.img, -tw / 2, -th, tw, th);
    else {
      const fb = ImgCache.get(JSON.stringify(g.look) + 'stand' + 'normal', () => ART.tori(g.look, 'stand', 'normal'));
      if (fb.ok) c.drawImage(fb.img, -tw / 2, -th, tw, th);
    }
    c.restore();
  }
  function drawBoss() {
    const g = G, B = g.bossS;
    const bw = 300 * u, bh = bw * 200 / 240;
    const sc = B.mood === 'hurt' ? 1 + Math.sin(g.time * 40) * 0.03 : 1;
    const size = 0.75 + 0.25 * (B.hp / B.max);
    const im = ImgCache.get('boss:' + g.opt.bossIdx + ':' + B.mood, () => ART.boss(g.opt.bossIdx, B.mood));
    c.save(); c.translate(B.x, B.y); c.scale(sc * (B.won ? 1 : size), sc * (B.won ? 1 : size));
    if (im.ok) c.drawImage(im.img, -bw / 2, -bh / 2, bw, bh);
    c.restore();
    // 날아가는 당근
    for (const sh of B.shots) {
      const k = Math.min(1, sh.t);
      const sx = tx + 40 * u, sy = gy - g.tori.y - 120 * u;
      const x = sx + (B.x - sx) * k, y = sy + (B.y - sy) * k - Math.sin(k * Math.PI) * 140 * u;
      if (sh.t < 1) { c.save(); c.translate(x, y); c.rotate(k * 12); drawCarrot(0, 0, sh.big ? 1.5 : 1.1, sh.big ? 'gold' : null); c.restore(); }
    }
  }

  function drawFlyer() {
    const f = G.flyer; if (!f || f.gone || f.caught) return;
    c.save();
    if (f.kind === 'meteor') {
      const gr = c.createLinearGradient(f.x, f.y, f.x + 160 * u, f.y - 20 * u);
      gr.addColorStop(0, 'rgba(255,243,163,1)'); gr.addColorStop(1, 'rgba(255,243,163,0)');
      c.strokeStyle = gr; c.lineWidth = 8 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + 160 * u, f.y - 20 * u); c.stroke();
      drawStar(f.x, f.y, 20 * u, '#fff3a3', f.t * 6);
    } else {
      const flap = Math.abs(Math.sin(f.t * 12)) * 0.8 + 0.2, s = 1.8 * u;
      c.fillStyle = 'rgba(255,224,102,.35)'; circle(f.x, f.y, 40 * u);
      c.fillStyle = '#ffd43b';
      c.beginPath(); c.ellipse(f.x - 10 * s, f.y, 11 * s * flap, 14 * s, -0.4, 0, 7); c.ellipse(f.x + 10 * s, f.y, 11 * s * flap, 14 * s, 0.4, 0, 7); c.fill(); ol(2);
      c.fillStyle = OLc; c.fillRect(f.x - 2 * s, f.y - 10 * s, 4 * s, 20 * s);
      drawStar(f.x + 24 * u, f.y - 22 * u, 7 * u, '#fff', f.t * 4);
    }
    c.restore();
  }

  /* ---------- 그림 조각 ---------- */
  const OLc = '#6e5363';
  function circle(x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); c.fill(); }
  function roundRect(x, y, w, h, r) { r = Math.min(r, Math.abs(w) / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ol(w = 3.4) { c.strokeStyle = OLc; c.lineWidth = w * u; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  function shadow(x, y, r) { c.fillStyle = 'rgba(110,83,99,.16)'; c.beginPath(); c.ellipse(x, y + 2 * u, r, r * 0.22, 0, 0, Math.PI * 2); c.fill(); }
  function cloud(x, y, k, night) {
    const puff = (dy, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y + dy, 26 * k, 0, 7); c.arc(x + 30 * k, y - 16 * k + dy, 34 * k, 0, 7); c.arc(x + 64 * k, y - 6 * k + dy, 28 * k, 0, 7); c.arc(x + 92 * k, y + 4 * k + dy, 20 * k, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 46 * k, y + 14 * k + dy, 58 * k, 14 * k, 0, 0, 7); c.fill(); };
    puff(8 * k, night ? 'rgba(130,120,200,.35)' : 'rgba(170,190,230,.35)');
    puff(0, night ? 'rgba(220,215,255,.45)' : 'rgba(255,255,255,.96)');
    if (!night) { c.fillStyle = 'rgba(255,255,255,1)'; c.beginPath(); c.arc(x + 24 * k, y - 22 * k, 14 * k, 0, 7); c.fill(); }
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
    c.restore();
  }
  function drawGold(x, y) {   // 숨은 황금 당근
    const t = G.time;
    c.save();
    c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 5);
    for (let i = 0; i < 8; i++) { c.save(); c.translate(x, y); c.rotate(t + i * Math.PI / 4); c.fillStyle = '#fff3a3'; c.fillRect(0, -3 * u, 54 * u, 6 * u); c.restore(); }
    c.globalAlpha = 1; c.restore();
    c.fillStyle = 'rgba(255,224,102,.5)'; circle(x, y, 32 * u);
    drawCarrot(x, y, 1.5, true);
    drawStar(x + 24 * u, y - 26 * u, 8 * u, '#fff', t * 3);
  }
  function drawBlock(x, y, used) {   // ❓ 선물 구름
    c.save();
    c.fillStyle = used ? '#e9e3ea' : '#fff';
    c.beginPath(); c.arc(x - 26 * u, y + 4 * u, 22 * u, 0, 7); c.arc(x, y - 10 * u, 28 * u, 0, 7); c.arc(x + 26 * u, y + 4 * u, 22 * u, 0, 7); c.fill();
    roundRect(x - 44 * u, y - 2 * u, 88 * u, 30 * u, 14 * u); c.fill(); ol(3);
    if (!used) {
      const glow = 0.5 + 0.5 * Math.sin(G.time * 5);
      c.fillStyle = `rgba(255,212,59,${0.25 + glow * 0.25})`; circle(x, y + 2 * u, 40 * u);
      c.fillStyle = '#ff8fb6'; c.font = `${36 * u}px Jua, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('?', x, y + 6 * u); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    } else { c.fillStyle = '#c9bfd6'; circle(x - 10 * u, y + 6 * u, 3 * u); circle(x + 10 * u, y + 6 * u, 3 * u); }
    c.restore();
  }
  const HCOL = { m: ['#7bd88a', '#e0b07c'], k: ['#5cb86e', '#c49770'], e: ['#ff9fb0', '#ffd59a'], r: ['#ffc2e0', '#c9b6ff'] };
  function drawHurdle(hd, x, y) {
    const w = hd.w * u, h = hd.h * u;
    const [bush, crate] = HCOL[G.opt.world] || HCOL.m;
    c.save();
    shadow(x + w / 2, y, w * 0.6);
    if (hd.puff) {   // 보스가 굴리는 심술 구름 공
      c.translate(x + w / 2, y - h / 2); c.rotate(-G.time * 5);
      c.fillStyle = '#c3c9d8'; c.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; c.arc(Math.cos(a) * h * 0.28, Math.sin(a) * h * 0.28, h * 0.26, 0, 7); } c.fill();
      c.beginPath(); c.arc(0, 0, h * 0.36, 0, 7); c.fill(); ol(2.6);
      c.rotate(G.time * 5);
      c.strokeStyle = OLc; c.lineWidth = 3 * u; c.beginPath(); c.moveTo(-12 * u, -8 * u); c.lineTo(-4 * u, -4 * u); c.moveTo(12 * u, -8 * u); c.lineTo(4 * u, -4 * u); c.stroke();
      c.fillStyle = OLc; circle(-7 * u, 2 * u, 3 * u); circle(7 * u, 2 * u, 3 * u);
      c.restore(); return;
    }
    if (hd.tall) {   // 상자 두 개
      for (let k = 0; k < 2; k++) {
        const bh = h / 2, by = y - bh * (k + 1), bw = w - k * 6 * u, bx = x + k * 3 * u;
        const gr = c.createLinearGradient(0, by, 0, by + bh); gr.addColorStop(0, '#fff8ee'); gr.addColorStop(0.15, crate); gr.addColorStop(1, crate);
        c.fillStyle = gr; roundRect(bx, by, bw, bh - 2 * u, 8 * u); c.fill(); ol(3);
        c.strokeStyle = 'rgba(110,83,99,.25)'; c.lineWidth = 2.4 * u; c.beginPath(); c.moveTo(bx + 6 * u, by + bh * 0.5); c.lineTo(bx + bw - 6 * u, by + bh * 0.5); c.stroke();
        drawStar(bx + bw / 2, by + bh / 2 - 1 * u, 9 * u, '#fff3a3', 0);
      }
    } else {   // 동글 덤불 (테두리 있게)
      const shape = (e) => { c.beginPath(); c.arc(x + w * 0.22, y - h * 0.38, h * 0.38 + e, 0, 7); c.arc(x + w * 0.55, y - h * 0.58, h * 0.46 + e, 0, 7); c.arc(x + w * 0.85, y - h * 0.36, h * 0.36 + e, 0, 7); c.fill(); c.beginPath(); c.rect(x + w * 0.05 - e, y - h * 0.4, w * 0.9 + e * 2, h * 0.4 + e * 0.2); c.fill(); };
      c.fillStyle = OLc; shape(3 * u);
      const bg = c.createLinearGradient(0, y - h, 0, y); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.25, bush); bg.addColorStop(1, bush);
      c.fillStyle = bg; shape(0);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x + w * 0.45, y - h * 0.78, h * 0.18, h * 0.09, -0.4, 0, 7); c.fill();
      c.fillStyle = '#fff'; circle(x + w * 0.3, y - h * 0.5, 4.5 * u); circle(x + w * 0.72, y - h * 0.62, 4.5 * u);
      c.fillStyle = '#ffd43b'; circle(x + w * 0.3, y - h * 0.5, 2 * u); circle(x + w * 0.72, y - h * 0.62, 2 * u);
    }
    if (hd.hit) { c.globalAlpha = 0.5; }
    c.restore();
  }
  function ring(x, y) {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      G.parts.push({ x, y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 120, life: 0.45, max: 0.45, kind: 'spark', col: ['#fff3a3', '#ffc9de', '#c5f6fa'][i % 3], size: 5 });
    }
  }
  function sleepy(x, y, k = 1) {
    c.strokeStyle = OLc; c.lineWidth = 3 * u * k; c.lineCap = 'round';
    c.beginPath(); c.arc(x - 14 * u * k, y, 6 * u * k, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.beginPath(); c.arc(x + 14 * u * k, y, 6 * u * k, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,143,171,.6)'; c.beginPath(); c.ellipse(x - 26 * u * k, y + 10 * u * k, 7 * u * k, 4 * u * k, 0, 0, 7); c.ellipse(x + 26 * u * k, y + 10 * u * k, 7 * u * k, 4 * u * k, 0, 0, 7); c.fill();
  }
  function zzz(x, y) {
    c.fillStyle = '#9b8291'; c.font = `${22 * u}px Jua, sans-serif`;
    const t = (G.time * 0.8) % 1;
    c.globalAlpha = 1 - t; c.fillText('z', x + t * 20 * u, y - t * 30 * u); c.globalAlpha = 1;
  }
  function drawObstacle(type, x, y, w) {
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
        c.fillRect(x + w * 0.2, y - h * 0.3, w * 0.65, h * 0.3);
        c.strokeStyle = '#d0bfff'; c.lineWidth = 3 * u; c.stroke();
        sleepy(x + w * 0.55, y - h * 0.38, 0.7); zzz(x + w, y - h * 0.85); break;
    }
    c.restore();
  }
  function midDeco(kind, x, y, n) {
    c.save();
    const winter = G.env.season === 'winter';
    switch (kind) {
      case 'bush': {
        const base = n % 2 ? '#8fdc93' : '#74d27e';
        c.fillStyle = 'rgba(60,120,70,.18)'; c.beginPath(); c.ellipse(x + 34 * u, y, 60 * u, 8 * u, 0, 0, 7); c.fill();
        c.fillStyle = base;
        c.beginPath(); c.arc(x, y - 22 * u, 28 * u, 0, 7); c.arc(x + 34 * u, y - 32 * u, 34 * u, 0, 7); c.arc(x + 68 * u, y - 20 * u, 26 * u, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.arc(x + 26 * u, y - 46 * u, 14 * u, 0, 7); c.arc(x - 6 * u, y - 32 * u, 9 * u, 0, 7); c.fill();
        if (winter) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + 34 * u, y - 58 * u, 30 * u, 10 * u, 0, 0, 7); c.fill(); }
        else if (n % 3 === 0) { tinyFlower(x + 20 * u, y - 40 * u, '#ffa8c5'); tinyFlower(x + 52 * u, y - 50 * u, '#fff3a3'); }
        break;
      }
      case 'tree': {
        const leaf = G.env.season === 'autumn' ? (n % 2 ? '#ffb070' : '#ff9a8a') : (n % 2 ? '#6fd17f' : '#54c06c');
        c.fillStyle = 'rgba(40,90,60,.18)'; c.beginPath(); c.ellipse(x + 31 * u, y, 50 * u, 8 * u, 0, 0, 7); c.fill();
        c.fillStyle = '#a87b5a'; roundRect(x + 22 * u, y - 120 * u, 18 * u, 122 * u, 6 * u); c.fill();
        c.fillStyle = leaf;
        c.beginPath(); c.arc(x + 31 * u, y - 140 * u, 56 * u, 0, 7); c.arc(x - 6 * u, y - 112 * u, 36 * u, 0, 7); c.arc(x + 66 * u, y - 112 * u, 36 * u, 0, 7); c.fill();
        c.fillStyle = 'rgba(0,60,30,.12)'; c.beginPath(); c.ellipse(x + 31 * u, y - 96 * u, 60 * u, 16 * u, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x + 14 * u, y - 168 * u, 20 * u, 0, 7); c.fill();
        if (winter) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + 31 * u, y - 186 * u, 40 * u, 12 * u, 0, 0, 7); c.fill(); }
        else if (n % 3 === 0) { c.fillStyle = '#ff6b6b'; circle(x + 10 * u, y - 130 * u, 7 * u); circle(x + 50 * u, y - 150 * u, 7 * u); }
        break;
      }
      case 'palm':
        if (n % 2) { c.fillStyle = 'rgba(255,255,255,.7)'; drawStar(x + 10 * u, y - 4 * u, 9 * u, '#ff8fa3', 0.3); break; }
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
    if (fx > W + 500 || fx < -500) return;
    // 깃대
    const top = gy - POLE_H * u;
    c.fillStyle = '#fff'; roundRect(fx - 7 * u, top, 14 * u, POLE_H * u, 7 * u); c.fill(); ol(3.4);
    c.fillStyle = '#ffd43b'; circle(fx, top - 6 * u, 15 * u); ol(3);
    // 높이 눈금 (별)
    [[250, '#ffd43b'], [170, '#ffc9de'], [90, '#a5d8ff']].forEach(([h, col]) => drawStar(fx - 26 * u, gy - (h + 100) * u, 9 * u, col, 0));
    // 깃발 (포포가 미끄러져 내려오면 같이 내려옴)
    const fy = top + 12 * u + (1 - g.flag) * (POLE_H - 90) * u * (g.state === 'run' ? 0 : 1);
    c.fillStyle = '#ff8fb6'; c.beginPath(); c.moveTo(fx + 7 * u, fy); c.lineTo(fx + 86 * u, fy + 30 * u); c.lineTo(fx + 7 * u, fy + 60 * u); c.closePath(); c.fill(); ol(3);
    drawStar(fx + 36 * u, fy + 30 * u, 12 * u, '#fff', 0);
    // 받침
    c.fillStyle = '#ced4da'; roundRect(fx - 30 * u, gy - 26 * u, 60 * u, 30 * u, 6 * u); c.fill(); ol(3);
    // 구할 친구
    const bx = (g.finishX + 360) * u - g.scroll, by = gy;
    const fw = 110 * u, fh = fw * 134 / 120;
    const fid = g.opt.rescue;
    if (fid) {
      const hop = g.popped ? Math.abs(Math.sin(g.time * 8)) * 26 * u : Math.sin(g.time * 3) * 3 * u;
      const im = ImgCache.get('f:' + fid + ':', () => ART.friend(fid, ''));
      shadow(bx, by, 40 * u);
      if (im.ok) c.drawImage(im.img, bx - fw / 2, by - fh - hop + 6 * u, fw, fh);
      if (!g.popped) {
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
    } else {   // 보물 상자
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
        c.fillStyle = ['#ffa8c5', '#fff3a3', '#d0bfff', '#a5d8ff'][a.c];
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
  function drawSeason() {
    const se = G.env.season;
    if (se === 'summer') return;
    for (const p of G.seasonal) {
      const s = p.s * u;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      if (se === 'winter') { c.fillStyle = 'rgba(255,255,255,.95)'; circle(0, 0, 5 * s); }
      else if (se === 'autumn') { c.fillStyle = ['#ffa94d', '#ff8787', '#ffd43b'][p.c]; c.beginPath(); c.ellipse(0, 0, 10 * s, 5 * s, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(110,83,99,.4)'; c.lineWidth = 1.2 * u; c.beginPath(); c.moveTo(-9 * s, 0); c.lineTo(9 * s, 0); c.stroke(); }
      else { c.fillStyle = ['#ffc9de', '#ffdeeb', '#fff0f6'][p.c]; c.beginPath(); c.ellipse(0, 0, 7 * s, 4.5 * s, 0, 0, 7); c.fill(); }
      c.restore();
    }
  }

  return {
    init, start, stop, tap, release, answered, react, cheer, power, bossAttack, bossTaunt, setPaused, envNow,
    get active() { return !!G; }, get state() { return G && G.state; }, get u() { return u; }, get tx() { return tx; }, _G: () => G,
  };
})();
