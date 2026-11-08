/* 토리의 반짝 달리기 — 화면들 */
'use strict';
const UI = (() => {
  const app = $('#app');
  let cur = '';
  let G = null;            // 지금 하는 판
  const ACT = {};          // data-a 동작
  const W = QS.WORLDS;
  const S = () => Store.S;
  const stageKey = (w, s) => W[w].id + s;
  const friendOf = (w, s) => ART.FRIENDS[w * 3 + s];
  const lookSVG = (look, pose = 'stand', expr = 'normal') => ART.tori(look, pose, expr);
  const carrotsHTML = () => `<div class="carrots">${carrotTag()}<span class="n">${S().carrots}</span></div>`;
  const back = (to = 'home') => `<button class="iconbtn" data-a="go" data-to="${to}" aria-label="뒤로">⬅️</button>`;

  /* ---------- 공통 ---------- */
  function go(name, arg) {
    Voice.stop();
    if (name !== 'game' && Runner.active) Runner.stop();
    if (cur !== name && name !== 'home') { try { history.pushState({ s: name }, ''); } catch (e) {} }
    cur = name;
    app.classList.toggle('pass', name === 'game');
    closeModal();
    SCREENS[name](arg);
  }
  ACT.go = (d) => go(d.to);
  window.addEventListener('popstate', () => {
    if (cur === 'game') { pauseGame(); try { history.pushState({ s: 'game' }, ''); } catch (e) {} return; }
    if ($('.modalBg')) { closeModal(); return; }
    if (cur !== 'home') go(cur === 'album' ? 'studio' : 'home');
  });
  let unlocked = false;
  document.addEventListener('pointerdown', () => {
    if (!unlocked) { unlocked = true; Sfx.unlock(); if (S().set.music) Sfx.startMusic(); }
  }, { capture: true });
  app.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    if (!b.classList.contains('choice')) Sfx.tap();
    const f = ACT[b.dataset.a];
    if (f) f(b.dataset, b, e);
  });
  document.body.addEventListener('click', (e) => {   // 모달 (app 밖)
    const b = e.target.closest('.modalBg [data-a]');
    if (!b || b.disabled) return;
    Sfx.tap();
    const f = ACT[b.dataset.a]; if (f) f(b.dataset, b, e);
  });

  function modal(html, opt = {}) {
    closeModal();
    const bg = document.createElement('div'); bg.className = 'modalBg';
    bg.innerHTML = `<div class="modal ${opt.cls || ''}">${opt.x ? '<button class="xbtn" data-a="closeModal">✕</button>' : ''}${html}</div>`;
    if (opt.x) bg.addEventListener('click', (e) => { if (e.target === bg) closeModal(); });
    document.body.appendChild(bg);
    return bg;
  }
  function closeModal() { document.querySelectorAll('.modalBg').forEach((m) => m.remove()); }
  ACT.closeModal = closeModal;

  /* ---------- 첫 화면 ---------- */
  const TORI_LINES = ['안녕! 나는 토리야!', '같이 달리자!', '당근 먹고 싶어!', '오늘 옷 예쁘지?', '히히, 간지러워!', '재윤아, 반가워!', '친구들을 구하러 가자!', '별을 모아 볼까?', '사진 찍을래?'];
  function home() {
    const s = S();
    const team = s.team.filter((id) => s.friends[id]).slice(0, 3);
    const left = team.slice(0, 2), right = team.slice(2);
    const fsvg = (id) => ART.friend(id, (s.friends[id] || {}).top || '');
    const nFr = Object.keys(s.friends).length;
    const nStars = Object.values(s.stars).reduce((a, b) => a + b, 0);
    const cloudSVG = '<svg viewBox="0 0 120 60"><g fill="#fff"><circle cx="30" cy="38" r="20"/><circle cx="58" cy="26" r="26"/><circle cx="88" cy="38" r="20"/><rect x="30" y="38" width="58" height="20"/></g></svg>';
    let flowers = '';
    for (let i = 0; i < 9; i++) flowers += ART.flower(40 + i * 65, 52 + (i % 2) * 18, 9, ['#ffa8c5', '#fff3a3', '#d0bfff', '#a5d8ff'][i % 4]);
    const hill = `<svg class="hill" viewBox="0 0 600 110" preserveAspectRatio="none"><ellipse cx="300" cy="110" rx="300" ry="80" fill="#c3fae8"/><ellipse cx="300" cy="118" rx="270" ry="70" fill="#b2f2bb"/>${flowers}</svg>`;
    app.innerHTML = `<div class="screen bg home"><div class="deco"><i class="cl c1">${cloudSVG}</i><i class="cl c2">${cloudSVG}</i><i class="cl c3">${cloudSVG}</i><b class="sp s1">✦</b><b class="sp s2">✦</b><b class="sp s3">♥</b><b class="sp s4">✦</b></div>
      <div class="topbar" style="width:100%"><button class="iconbtn" data-a="settings" aria-label="설정">⚙️</button><div class="title"></div><button class="iconbtn" data-a="go" data-to="album" aria-label="앨범">🖼️</button>${carrotsHTML()}</div>
      <div class="logo">토리의 반짝 달리기<small>⭐ ${nStars} / 36 · 🐾 친구 ${nFr} / 12</small></div>
      <div class="homeMain">
        <div class="stageTori">
          ${hill}
          <div class="team l">${left.map(fsvg).join('')}</div>
          <div class="toriWrap" data-a="poke">${lookSVG(s.look)}</div>
          <div class="team r">${right.map(fsvg).join('')}</div>
        </div>
        <div class="homeSide">
          <button class="btn pink big" data-a="go" data-to="map"><span class="em">🏃</span> 달리러 가기</button>
          <button class="btn lav rel" data-a="go" data-to="closet"><span class="em">👗</span> 토리 옷방${affordableNew() ? '<span class="dot"></span>' : ''}</button>
          <button class="btn mint" data-a="go" data-to="friends"><span class="em">🐾</span> 친구들</button>
          <button class="btn sky" data-a="go" data-to="studio"><span class="em">📸</span> 사진관</button>
          <button class="btn missionBtn" data-a="missions"><span class="em">🎯</span> 오늘의 미션 ${missionsText()}${missionClaimable() ? '<span class="dot"></span>' : ''}</button>
        </div>
      </div></div>`;
    dailyBonus();
  }
  ACT.poke = (d, el) => {
    const w = $('.toriWrap'); if (!w) return;
    const ex = pick(['happy', 'wink', 'wow']);
    w.innerHTML = lookSVG(S().look, 'cheer', ex);
    w.classList.remove('cheer'); void w.offsetWidth; w.classList.add('cheer');
    const line = pick(TORI_LINES);
    const st = $('.stageTori'); st.querySelector('.bubble') && st.querySelector('.bubble').remove();
    const b = document.createElement('div'); b.className = 'bubble'; b.textContent = line; st.appendChild(b);
    Voice.say(line); Sfx.pop();
    clearTimeout(ACT.poke.t);
    ACT.poke.t = setTimeout(() => { const w2 = $('.toriWrap'); if (w2) { w2.innerHTML = lookSVG(S().look); w2.classList.remove('cheer'); } const bb = $('.stageTori .bubble'); if (bb) bb.remove(); }, 2200);
  };
  function dailyBonus() {
    const s = S(), t = today();
    if (s.day === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    s.streak = s.day === ys ? s.streak + 1 : 1;
    s.day = t;
    const first = !s.plays && !s.earned;
    const bonus = first ? 30 : 20 + 5 * Math.min(s.streak - 1, 6);
    Store.save(true);
    setTimeout(() => {
      modal(`<div class="tori">${lookSVG(s.look, 'cheer', 'happy')}</div><h2>${first ? '만나서 반가워!' : '오늘도 왔구나!'}</h2>
        <p>${first ? '나는 토리야. 같이 달리면서<br>당근을 모아 예쁜 옷을 사자!' : (s.streak > 1 ? `<b>${s.streak}일</b> 연속으로 왔어요! 최고!` : '오늘도 신나게 달려 볼까?')}</p>
        <p style="font-size:34px">${carrotTag('').replace('<img', '<img style="width:44px;vertical-align:middle"')} +${bonus}</p>
        <div class="row"><button class="btn pink big" data-a="takeBonus" data-n="${bonus}">받을래요!</button></div>`);
    }, 350);
  }
  ACT.takeBonus = (d) => {
    closeModal(); addCarrots(+d.n); Sfx.buy(); confetti(innerWidth / 2, innerHeight * 0.4);
    Voice.say(pick(['고마워!', '야호! 당근이다!', '신난다!']));
    const dot = !$('.homeSide .dot') && affordableNew();
    if (dot) { const b = document.querySelector('[data-to="closet"]'); if (b) b.insertAdjacentHTML('beforeend', '<span class="dot"></span>'); }
  };


  /* ---------- 오늘의 미션 ---------- */
  const MISSIONS = {
    play:  { icon: '🏃', text: (g) => `달리기 ${g}판 끝내기`, goal: 2, reward: 25 },
    first: { icon: '🧠', text: (g) => `한 번에 정답 ${g}개`, goal: 12, reward: 25 },
    field: { icon: '🥕', text: (g) => `길에서 당근 ${g}개 줍기`, goal: 40, reward: 20 },
    star3: { icon: '⭐', text: () => '별 3개 받기', goal: 1, reward: 30 },
    shine: { icon: '✨', text: (g) => `점프해서 반짝이 ${g}개 잡기`, goal: 3, reward: 20 },
    dress: { icon: '👗', text: () => '옷 입혀 주기', goal: 1, reward: 15 },
    photo: { icon: '📸', text: () => '사진관에서 사진 찍기', goal: 1, reward: 20 },
  };
  function todayMissions() {
    const s = S(), t = today();
    if (!s.mission || s.mission.day !== t) {
      const seed = t.split('-').reduce((a, b) => a * 31 + +b, 7);
      const pool = ['first', 'field', 'star3', 'shine', 'dress', 'photo'];
      const a = pool[seed % pool.length], b = pool[(seed * 7 + 3) % pool.length] === a ? pool[(seed + 1) % pool.length] : pool[(seed * 7 + 3) % pool.length];
      s.mission = { day: t, list: ['play', a, b].map((id) => ({ id, prog: 0, claimed: false })) };
      Store.save();
    }
    return s.mission.list;
  }
  function mission(id, n) {
    const m = todayMissions().find((x) => x.id === id);
    if (!m || m.claimed) return;
    const goal = MISSIONS[id].goal, was = m.prog >= goal;
    m.prog = Math.min(goal, m.prog + n); Store.save();
    if (!was && m.prog >= goal) setTimeout(() => { toast(`🎯 미션 완료! ${MISSIONS[id].text(goal)} — 첫 화면에서 받아요`, 2600); }, 400);
  }
  const missionClaimable = () => todayMissions().some((m) => !m.claimed && m.prog >= MISSIONS[m.id].goal);
  const missionsText = () => { const l = todayMissions(); return `${l.filter((m) => m.claimed).length}/${l.length}`; };
  ACT.missions = () => {
    const l = todayMissions();
    modal(`<h2>🎯 오늘의 미션</h2><p style="font-size:20px;color:#9b8291">매일 새 미션이 와요! 다 하면 당근을 받아요</p><div class="mlist">${l.map((m, i) => {
      const M = MISSIONS[m.id], ok = m.prog >= M.goal;
      return `<div class="mrow ${m.claimed ? 'claimed' : ''}"><span class="mi">${M.icon}</span><div class="mt">${M.text(M.goal)} <small style="color:#9b8291">${m.prog}/${M.goal}</small><div class="mb"><i style="width:${m.prog / M.goal * 100}%"></i></div></div>
        ${m.claimed ? '<span style="font-size:22px">받았어요 ✓</span>' : `<button class="btn ${ok ? 'pink' : ''}" ${ok ? '' : 'disabled'} data-a="claimMission" data-i="${i}">${carrotTag().replace('<img', '<img style="width:26px"')} ${M.reward}</button>`}</div>`;
    }).join('')}</div>`, { x: true });
  };
  ACT.claimMission = (d) => {
    const m = todayMissions()[+d.i], M = MISSIONS[m.id];
    if (m.claimed || m.prog < M.goal) return;
    m.claimed = true; addCarrots(M.reward); Store.save(true); Sfx.buy(); confetti(innerWidth / 2, innerHeight / 2, 50);
    Voice.say(pick(['미션 성공!', '야호! 당근이다!', '최고야!']));
    ACT.missions();
    if (cur === 'home') { const b = $('.missionBtn'); if (b) { b.innerHTML = `<span class="em">🎯</span> 오늘의 미션 ${missionsText()}${missionClaimable() ? '<span class="dot"></span>' : ''}`; } }
  };

  /* ---------- 설정 ---------- */
  ACT.settings = () => {
    const s = S().set;
    const row = (k, label) => `<div class="toggle">${label}<button class="sw ${s[k] ? 'on' : ''}" data-a="toggleSet" data-k="${k}"></button></div>`;
    modal(`<h2>설정</h2>${row('sfx', '🔔 효과음')}${row('voice', '🗣️ 토리 목소리')}${row('music', '🎵 배경 음악')}
      <div class="row"><button class="btn" data-a="resetAsk" style="font-size:20px">처음부터 다시 하기</button></div>
      <p style="font-size:16px;color:#b8a3b0">버전 ${APP_VERSION}</p>`, { x: true });
  };
  ACT.toggleSet = (d, el) => {
    const s = S().set; s[d.k] = !s[d.k]; el.classList.toggle('on', s[d.k]); Store.save(true);
    if (d.k === 'music') { if (s.music) Sfx.startMusic(); else Sfx.stopMusic(); }
    if (d.k === 'voice' && s.voice) Voice.say('토리 목소리가 켜졌어요!');
  };
  ACT.resetAsk = () => {
    const bg = modal(`<div class="big">⚠️</div><h2>정말 처음부터?</h2><p>당근, 옷, 친구, 별이 모두 사라져요.<br>엄마나 오빠에게 물어보고,<br>아래 버튼을 <b>3초 동안 꾹</b> 눌러요.</p>
      <div class="row"><button class="btn" data-a="closeModal">아니요</button><button class="btn pink holdBtn" id="holdReset"><span class="fill"></span><span class="lb">꾹 눌러서 지우기</span></button></div>`);
    const hb = bg.querySelector('#holdReset'); let t = 0, st = 0, raf = 0;
    const tick = () => { const k = Math.min(1, (performance.now() - st) / 3000); hb.querySelector('.fill').style.width = k * 100 + '%'; if (k >= 1) { Store.reset(); closeModal(); go('home'); return; } raf = requestAnimationFrame(tick); };
    const down = (e) => { e.preventDefault(); st = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    const up = () => { cancelAnimationFrame(raf); hb.querySelector('.fill').style.width = '0%'; };
    hb.addEventListener('pointerdown', down); hb.addEventListener('pointerup', up); hb.addEventListener('pointerleave', up); hb.addEventListener('pointercancel', up);
  };

  /* ---------- 지도 ---------- */
  function isOpen(w, s) { return s === 0 || (S().stars[stageKey(w, s - 1)] || 0) > 0; }
  function nextStage() {
    for (let s = 0; s < 3; s++) for (let w = 0; w < W.length; w++) if (isOpen(w, s) && !S().stars[stageKey(w, s)]) return [w, s];
    return null;
  }
  function map() {
    const st = S().stars, nx = nextStage();
    let h = `<div class="screen bg"><div class="topbar">${back()}<div class="title">어디로 달려 볼까?</div>${carrotsHTML()}</div><div class="mapGrid">`;
    W.forEach((wd, w) => {
      const tot = [0, 1, 2].reduce((a, s) => a + (st[stageKey(w, s)] || 0), 0);
      h += `<div class="world"><div class="wh" style="background:linear-gradient(${wd.color}cc, ${wd.color})"><div class="wi">${wd.icon}</div><div class="wn">${wd.name}</div><div class="ws">${wd.subj} · ⭐ ${tot}/9</div></div><div class="stages">`;
      wd.stages.forEach((sd, s) => {
        const k = stageKey(w, s), n = st[k] || 0, lock = !isOpen(w, s);
        const fr = friendOf(w, s), got = S().friends[fr.id];
        const isNext = nx && nx[0] === w && nx[1] === s;
        h += `<button class="stagebtn ${lock ? 'locked' : ''} ${isNext ? 'next' : ''}" data-a="${lock ? 'lockedStage' : 'play'}" data-w="${w}" data-s="${s}">
          <span class="num" style="background:${wd.color}">${lock ? '🔒' : s + 1}</span>
          <span class="info"><div class="nm">${sd.name}</div><div class="stars">${[0, 1, 2].map((i) => `<span class="${i < n ? '' : 'off'}">★</span>`).join('')}</div></span>
          <span class="fr">${got ? ART.friend(fr.id, (S().friends[fr.id] || {}).top) : ART.friendShadow(fr.id)}</span></button>`;
      });
      h += `</div></div>`;
    });
    app.innerHTML = h + `</div></div>`;
  }
  ACT.lockedStage = (d) => { toast(`앞 판을 먼저 깨면 열려요! 🔓`); Voice.say('앞 판을 먼저 깨면 열려요!'); };
  ACT.play = (d) => go('game', { w: +d.w, s: +d.s });

  /* ---------- 게임 ---------- */
  function game({ w, s }) {
    const st = S();
    const qs = QS.makeSet(w, s, 8, st.recent);
    const fr = friendOf(w, s);
    G = { w, s, qs, qi: -1, tries: 0, res: [], combo: 0, best: 0, qCarrots: 0, field: 0, rescue: st.friends[fr.id] ? null : fr.id, friend: fr, done: false };
    app.innerHTML = `<div class="screen" id="gameScr">
      <div class="hud"><button class="iconbtn" data-a="pause" aria-label="멈춤">⏸️</button>
        <div class="prog"><div class="bar" style="width:0%"></div>${qs.map((_, i) => `<span class="pin" style="left:${((i + 1) / 9) * 100}%"></span>`).join('')}<span class="goal">${G.rescue ? '🫧' : '🎁'}</span><span class="me" style="left:0%">${lookSVG(st.look, 'run0', 'happy')}</span></div>
        ${carrotsHTML()}</div>
      <div id="qbox"></div></div>`;
    Runner.start({
      world: W[w].id, count: qs.length, seed: Math.floor(Math.random() * 6), look: st.look,
      team: st.team.filter((id) => st.friends[id]).slice(0, 3).map((id) => ({ id, top: st.friends[id].top || '' })),
      rescue: G.rescue, tapHint: !st.seen.tap,
      onAsk, onCarrot, onPass, onFinish: finish, onHint,
    });
    st.plays++; Store.save();
    Voice.say(pick(['출발!', '달려 보자!', '준비, 출발!']));
  }
  function onHint(show) {
    const g = $('#gameScr'); if (!g) return;
    const old = $('.tapHint'); if (old) old.remove();
    clearTimeout(onHint.t);
    if (show) { g.insertAdjacentHTML('beforeend', '<div class="tapHint">👆 화면을 톡! 누르면 점프해요</div>'); Voice.say('화면을 톡 누르면 점프해서 당근을 먹을 수 있어!'); onHint.t = setTimeout(() => { const h = $('.tapHint'); if (h) h.remove(); }, 7000); }
    else if (show === false) { S().seen.tap = true; Store.save(); }
  }
  function onCarrot(n, x, y, kind) {
    if (!G) return;
    G.field += n; addCarrots(n);
    mission('field', n); if (kind === 's' || kind === 'g') mission('shine', 1);
    flyText('+' + n, x, y - 30, n >= 5 ? '#f59f00' : '#ff922b');
  }
  function onPass(qi) { updateProg(qi + 1); }
  function updateProg(n) {
    const bar = $('.prog .bar'), me = $('.prog .me');
    if (bar) bar.style.width = (n / 9) * 100 + '%';
    if (me) me.style.left = (n / 9) * 100 + '%';
  }
  function onAsk(qi) {
    if (!G) return;
    G.qi = qi; G.tries = 0;
    const q = G.qs[qi];
    const long = q.choices.some((c) => c.length > 7);
    const box = $('#qbox');
    box.innerHTML = `<div class="qpanel" id="qp">
      <div class="qL"><div class="qtext"><button class="speak" data-a="speakQ" aria-label="다시 듣기">🔊</button><span>${esc(q.text)}</span></div><div class="qvis">${q.visual}</div><div id="qex"></div></div>
      <div class="qR">${q.choices.map((ch, i) => `<button class="choice ${q.emoji ? 'emo' : ''} ${q.subj === 'e' && !q.emoji ? 'en' : ''} ${long ? 'small' : ''}" data-a="choose" data-i="${i}">${esc(ch)}</button>`).join('')}</div></div>`;
    speakQ();
  }
  function speakQ() {
    if (!G || G.qi < 0) return;
    const q = G.qs[G.qi];
    Voice.say(q.speak).then(() => { if (q.say && !q.sayAfter && G && G.qs[G.qi] === q) Voice.say(q.say[0], q.say[1], { queue: true }); });
  }
  ACT.speakQ = () => speakQ();
  ACT.choose = (d, el) => {
    if (!G || G.answered) return;
    const q = G.qs[G.qi];
    const ch = q.choices[+d.i];
    if (el.classList.contains('no')) return;
    const r = el.getBoundingClientRect();
    if (ch === q.answer) {
      G.answered = true;
      el.classList.add('yes'); Sfx.right();
      const first = G.tries === 0;
      const gain = first ? 5 : 2;
      G.res[G.qi] = { first, q };
      G.qCarrots += gain; addCarrots(gain);
      confetti(r.left + r.width / 2, r.top + r.height / 2, first ? 30 : 14);
      flyText(`+${gain} 🥕`, r.left + r.width / 2 - 30, r.top - 10);
      if (first) {
        G.combo++; G.best = Math.max(G.best, G.combo);
        if (G.combo >= 3 && G.combo % 3 === 0) { banner(`🔥 ${G.combo}연속 정답!`); addCarrots(3); G.qCarrots += 3; Sfx.star(); }
      } else G.combo = 0;
      const pin = document.querySelectorAll('.prog .pin')[G.qi]; if (pin) pin.classList.add(first ? 'ok' : 'meh');
      Voice.say(q.sayAfter && q.say ? q.say[0] : pick(first ? ['딩동댕!', '맞았어!', '최고야!', '멋져!', '우와, 천재다!', '정답!'] : ['맞았어!', '잘했어!', '좋아!']), q.sayAfter && q.say ? q.say[1] : 'ko');
      setTimeout(() => {
        const p = $('#qp'); if (p) p.classList.add('hide');
        setTimeout(() => { if ($('#qbox')) $('#qbox').innerHTML = ''; G && (G.answered = false); Runner.answered(first ? 'first' : 'second'); }, 280);
      }, 750);
      return;
    }
    // 틀림
    G.tries++; G.combo = 0;
    el.classList.add('no'); Sfx.wrong(); Runner.react('oops', 1.2);
    const left = q.choices.length - G.tries;
    if (G.tries >= 2 || left <= 1) {
      G.answered = true;
      G.res[G.qi] = { first: false, miss: true, q };
      const pin = document.querySelectorAll('.prog .pin')[G.qi]; if (pin) pin.classList.add('meh');
      document.querySelectorAll('.choice').forEach((b, i) => { if (q.choices[i] === q.answer) b.classList.add('show'); else b.classList.add('no'); });
      $('#qex').innerHTML = `<div class="explain">💡 ${esc(q.explain || ('정답은 ' + q.answer))}</div><button class="btn mint qgo" data-a="afterMiss">알겠어! ▶</button>`;
      Voice.say('정답은 이거야. ' + (q.explain || '')).then(() => { if (q.say && G && G.qs[G.qi] === q) Voice.say(q.say[0], q.say[1], { queue: true }); });
    } else {
      Voice.say(pick(['괜찮아, 한 번 더!', '아깝다! 다시 해 볼까?', '음, 다른 걸 골라 볼까?']));
    }
  };
  ACT.afterMiss = () => {
    const p = $('#qp'); if (p) p.classList.add('hide');
    setTimeout(() => { if ($('#qbox')) $('#qbox').innerHTML = ''; if (G) G.answered = false; Runner.answered('miss'); }, 250);
  };
  function pauseGame() {
    if (!G || G.done) return;
    Runner.setPaused(true);
    modal(`<div class="big">⏸️</div><h2>잠깐 쉬어요</h2><div class="row"><button class="btn pink big" data-a="resume">▶ 계속 달리기</button></div><div class="row"><button class="btn" data-a="quitGame">🗺️ 지도로 가기</button></div>`);
  }
  ACT.pause = pauseGame;
  ACT.resume = () => { closeModal(); Runner.setPaused(false); };
  ACT.quitGame = () => { G = null; Runner.stop(); go('map'); };

  function finish() {
    if (!G || G.done) return;
    G.done = true;
    const st = S(), key = stageKey(G.w, G.s);
    const firsts = G.res.filter((r) => r && r.first).length;
    const n = G.qs.length;
    const stars = firsts >= n - 1 ? 3 : firsts >= n - 3 ? 2 : 1;
    const prev = st.stars[key] || 0;
    st.stars[key] = Math.max(prev, stars);
    st.correct += firsts;
    st.recent = [...G.qs.map((q) => q.key), ...st.recent].slice(0, 120);
    const clear = 10, starB = stars * 5;
    let treasure = 0, newFriend = null, gift = null;
    if (G.rescue) {
      newFriend = G.friend;
      st.friends[newFriend.id] = { top: '' };
      if (st.team.length < 3) st.team.push(newFriend.id);
    } else treasure = 15;
    const giftQ = [];
    const pickGift = () => { const left = ART.ITEMS.filter((it) => it.special && !st.owned[it.id] && !giftQ.includes(it)); return left.length ? left[Math.floor(Math.random() * left.length)] : { bonus: 40 }; };
    if (stars === 3 && prev < 3) giftQ.push(pickGift());
    st.worldGift = st.worldGift || {};
    if (!st.worldGift[G.w] && [0, 1, 2].every((i) => st.stars[stageKey(G.w, i)])) { st.worldGift[G.w] = true; giftQ.push(pickGift()); G.worldDone = true; }
    G.giftQ = giftQ; gift = giftQ[0] || null;
    mission('play', 1); mission('first', firsts); if (stars === 3) mission('star3', 1);
    const bonus = clear + starB + treasure;
    addCarrots(bonus);
    Store.save(true);
    const total = G.qCarrots + G.field + bonus;
    const wrongs = G.res.filter((r) => r && !r.first);
    const W0 = W[G.w];
    const hasNext = G.s < 2 || G.w < W.length - 1;
    Sfx.fanfare();
    confetti(innerWidth / 2, innerHeight * 0.3, 60);
    modal(`<div class="result">
      <h2>도착! ${stars === 3 ? '완벽해요 🎉' : stars === 2 ? '잘했어요 🎉' : '해냈어요 🎉'}</h2>
      <div class="bigStars">${[0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('')}</div>
      <p>한 번에 맞힌 문제 <b>${firsts}</b> / ${n}${G.best >= 3 ? ` · 🔥 최고 ${G.best}연속` : ''}</p>
      ${newFriend ? `<div class="topRow"><div class="chip on" style="font-size:24px">${ART.friend(newFriend.id)} 새 친구 <b>${newFriend.name}</b>(${newFriend.kind})${QS.josa(newFriend.kind, '을', '를').slice(newFriend.kind.length)} 구했어요!</div></div>` : ''}
      <div class="gain">${carrotTag()}<b>+${total}</b></div>
      <div class="gainParts"><span>🧠 문제 ${G.qCarrots}</span><span>🥕 길 ${G.field}</span><span>🏁 도착 ${clear}</span><span>⭐ 별 ${starB}</span>${treasure ? `<span>🎁 보물 ${treasure}</span>` : ''}</div>
      ${gift ? `<div class="row"><button class="btn lav big" data-a="openGift">🎁 선물 상자 열기!${G.giftQ.length > 1 ? ` (${G.giftQ.length}개)` : ''}</button></div>` : ''}
      ${G.worldDone ? `<p style="font-size:21px;color:#845ef7">🌟 ${W0.name}의 판을 모두 깼어요! 선물이 하나 더!</p>` : ''}
      ${wrongs.length ? `<details class="wrongs"><summary style="font-size:22px">📒 다시 볼 문제 ${wrongs.length}개</summary>${wrongs.map((r) => `<div>${esc(r.q.text)} ${r.q.visual && r.q.emoji === false && /bigemo/.test(r.q.visual) ? r.q.visual.replace(/<[^>]+>/g, '') : ''} → 정답 <b>${esc(r.q.answer)}</b></div>`).join('')}</details>` : ''}
      <div class="row" ${gift ? 'style="opacity:.0;pointer-events:none" id="afterGift"' : ''}>
        <button class="btn" data-a="replay">🔁 다시</button>
        ${hasNext ? '<button class="btn pink" data-a="nextStage">▶ 다음 판</button>' : ''}
        <button class="btn sky" data-a="go" data-to="map">🗺️ 지도</button>
        <button class="btn lav" data-a="go" data-to="closet">👗 옷방</button></div>
    </div>`);
    Voice.say(stars === 3 ? '와! 별 세 개야! 정말 대단해!' : stars === 2 ? '별 두 개! 잘했어!' : '끝까지 왔어! 멋져!').then(() => {
      if (newFriend) Voice.say(`새 친구 ${QS.josa(newFriend.name, '을', '를')} 구했어!`, 'ko', { queue: true });
    });
    G.result = { w: G.w, s: G.s };
  }
  ACT.replay = () => { const r = G && G.result; if (r) go('game', { w: r.w, s: r.s }); };
  ACT.nextStage = () => {
    const r = G && G.result; if (!r) return;
    let w = r.w, s = r.s + 1;
    if (s > 2) { s = 0; w++; }
    if (w >= W.length) { go('map'); return; }
    go('game', { w, s });
  };
  ACT.openGift = () => {
    const nx = G && G.giftQ && G.giftQ.shift(); if (!nx) return;
    const it = nx.id ? nx : null; const d = { bonus: nx.bonus || 0 };
    const old = $('.modalBg'); if (old) old.style.display = 'none';
    const bg = document.createElement('div'); bg.className = 'modalBg'; bg.id = 'giftM';
    bg.innerHTML = `<div class="modal"><h2>두근두근 선물 상자!</h2><p>상자를 톡 눌러 봐요</p><div class="gift shake" id="giftBox">${ART.giftSVG(false)}</div></div>`;
    document.body.appendChild(bg);
    Voice.say('선물 상자를 톡 눌러 봐!');
    bg.querySelector('#giftBox').addEventListener('click', () => {
      const st = S();
      Sfx.gift(); confetti(innerWidth / 2, innerHeight / 2, 70);
      let inner;
      if (it) {
        st.owned[it.id] = true; st.gifts.push(it.id); Store.save(true);
        const lk = Object.assign({}, st.look, { [it.cat]: it.id });
        inner = `<div class="reveal">${lookSVG(lk, 'cheer', 'wow')}</div><h2>${it.name}!</h2><p>특별한 옷을 받았어요 ✨</p>
          <div class="row"><button class="btn pink big" data-a="wearGift" data-id="${it.id}">지금 입을래요!</button><button class="btn" data-a="giftDone">나중에</button></div>`;
        Voice.say(`와! ${QS.josa(it.name, '을', '를')} 받았어!`);
      } else {
        addCarrots(+d.bonus);
        inner = `<div class="reveal" style="font-size:120px">🥕🥕🥕</div><h2>당근 ${d.bonus}개!</h2><p>특별한 옷을 다 모아서 당근을 듬뿍 줄게요</p><div class="row"><button class="btn pink big" data-a="giftDone">좋아요!</button></div>`;
        Voice.say(`당근 ${d.bonus}개를 받았어!`);
      }
      bg.querySelector('.modal').innerHTML = inner;
    }, { once: true });
  };
  ACT.wearGift = (d) => {
    const it = ART.ITEMS.find((x) => x.id === d.id);
    S().look[it.cat] = it.id; Store.save(true);
    ACT.giftDone();
    toast(`${QS.josa(it.name, '을', '를')} 입었어요! 다음 판부터 입고 달려요 ✨`);
  };
  ACT.giftDone = () => {
    const g = $('#giftM'); if (g) g.remove();
    const old = $('.modalBg'); if (old) old.style.display = '';
    const btn = document.querySelector('[data-a="openGift"]');
    if (G && G.giftQ && G.giftQ.length) { if (btn) btn.textContent = '🎁 선물 하나 더 열기!'; return; }
    const r = $('#afterGift'); if (r) { r.style.opacity = '1'; r.style.pointerEvents = ''; }
    if (btn) btn.remove();
  };

  /* ---------- 옷방 ---------- */
  let CL = { cat: 'hat', tryOn: null };
  const THUMB_VB = { hat: '22 -6 156 156', cloth: '34 128 132 132', face: '40 62 120 120', shoes: '36 168 128 92', back: '0 20 200 240', fur: '0 0 200 260' };
  function thumb(look, cat) {
    return ART.tori(look, 'stand', 'normal').replace(/viewBox="[^"]+"/, `viewBox="${THUMB_VB[cat]}"`).replace(/width="200" height="260"/, '');
  }
  function closet() {
    const s = S();
    const look = CL.tryOn ? Object.assign({}, s.look, CL.tryOn) : s.look;
    let grid = '';
    if (CL.cat === 'fur') {
      grid = Object.entries(ART.FURS).map(([k, f]) => {
        const own = s.owned['fur:' + k], worn = s.look.fur === k;
        return `<button class="card ${worn ? 'worn' : ''} ${!own && f.price > s.carrots ? 'cant' : ''}" data-a="pickFur" data-k="${k}">
          <div class="th"><div class="furDot" style="background:${f.f}"></div></div><div class="nm">${f.name}</div>
          ${own ? '<div class="tag">내 거예요</div>' : `<div class="pr">${carrotTag()}${f.price}</div>`}</button>`;
      }).join('');
    } else {
      grid = ART.ITEMS.filter((it) => it.cat === CL.cat).map((it) => {
        const own = s.owned[it.id], worn = s.look[it.cat] === it.id;
        const lk = { fur: s.look.fur, [it.cat]: it.id };
        const secret = it.special && !own;
        return `<button class="card ${worn ? 'worn' : ''} ${it.special ? 'special' : ''} ${secret ? 'secret' : ''} ${!own && !it.special && it.price > s.carrots ? 'cant' : ''}" data-a="pickItem" data-id="${it.id}">
          <div class="th">${thumb(lk, it.cat)}</div><div class="nm">${secret ? '???' : it.name}</div>
          ${own ? '<div class="tag">내 거예요</div>' : it.special ? '<div class="tag">🎁 별 3개 선물</div>' : `<div class="pr">${carrotTag()}${it.price}</div>`}</button>`;
      }).join('');
    }
    const newIn = (cat) => cat === 'fur' ? Object.entries(ART.FURS).some(([k, f]) => !s.owned['fur:' + k] && f.price <= s.carrots) : ART.ITEMS.some((it) => it.cat === cat && !it.special && !s.owned[it.id] && it.price <= s.carrots);
    app.innerHTML = `<div class="screen bg"><div class="topbar">${back()}<div class="title">토리 옷방</div>${carrotsHTML()}</div>
      <div class="screen closet" style="position:relative;flex:1;animation:none">
        <div class="closetL"><div class="mirror">${CL.tryOn ? '<div class="tryTag">입어 보는 중 👀</div>' : ''}<div id="mirrorTori" style="width:100%">${lookSVG(look, 'stand', CL.tryOn ? 'wow' : 'happy')}</div></div>
          <div class="acts"><button class="btn" data-a="randomLook">🎲 아무거나</button><button class="btn" data-a="undress">🧺 다 벗기</button></div></div>
        <div class="closetR"><div class="tabs">${ART.CATS.map((ct) => `<button class="tab ${CL.cat === ct.id ? 'on' : ''}" data-a="tab" data-c="${ct.id}"><span class="ti">${ct.icon}</span>${ct.name}${newIn(ct.id) ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>
          <div class="grid">${grid}</div></div>
      </div></div>`;
  }
  function mirrorCheer() {
    const m = $('#mirrorTori'); if (!m) return;
    const s = S(); const look = CL.tryOn ? Object.assign({}, s.look, CL.tryOn) : s.look;
    m.innerHTML = lookSVG(look, 'cheer', 'happy'); m.classList.remove('toriWrap', 'cheer'); void m.offsetWidth; m.classList.add('toriWrap', 'cheer');
    setTimeout(() => { const m2 = $('#mirrorTori'); if (m2) { m2.innerHTML = lookSVG(look, 'stand', 'happy'); m2.classList.remove('cheer'); } }, 800);
  }
  ACT.tab = (d) => { CL.cat = d.c; CL.tryOn = null; closet(); };
  ACT.pickItem = (d) => {
    const s = S(), it = ART.ITEMS.find((x) => x.id === d.id);
    if (s.owned[it.id]) {
      s.look[it.cat] = s.look[it.cat] === it.id ? '' : it.id; Store.save(true); if (s.look[it.cat]) mission('dress', 1);
      CL.tryOn = null; closet(); mirrorCheer();
      if (s.look[it.cat]) Voice.say(pick(['예쁘다!', '잘 어울려!', '마음에 들어!', '멋지지?']));
      return;
    }
    if (it.special) { toast('🎁 별 3개를 받으면 선물 상자에서 나와요!'); Voice.say('별 세 개를 받으면 선물 상자에서 나와!'); return; }
    CL.tryOn = { [it.cat]: it.id }; closet();
    buyAsk(it.name, it.price, () => { s.owned[it.id] = true; s.look[it.cat] = it.id; });
  };
  ACT.pickFur = (d) => {
    const s = S(), f = ART.FURS[d.k];
    if (s.owned['fur:' + d.k]) { s.look.fur = d.k; Store.save(true); CL.tryOn = null; closet(); mirrorCheer(); return; }
    CL.tryOn = { fur: d.k }; closet();
    buyAsk(f.name, f.price, () => { s.owned['fur:' + d.k] = true; s.look.fur = d.k; });
  };
  function buyAsk(name, price, onBuy) {
    const s = S(), can = s.carrots >= price;
    const bg = modal(`<h2>${name}</h2>
      <p style="font-size:34px">${carrotTag().replace('<img', '<img style="width:42px;vertical-align:middle"')} ${price}</p>
      ${can ? '<p>이걸로 살까요?</p>' : `<p>당근이 <b>${price - s.carrots}개</b> 더 필요해요.<br>달려서 당근을 모아 와요! 🏃</p>`}
      <div class="row">${can ? '<button class="btn pink big" data-a="buyYes">살래요!</button>' : '<button class="btn pink" data-a="buyRun">🏃 달리러 가기</button>'}<button class="btn" data-a="buyNo">${can ? '다음에' : '알겠어'}</button></div>`);
    bg.style.alignItems = 'end'; bg.style.background = 'rgba(80,50,70,.12)';
    bg.querySelector('.modal').style.marginBottom = '3vh';
    ACT.buyYes = () => {
      s.carrots -= price; onBuy(); Store.save(true); mission('dress', 1);
      CL.tryOn = null; closeModal(); closet(); mirrorCheer(); Sfx.buy();
      confetti(innerWidth * 0.2, innerHeight * 0.45, 40);
      Voice.say(pick(['와! 고마워!', '정말 예쁘다!', '마음에 쏙 들어!']));
    };
    if (!can) Voice.say(`당근이 ${price - s.carrots}개 더 필요해!`);
  }
  ACT.buyNo = () => { CL.tryOn = null; closeModal(); closet(); };
  ACT.buyRun = () => { CL.tryOn = null; go('map'); };
  ACT.undress = () => { const s = S(); ['hat', 'cloth', 'face', 'shoes', 'back'].forEach((k) => { s.look[k] = ''; }); Store.save(true); CL.tryOn = null; closet(); };
  ACT.randomLook = () => {
    const s = S();
    ['hat', 'cloth', 'face', 'shoes', 'back'].forEach((cat) => {
      const own = ART.ITEMS.filter((it) => it.cat === cat && s.owned[it.id]);
      s.look[cat] = own.length && Math.random() < 0.8 ? pick(own).id : '';
    });
    const furs = Object.keys(ART.FURS).filter((k) => s.owned['fur:' + k]); s.look.fur = pick(furs);
    Store.save(true); CL.tryOn = null; closet(); mirrorCheer();
    if (!ART.ITEMS.some((it) => s.owned[it.id])) toast('옷을 사면 섞어 입을 수 있어요!');
  };

  /* ---------- 친구들 ---------- */
  function friends() {
    const s = S(); const n = Object.keys(s.friends).length;
    app.innerHTML = `<div class="screen bg"><div class="topbar">${back()}<div class="title">친구들 ${n} / 12</div>${carrotsHTML()}</div>
      <p style="text-align:center;margin:0;font-size:21px;color:#9b8291">친구를 누르면 꾸며 주고, 같이 달릴 친구(3명까지)를 고를 수 있어요</p>
      <div class="friendGrid">${ART.FRIENDS.map((f, i) => {
        const got = s.friends[f.id];
        if (!got) return `<button class="fcard no" data-a="friendNo" data-i="${i}">${ART.friendShadow(f.id)}<div class="nm">???</div><div class="kd">${W[Math.floor(i / 3)].name} ${i % 3 + 1}판</div></button>`;
        return `<button class="fcard ${s.team.includes(f.id) ? 'team' : ''}" data-a="friend" data-id="${f.id}">${ART.friend(f.id, got.top)}<div class="nm">${f.name}</div><div class="kd">${f.kind}</div></button>`;
      }).join('')}</div></div>`;
  }
  ACT.friendNo = (d) => { const i = +d.i; const m = `${W[Math.floor(i / 3)].name} ${i % 3 + 1}판을 깨면 만날 수 있어요!`; toast('🫧 ' + m); Voice.say(m); };
  ACT.friend = (d) => {
    const s = S(), f = ART.FRIENDS.find((x) => x.id === d.id), me = s.friends[f.id];
    const inTeam = s.team.includes(f.id);
    modal(`<div style="width:200px;margin:0 auto">${ART.friend(f.id, me.top)}</div><h2>${f.name} <small style="font-size:22px;color:#9b8291">${f.kind}</small></h2>
      <div class="topRow">${ART.TOPPERS.map((t) => `<button class="chip ${me.top === t.id ? 'on' : ''}" data-a="topper" data-id="${f.id}" data-t="${t.id}">${t.id ? ART.friend(f.id, t.id) : '🚫'} ${t.name}</button>`).join('')}</div>
      <div class="row"><button class="btn ${inTeam ? '' : 'mint'} big" data-a="teamToggle" data-id="${f.id}">${inTeam ? '쉬게 하기' : '🏃 같이 달리기'}</button></div>`, { x: true });
    Voice.say(`안녕, ${f.name}!`);
  };
  ACT.topper = (d) => { S().friends[d.id].top = d.t; mission('dress', 1); Store.save(true); ACT.friend({ id: d.id }); friends(); ACT.friend({ id: d.id }); Sfx.pop(); };
  ACT.teamToggle = (d) => {
    const s = S();
    if (s.team.includes(d.id)) s.team = s.team.filter((x) => x !== d.id);
    else { if (s.team.length >= 3) { toast('같이 달리는 친구는 3명까지예요! 한 명을 쉬게 해 줘요'); return; } s.team.push(d.id); Voice.say('같이 가자!'); }
    Store.save(true); closeModal(); friends();
  };

  /* ---------- 사진관 ---------- */
  let ST = null;
  function studio() {
    const s = S();
    if (!ST) ST = { bd: 'meadow', pose: 0, pieces: null };
    const mine = Object.keys(s.friends);
    if (!ST.pieces) {
      ST.pieces = [{ kind: 'tori', x: 40, y: 92, w: 30 }];
      s.team.filter((id) => s.friends[id]).slice(0, 3).forEach((id, i) => ST.pieces.push({ kind: 'friend', id, x: 62 + i * 13, y: 90, w: 15 }));
    }
    const poses = [['stand', 'happy'], ['cheer', 'wow'], ['jump', 'happy'], ['stand', 'wink'], ['cheer', 'happy']];
    ST.poses = poses;
    app.innerHTML = `<div class="screen bg"><div class="topbar">${back()}<div class="title">📸 토리 사진관</div><button class="btn" data-a="go" data-to="album">🖼️ 앨범</button></div>
      <div class="screen studio" style="position:relative;flex:1;animation:none">
        <div class="studioMain">
          <div class="photoStage" id="pstage"><svg class="bd" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">${ART.backdrop(ST.bd)}</svg><div class="trash" id="trash">🗑️</div></div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn" data-a="pose">🔄 토리 포즈</button>
            <button class="btn pink big" data-a="snap">📸 찰칵!</button>
            <button class="btn" data-a="clearStk">🧽 스티커 지우기</button></div>
        </div>
        <div class="studioSide">
          <div class="panel"><h3>배경</h3><div class="bdList">${ART.BACKDROPS.map((b) => `<button class="${ST.bd === b.id ? 'on' : ''}" data-a="bd" data-id="${b.id}" aria-label="${b.name}"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">${ART.backdrop(b.id)}</svg></button>`).join('')}</div></div>
          <div class="panel"><h3>스티커 (끌어서 옮겨요)</h3><div class="stkList">${ART.STICKERS.map((e) => `<button data-a="stk" data-e="${e}">${e}</button>`).join('')}</div></div>
          <div class="panel" style="overflow:auto;min-height:0"><h3>친구 부르기</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${mine.length ? mine.map((id) => `<button class="chip ${ST.pieces.some((p) => p.id === id) ? 'on' : ''}" data-a="callF" data-id="${id}" style="padding:4px 6px">${ART.friend(id, s.friends[id].top)}</button>`).join('') : '<p style="font-size:18px;margin:0;color:#9b8291">친구를 구하면 같이 찍을 수 있어요!</p>'}</div></div>
        </div></div></div>`;
    renderPieces();
  }
  function pieceHTML(p, i) {
    const s = S();
    if (p.kind === 'tori') { const [po, ex] = ST.poses[ST.pose % ST.poses.length]; return `<div class="piece" data-i="${i}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%">${lookSVG(s.look, po, ex)}</div>`; }
    if (p.kind === 'friend') return `<div class="piece" data-i="${i}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%">${ART.friend(p.id, (s.friends[p.id] || {}).top || '')}</div>`;
    return `<div class="piece stk" data-i="${i}" style="left:${p.x}%;top:${p.y}%;font-size:${p.size}px">${p.e}</div>`;
  }
  function renderPieces() {
    const st = $('#pstage'); if (!st) return;
    st.querySelectorAll('.piece').forEach((e) => e.remove());
    const trash = $('#trash');
    ST.pieces.forEach((p, i) => trash.insertAdjacentHTML('beforebegin', pieceHTML(p, i)));
    const sc = st.getBoundingClientRect().width / 1000;
    st.querySelectorAll('.piece.stk').forEach((el) => { el.style.fontSize = ST.pieces[+el.dataset.i].size * sc * 1.6 + 'px'; });
    bindDrag(st);
  }
  function bindDrag(st) {
    st.onpointerdown = (e) => {
      const el = e.target.closest('.piece'); if (!el) return;
      e.preventDefault();
      const i = +el.dataset.i, p = ST.pieces[i], r = st.getBoundingClientRect();
      el.setPointerCapture(e.pointerId); el.classList.add('drag');
      const trash = $('#trash'); if (p.kind === 'stk') trash.classList.add('on');
      const sx = e.clientX, sy = e.clientY, ox = p.x, oy = p.y;
      el.parentNode.insertBefore(el, trash);   // 맨 앞으로
      ST.pieces.push(ST.pieces.splice(i, 1)[0]);
      st.querySelectorAll('.piece').forEach((x, k) => { x.dataset.i = k; });
      const mv = (ev) => {
        p.x = Math.max(0, Math.min(100, ox + (ev.clientX - sx) / r.width * 100));
        p.y = Math.max(5, Math.min(104, oy + (ev.clientY - sy) / r.height * 100));
        el.style.left = p.x + '%'; el.style.top = p.y + '%';
        if (p.kind === 'stk') { const tr = trash.getBoundingClientRect(); trash.classList.toggle('hot', ev.clientX > tr.left - 20 && ev.clientY > tr.top - 20); }
      };
      const up = (ev) => {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('drag');
        if (p.kind === 'stk' && trash.classList.contains('hot')) { ST.pieces.splice(ST.pieces.indexOf(p), 1); el.remove(); Sfx.pop(); st.querySelectorAll('.piece').forEach((x, k) => { x.dataset.i = k; }); }
        trash.classList.remove('on', 'hot');
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    };
  }
  ACT.bd = (d) => { ST.bd = d.id; studio(); };
  ACT.pose = () => { ST.pose++; renderPieces(); Sfx.pop(); };
  ACT.stk = (d) => {
    if (ST.pieces.filter((p) => p.kind === 'stk').length >= 24) { toast('스티커가 가득 찼어요!'); return; }
    ST.pieces.push({ kind: 'stk', e: d.e, x: 15 + Math.random() * 70, y: 12 + Math.random() * 50, size: 56 + Math.random() * 24 });
    renderPieces(); Sfx.pop();
  };
  ACT.clearStk = () => { ST.pieces = ST.pieces.filter((p) => p.kind !== 'stk'); renderPieces(); };
  ACT.callF = (d) => {
    const i = ST.pieces.findIndex((p) => p.id === d.id);
    if (i >= 0) ST.pieces.splice(i, 1);
    else { if (ST.pieces.filter((p) => p.kind === 'friend').length >= 5) { toast('친구는 5명까지 같이 찍어요!'); return; } ST.pieces.push({ kind: 'friend', id: d.id, x: 20 + Math.random() * 60, y: 92, w: 15 }); }
    studio();
  };
  function photoSVG() {
    const s = S();
    let body = ART.backdrop(ST.bd);
    for (const p of ST.pieces) {
      if (p.kind === 'stk') { body += `<text x="${p.x * 10}" y="${p.y * 6}" font-size="${p.size * 1.6}" text-anchor="middle" dominant-baseline="central">${p.e}</text>`; continue; }
      const w = p.w * 10;
      const svg = p.kind === 'tori' ? lookSVG(s.look, ...ST.poses[ST.pose % ST.poses.length]) : ART.friend(p.id, (s.friends[p.id] || {}).top || '');
      const ratio = p.kind === 'tori' ? 260 / 200 : 134 / 120;
      const h = w * ratio;
      body += svg.replace('<svg ', `<svg x="${p.x * 10 - w / 2}" y="${p.y * 6 - h}" `).replace(/width="(200|120)" height="(260|134)"/, `width="${w}" height="${h}"`);
    }
    body += `<text x="980" y="585" font-size="22" text-anchor="end" fill="#fff" opacity=".85" font-family="sans-serif">토리의 반짝 달리기 · ${today()}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600">${body}</svg>`;
  }
  ACT.snap = () => {
    Sfx.shutter();
    const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 600);
    const img = new Image();
    img.onload = async () => {
      const cvs = document.createElement('canvas'); cvs.width = 1000; cvs.height = 600;
      const cx = cvs.getContext('2d'); cx.drawImage(img, 0, 0);
      const url = cvs.toDataURL('image/jpeg', 0.86);
      await Photos.add(url); mission('photo', 1);
      toast('📸 앨범에 저장했어요!');
      Voice.say(pick(['찰칵! 예쁘게 나왔다!', '와, 멋진 사진이야!', '하나 더 찍을까?']));
    };
    img.onerror = () => toast('사진을 못 찍었어요. 다시 해 볼까요?');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(photoSVG());
  };

  /* ---------- 앨범 ---------- */
  async function album() {
    app.innerHTML = `<div class="screen bg"><div class="topbar"><button class="iconbtn" data-a="go" data-to="studio">⬅️</button><div class="title">🖼️ 앨범</div><button class="btn sky" data-a="go" data-to="studio">📸 찍으러 가기</button></div><div class="albumGrid" id="ag"></div></div>`;
    const list = await Photos.all();
    const ag = $('#ag'); if (!ag) return;
    ag.innerHTML = list.length ? list.map((p) => `<button class="ph" data-a="photo" data-id="${p.id}"><img src="${p.url}" alt="사진"></button>`).join('') : '<div class="empty">아직 사진이 없어요<br>📸 사진관에서 찍어 봐요!</div>';
    ACT.photo = (d) => {
      const p = list.find((x) => x.id === d.id); if (!p) return;
      modal(`<img class="photoBig" src="${p.url}" alt="사진"><div class="row"><button class="btn" data-a="delPhoto" data-id="${p.id}">🗑️ 지우기</button><button class="btn pink" data-a="closeModal">닫기</button></div>`, { x: true });
    };
    ACT.delPhoto = (d, el) => {
      if (!el.dataset.sure) { el.dataset.sure = '1'; el.textContent = '정말 지울까요? 한 번 더!'; el.classList.add('pink'); return; }
      Photos.del(d.id).then(() => { closeModal(); album(); });
    };
  }

  const SCREENS = { home, map, game, closet: () => { CL = { cat: CL.cat || 'hat', tryOn: null }; closet(); }, friends, studio: () => { ST = ST ? Object.assign(ST, { pieces: ST.pieces }) : null; studio(); }, album };

  /* ---------- 시작 ---------- */
  function boot() {
    Store.load();
    Runner.init();
    try { history.replaceState({ s: 'home' }, ''); } catch (e) {}
    go('home');
    window.addEventListener('resize', () => { if (cur === 'studio') renderPieces(); });
  }
  return { boot, go, get cur() { return cur; }, get G() { return G; }, ACT };
})();
UI.boot();
