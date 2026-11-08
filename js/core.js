/* 토리의 반짝 달리기 — 저장 · 소리 · 목소리 · 효과 */
'use strict';
const APP_VERSION = '2026.11.09';

/* ---------------- 저장 ---------------- */
const Store = (() => {
  const KEY = 'tori-run-v1';
  const blank = () => ({
    v: 1, carrots: 0, earned: 0, plays: 0, correct: 0,
    owned: { 'fur:white': true },
    look: { fur: 'white', hat: '', cloth: '', face: '', shoes: '', back: '' },
    stars: {},            // 'm0' → 1~3
    friends: {},          // id → { top: '' }
    team: [],             // 같이 달리는 친구 (최대 3)
    gifts: [],            // 받은 특별 옷
    seen: {},             // 처음 본 안내
    recent: [],           // 최근 문제 키 (반복 줄이기)
    day: '', streak: 0, lastDay: '',
    set: { sfx: true, voice: true, music: true },
    name: '재윤', pos: 0, gold: {}, boss: {}, stat: {}, stamps: {}, bday: null,
  });
  let S = blank();
  let memOnly = false;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const b = blank();
        S = Object.assign(b, d);
        S.look = Object.assign(b.look, d.look || {});
        S.set = Object.assign(b.set, d.set || {});
        S.owned = Object.assign(b.owned, d.owned || {});
      }
    } catch (e) { memOnly = true; }
    return S;
  }
  let saveT = 0;
  function save(now) {
    if (memOnly) return;
    clearTimeout(saveT);
    const go = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 공간 */ } };
    if (now) go(); else saveT = setTimeout(go, 150);
  }
  function reset() { S = blank(); save(true); return S; }
  return { load, save, reset, get S() { return S; } };
})();

/* 사진 보관 (IndexedDB, 안 되면 메모리) */
const Photos = (() => {
  let db = null; const mem = [];
  function open() {
    return new Promise((res) => {
      try {
        const r = indexedDB.open('tori-photos', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' });
        r.onsuccess = () => { db = r.result; res(); };
        r.onerror = () => res();
      } catch (e) { res(); }
    });
  }
  const ready = open();
  async function add(dataUrl) {
    await ready;
    const item = { id: Date.now() + '' + Math.floor(Math.random() * 1000), at: Date.now(), url: dataUrl };
    if (!db) { mem.unshift(item); return item; }
    return new Promise((res) => { const tx = db.transaction('p', 'readwrite'); tx.objectStore('p').put(item); tx.oncomplete = () => res(item); tx.onerror = () => { mem.unshift(item); res(item); }; });
  }
  async function all() {
    await ready;
    if (!db) return mem.slice();
    return new Promise((res) => { const r = db.transaction('p').objectStore('p').getAll(); r.onsuccess = () => res(r.result.sort((a, b) => b.at - a.at).concat(mem)); r.onerror = () => res(mem.slice()); });
  }
  async function del(id) {
    await ready;
    const i = mem.findIndex((x) => x.id === id); if (i >= 0) mem.splice(i, 1);
    if (!db) return;
    return new Promise((res) => { const tx = db.transaction('p', 'readwrite'); tx.objectStore('p').delete(id); tx.oncomplete = res; tx.onerror = res; });
  }
  return { add, all, del };
})();

/* ---------------- 소리 ---------------- */
const Sfx = (() => {
  let ac = null, master = null, musicGain = null, musicOn = false, musicTimer = 0, step = 0;
  function ctx() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
        musicGain = ac.createGain(); musicGain.gain.value = 0.12; musicGain.connect(master);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function tone(f, t0, dur, type = 'sine', vol = 0.3, to = null, out = null) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, a.currentTime + t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, a.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, a.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol, a.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
    o.connect(g); g.connect(out || master); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
  }
  const on = () => Store.S.set.sfx;
  const S = {
    tap() { if (on()) tone(660, 0, 0.07, 'triangle', 0.18); },
    jump() { if (on()) tone(380, 0, 0.22, 'sine', 0.25, 820); },
    carrot(n = 1) {   // 연달아 먹으면 음이 올라가요
      if (!on()) return;
      const SC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      const f = 784 * Math.pow(2, SC[Math.min(n - 1, SC.length - 1)] / 12);
      tone(f, 0, 0.08, 'triangle', 0.2); tone(f * 1.5, 0.05, 0.1, 'triangle', 0.14);
    },
    bonk() { if (on()) { tone(220, 0, 0.08, 'square', 0.12, 330); [880, 1175, 1568].forEach((f, i) => tone(f, 0.08 + i * 0.06, 0.12, 'triangle', 0.16)); } },
    gold() { if (on()) [1046, 1318, 1568, 2093, 2637].forEach((f, i) => tone(f, i * 0.07, 0.28, 'triangle', 0.18)); },
    power() { if (on()) [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.06, 0.14, 'square', 0.07)); },
    pole(t = 1) { if (on()) { tone(330, 0, 0.5, 'sine', 0.2, 990); for (let i = 0; i < t + 1; i++) tone(1046 * Math.pow(1.122, i * 2), 0.45 + i * 0.1, 0.18, 'triangle', 0.18); } },
    hit(big) { if (on()) { tone(big ? 160 : 220, 0, 0.18, 'square', 0.14, 80); tone(660, 0.05, 0.12, 'triangle', 0.15); } },
    wind() { if (on()) tone(400, 0, 0.5, 'sawtooth', 0.04, 150); },
    whistle() { if (on()) tone(600, 0, 0.6, 'sine', 0.07, 1400); },
    boom() { if (on()) { tone(120, 0, 0.35, 'square', 0.12, 50); [1318, 1568, 2093].forEach((f, i) => tone(f, 0.05 + i * 0.04, 0.2, 'triangle', 0.08)); } },
    star() { if (on()) [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, i * 0.05, 0.16, 'triangle', 0.16)); },
    right() { if (on()) [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.08, 0.22, 'triangle', 0.24)); },
    wrong() { if (on()) { tone(330, 0, 0.18, 'sine', 0.22, 260); tone(262, 0.16, 0.25, 'sine', 0.2, 220); } },
    pop() { if (on()) tone(500, 0, 0.12, 'sine', 0.3, 1400); },
    buy() { if (on()) [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.2, 'square', 0.08)); },
    fanfare() { if (on()) [[523, 0], [659, .12], [784, .24], [1046, .38], [784, .54], [1046, .66]].forEach(([f, t]) => tone(f, t, 0.3, 'triangle', 0.24)); },
    gift() { if (on()) [523, 659, 784, 988, 1175, 1318, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.25, 'triangle', 0.16)); },
    shutter() { if (on()) { tone(1800, 0, 0.04, 'square', 0.1); tone(900, 0.05, 0.08, 'square', 0.08); } },
  };
  /* 배경 음악: 짧은 오르골 멜로디를 되풀이 */
  const MEL = [
    [72, 2], [76, 2], [79, 2], [76, 2], [77, 2], [74, 2], [71, 4],
    [72, 2], [76, 2], [79, 2], [84, 2], [81, 4], [79, 4],
    [77, 2], [81, 2], [79, 2], [76, 2], [74, 2], [77, 2], [76, 4],
    [72, 2], [74, 2], [76, 2], [79, 2], [74, 4], [72, 4],
  ];
  const BASS = [48, 43, 45, 41, 48, 43, 41, 43];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function startMusic() {
    if (musicOn || !Store.S.set.music) return;
    const a = ctx(); if (!a) return;
    musicOn = true; step = 0;
    const beat = 0.2;
    let idx = 0, t = a.currentTime + 0.1, bar = 0;
    const sched = () => {
      if (!musicOn) return;
      while (t < a.currentTime + 1.2) {
        const [n, len] = MEL[idx];
        tone(mtof(n), t - a.currentTime, len * beat * 0.95, 'triangle', 0.5, null, musicGain);
        if (step % 8 === 0) tone(mtof(BASS[bar % BASS.length]), t - a.currentTime, beat * 7, 'sine', 0.6, null, musicGain), bar++;
        step += len; t += len * beat; idx = (idx + 1) % MEL.length;
      }
      musicTimer = setTimeout(sched, 300);
    };
    sched();
  }
  function stopMusic() { musicOn = false; clearTimeout(musicTimer); }
  function duck(on) { if (musicGain && ac) musicGain.gain.setTargetAtTime(on ? 0.04 : 0.12, ac.currentTime, 0.1); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopMusic(); if (ac) ac.suspend().catch(() => {}); } else if (ac) { ac.resume().catch(() => {}); } });
  return Object.assign(S, { unlock: ctx, startMusic, stopMusic, duck, get musicOn() { return musicOn; } });
})();

/* ---------------- 목소리 ---------------- */
const Voice = (() => {
  const syn = window.speechSynthesis;
  let ko = null, en = null;
  function pickVoices() {
    if (!syn) return;
    const vs = syn.getVoices();
    ko = vs.find((v) => /ko[-_]KR/i.test(v.lang) && /Google/i.test(v.name)) || vs.find((v) => /^ko/i.test(v.lang)) || null;
    en = vs.find((v) => /en[-_]US/i.test(v.lang) && /Google/i.test(v.name)) || vs.find((v) => /^en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if (syn) { pickVoices(); syn.onvoiceschanged = pickVoices; }
  function stop() { if (syn) syn.cancel(); }
  function say(text, lang = 'ko', opt = {}) {
    if (!syn || !Store.S.set.voice || !text) return Promise.resolve();
    if (!opt.queue) syn.cancel();
    return new Promise((res) => {
      const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}☀-➿❓]/gu, ' '));
      u.lang = lang === 'en' ? 'en-US' : 'ko-KR';
      const v = lang === 'en' ? en : ko; if (v) u.voice = v;
      u.rate = lang === 'en' ? 0.85 : 1.0; u.pitch = 1.25;
      let done = false; const fin = () => { if (!done) { done = true; Sfx.duck(false); res(); } };
      u.onend = fin; u.onerror = fin; setTimeout(fin, 9000);
      Sfx.duck(true);
      syn.speak(u);
    });
  }
  return { say, stop };
})();

/* ---------------- 도우미 ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const CARROT_IMG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART.carrotSVG);
const carrotTag = (cls = '') => `<img src="${CARROT_IMG}" alt="당근" class="${cls}">`;

let toastT = 0;
function toast(msg, ms = 1800) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}
function flyText(text, x, y, color = '#ff922b') {
  const d = document.createElement('div'); d.className = 'fly'; d.textContent = text;
  d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.color = color;
  $('#fx').appendChild(d); setTimeout(() => d.remove(), 1000);
}
function confetti(x, y, n = 36) {
  const cols = ['#ff8fb6', '#ffe066', '#74c0fc', '#8ce99a', '#b197fc', '#ffa94d'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'conf';
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.background = pick(cols);
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 260;
    d.style.setProperty('--dx', Math.cos(a) * r + 'px'); d.style.setProperty('--dy', Math.sin(a) * r + 160 + 'px');
    d.style.animationDuration = (1 + Math.random() * 0.8) + 's';
    $('#fx').appendChild(d); setTimeout(() => d.remove(), 1900);
  }
}
function banner(text) {
  const d = document.createElement('div'); d.className = 'banner'; d.textContent = text;
  $('#fx').appendChild(d); setTimeout(() => d.remove(), 1150);
}

/* SVG → 그림 (캔버스용) */
const ImgCache = (() => {
  const m = new Map();
  function get(key, svgFn) {
    let it = m.get(key);
    if (!it) {
      const img = new Image();
      it = { img, ok: false };
      img.onload = () => { it.ok = true; };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgFn());
      m.set(key, it);
      if (m.size > 200) m.delete(m.keys().next().value);
    }
    return it;
  }
  return { get };
})();

/* 보상 */
function addCarrots(n) {
  const S = Store.S;
  S.carrots += n; S.earned += n; Store.save();
  document.querySelectorAll('.carrots .n').forEach((el) => { el.textContent = S.carrots; el.parentElement.classList.remove('bump'); void el.offsetWidth; el.parentElement.classList.add('bump'); });
}
function itemOwned(it) { return !!Store.S.owned[it.id]; }
function affordableNew() {
  const S = Store.S;
  return ART.ITEMS.some((it) => !it.special && !S.owned[it.id] && it.price <= S.carrots) ||
    Object.entries(ART.FURS).some(([k, f]) => !S.owned['fur:' + k] && f.price <= S.carrots);
}
