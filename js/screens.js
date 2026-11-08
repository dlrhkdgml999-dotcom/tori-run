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
  let unlocked = false;
  function go(name, arg) {
    Voice.stop();
    if (name !== 'game' && Runner.active) Runner.stop();
    if (cur !== name && name !== 'home') { try { history.pushState({ s: name }, ''); } catch (e) {} }
    cur = name;
    app.classList.toggle('pass', name === 'game');
    if (unlocked && S().set.music) Sfx.startMusic(name === 'game' ? (arg && arg.s === 'b' ? 'boss' : 'run') : 'home');
    closeModal();
    SCREENS[name](arg);
  }
  ACT.go = (d) => go(d.to);
  window.addEventListener('popstate', () => {
    if (cur === 'game') { pauseGame(); try { history.pushState({ s: 'game' }, ''); } catch (e) {} return; }
    if ($('.modalBg')) { closeModal(); return; }
    if (cur !== 'home') go(cur === 'album' ? 'studio' : 'home');
  });
  document.addEventListener('pointerdown', () => {
    if (!unlocked) { unlocked = true; Sfx.unlock(); if (S().set.music) Sfx.startMusic(cur === 'game' ? 'run' : 'home'); }
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
  const TORI_LINES = ['안녕! 나는 토리야!', '같이 달리자!', '당근 먹고 싶어!', '오늘 옷 예쁘지?', '히히, 간지러워!', '친구들을 구하러 가자!', '별을 모아 볼까?', '사진 찍을래?', '황금 당근 찾으러 가자!'];
  const FRIEND_LINES = ['안녕!', '오늘도 달리자!', '토리 옷 예쁘다!', '당근 냠냠!', '구해 줘서 고마워!', '같이 사진 찍자!', '나도 꾸며 줘!', '심술 구름 혼내 주자!', '헤헤 💕'];
  let idleT = 0, chatT = 0;
  function home() {
    const s = S();
    const team = s.team.filter((id) => s.friends[id]).slice(0, 3);
    const left = team.slice(0, 2), right = team.slice(2);
    const fsvg = (id) => `<span class="tf" data-a="friendTalk" data-id="${id}">${ART.friend(id, (s.friends[id] || {}).top || '')}</span>`;
    const nFr = Object.keys(s.friends).length;
    const nStars = Object.values(s.stars).reduce((a, b) => a + b, 0);
    const nGold = goldCount();
    const cloudSVG = '<svg viewBox="0 0 120 60"><g fill="#fff"><circle cx="30" cy="38" r="20"/><circle cx="58" cy="26" r="26"/><circle cx="88" cy="38" r="20"/><rect x="30" y="38" width="58" height="20"/></g></svg>';
    let flowers = '';
    for (let i = 0; i < 9; i++) flowers += ART.flower(40 + i * 65, 52 + (i % 2) * 18, 9, ['#ffa8c5', '#fff3a3', '#d0bfff', '#a5d8ff'][i % 4]);
    const hill = `<svg class="hill" viewBox="0 0 600 110" preserveAspectRatio="none"><ellipse cx="300" cy="110" rx="300" ry="80" fill="#c3fae8"/><ellipse cx="300" cy="118" rx="270" ry="70" fill="#b2f2bb"/>${flowers}</svg>`;
    const env = Runner.envNow(), night = env.phase !== 'day';
    const fall = env.season === 'summer' ? '' : Array.from({ length: 12 }, (_, i) => `<i class="fall ${env.season}" style="left:${(i * 83) % 100}%;animation-delay:${-(i * 1.7) % 12}s;animation-duration:${9 + (i % 4) * 2}s"></i>`).join('');
    const badges = [0, 1, 2, 3].map((i) => `<span class="bdg ${(s.boss || {})[i] ? 'on' : ''}">${ART.badge(i, !!(s.boss || {})[i])}</span>`).join('');
    const journeyLabel = s.ended ? '🌈 여정 계속하기' : (Object.keys(s.stars).length ? '🗺️ 여정 이어 가기' : '🗺️ 여정 떠나기');
    app.innerHTML = `<div class="screen bg home ${night ? 'night' : ''}"><div class="deco"><i class="cl c1">${cloudSVG}</i><i class="cl c2">${cloudSVG}</i><i class="cl c3">${cloudSVG}</i><b class="sp s1">✦</b><b class="sp s2">✦</b><b class="sp s3">♥</b><b class="sp s4">✦</b>${fall}</div>
      <div class="topbar" style="width:100%"><button class="iconbtn" data-a="settings" aria-label="설정">⚙️</button><div class="title"></div><button class="iconbtn rel" data-a="go" data-to="stamps" aria-label="칭찬 도장">🏅</button><button class="iconbtn" data-a="go" data-to="album" aria-label="앨범">🖼️</button>${carrotsHTML()}</div>
      <div class="logo">토리의 반짝 달리기<small>⭐ ${nStars}/36 · 🐾 ${nFr}/12 · <span class="gc">🥕</span> 황금 ${nGold}/36</small></div>
      <div class="badgeRow">${badges}</div>
      <div class="homeMain">
        <div class="stageTori">
          ${hill}
          <div class="team l">${left.map(fsvg).join('')}</div>
          <div class="toriWrap" data-a="poke">${lookSVG(s.look)}</div>
          <div class="team r">${right.map(fsvg).join('')}</div>
        </div>
        <div class="homeSide">
          <button class="btn pink big" data-a="go" data-to="map">${journeyLabel}</button>
          <button class="btn lav rel" data-a="go" data-to="closet"><span class="em">👗</span> 토리 옷방${affordableNew() ? '<span class="dot"></span>' : ''}</button>
          <button class="btn mint" data-a="go" data-to="friends"><span class="em">🐾</span> 친구들</button>
          <button class="btn sky" data-a="go" data-to="studio"><span class="em">📸</span> 사진관</button>
          <button class="btn missionBtn" data-a="missions"><span class="em">🎯</span> 오늘의 미션 ${missionsText()}${missionClaimable() ? '<span class="dot"></span>' : ''}</button>
        </div>
      </div></div>`;
    homeLife();
    if (!s.seen.intro) { setTimeout(() => { if (S().seen.intro || cur !== 'home' || $('.story')) return; Story.play('intro', () => { S().seen.intro = true; Store.save(true); dailyBonus(); }); }, 300); }
    else if (!birthday() && !christmas()) dailyBonus();
  }
  /* 가만히 두면 토리가 졸고, 친구들이 가끔 말해요 */
  function homeLife() {
    clearTimeout(idleT); clearInterval(chatT);
    const sleepy = () => {
      const w = $('.toriWrap'); if (!w || cur !== 'home') return;
      w.innerHTML = lookSVG(S().look, 'stand', 'sleep'); w.classList.add('sleeping');
      if (!$('.zzz')) $('.stageTori').insertAdjacentHTML('beforeend', '<div class="zzz"><b>z</b><b>z</b><b>Z</b></div>');
    };
    idleT = setTimeout(sleepy, 12000);
    chatT = setInterval(() => {
      if (cur !== 'home' || $('.modalBg') || $('.story')) return;
      const fs = document.querySelectorAll('.tf'); if (!fs.length) return;
      const f = fs[Math.floor(Math.random() * fs.length)];
      say(f, pick(FRIEND_LINES));
    }, 9000);
  }
  function say(el, text) {
    document.querySelectorAll('.fbub').forEach((b) => b.remove());
    const b = document.createElement('div'); b.className = 'fbub'; b.textContent = text;
    el.appendChild(b); setTimeout(() => b.remove(), 2600);
  }
  ACT.friendTalk = (d, el) => {
    const f = ART.FRIENDS.find((x) => x.id === d.id);
    const line = pick(FRIEND_LINES);
    say(el, line); Voice.say(line); Sfx.pop();
    el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump');
  };
  ACT.poke = () => {
    const w = $('.toriWrap'); if (!w) return;
    const wasSleeping = w.classList.contains('sleeping');
    w.classList.remove('sleeping'); const z = $('.zzz'); if (z) z.remove();
    const ex = wasSleeping ? 'wow' : pick(['happy', 'wink', 'wow']);
    w.innerHTML = lookSVG(S().look, 'cheer', ex);
    w.classList.remove('cheer'); void w.offsetWidth; w.classList.add('cheer');
    const ph = Runner.envNow().phase;
    const line = wasSleeping ? '앗! 깜짝이야! 잠깐 졸았어 히히' : pick(ph === 'night' ? ['하암… 졸려. 그래도 한 판만!', '별이 반짝반짝 예쁘다!', '밤에는 별똥별이 날아다닌대!', '내일 또 놀자~'] : ph === 'sunset' ? ['노을이 예쁘다!', '저녁 먹었어?', '하늘이 분홍색이야!'] : TORI_LINES);
    const st = $('.stageTori'); const ob = st.querySelector('.bubble'); if (ob) ob.remove();
    const b = document.createElement('div'); b.className = 'bubble'; b.textContent = line; st.appendChild(b);
    Voice.say(line); Sfx.pop();
    clearTimeout(ACT.poke.t);
    ACT.poke.t = setTimeout(() => { const w2 = $('.toriWrap'); if (w2) { w2.innerHTML = lookSVG(S().look); w2.classList.remove('cheer'); } const bb = $('.stageTori .bubble'); if (bb) bb.remove(); }, 2200);
    homeLife();
  };
  function goldCount() { return Object.values(S().gold || {}).reduce((a, g) => a + g.filter(Boolean).length, 0); }
  function christmas() {
    const s = S(), d = new Date();
    if (d.getMonth() !== 11 || (d.getDate() !== 24 && d.getDate() !== 25) || s.xmasDone === d.getFullYear()) return false;
    s.xmasDone = d.getFullYear(); s.owned.santa = true; Store.save(true);
    setTimeout(() => {
      modal(`<div class="tori">${lookSVG(Object.assign({}, s.look, { hat: 'santa', face: 'scarf' }), 'cheer', 'happy')}</div><h2>🎄 메리 크리스마스!</h2><p>토리가 산타 모자를 선물했어요!<br>${carrotTag().replace('<img', '<img style="width:34px;vertical-align:middle"')} 50도 함께!</p><div class="row"><button class="btn pink big" data-a="xmasTake">고마워! 🎅</button></div>`);
      confetti(innerWidth / 2, innerHeight * 0.3, 80); Sfx.gift(); Voice.say('메리 크리스마스! 산타 모자 선물이야!');
    }, 400);
    return true;
  }
  ACT.xmasTake = () => { closeModal(); addCarrots(50); S().look.hat = 'santa'; Store.save(true); go('home'); };
  function birthday() {
    const s = S(), b = s.bday;
    if (!b || !b.m) return false;
    const d = new Date();
    if (d.getMonth() + 1 !== +b.m || d.getDate() !== +b.d || s.bdayDone === d.getFullYear()) return false;
    s.bdayDone = d.getFullYear(); s.owned.partyhat = true; Store.save(true);
    setTimeout(() => {
      modal(`<div class="tori">${lookSVG(Object.assign({}, s.look, { hat: 'partyhat' }), 'cheer', 'happy')}</div><h2>🎂 생일 축하해, ${esc(QS.josa(s.name || '재윤', '아', '야'))}!</h2>
        <p>토리랑 친구들이 준비한 선물이에요!<br>🎉 생일 고깔 + ${carrotTag().replace('<img', '<img style="width:34px;vertical-align:middle"')} 100</p>
        <div class="row"><button class="btn pink big" data-a="bdayTake">고마워! 💖</button></div>`);
      confetti(innerWidth / 2, innerHeight * 0.3, 80); Sfx.fanfare();
      Voice.say(`생일 축하해, ${QS.josa(s.name || '재윤', '아', '야')}! 사랑해!`);
    }, 400);
    return true;
  }
  ACT.bdayTake = () => { closeModal(); addCarrots(100); Sfx.buy(); S().look.hat = 'partyhat'; Store.save(true); go('home'); };
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
      modal(`<div class="tori">${lookSVG(s.look, 'cheer', 'happy')}</div><h2>${first ? '여정 준비물!' : '오늘도 왔구나!'}</h2>
        <p>${first ? '친구들을 구하러 가기 전에<br>당근을 챙겨 가자!' : (s.streak > 1 ? `<b>${s.streak}일</b> 연속으로 왔어요! 최고!` : '오늘도 신나게 달려 볼까?')}</p>
        <p style="font-size:34px">${carrotTag('').replace('<img', '<img style="width:44px;vertical-align:middle"')} +${bonus}</p>
        <div class="row"><button class="btn pink big" data-a="takeBonus" data-n="${bonus}">받을래요!</button></div>`);
    }, 350);
  }
  ACT.takeBonus = (d) => {
    closeModal(); addCarrots(+d.n); Sfx.buy(); confetti(innerWidth / 2, innerHeight * 0.4); setTimeout(checkStamps, 1200);
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


  /* ---------- 칭찬 도장 ---------- */
  const STAMPS = [
    { id: 'run1', icon: '🏃', name: '첫 출발', desc: '첫 판 끝내기', ok: (s) => s.plays >= 1 && Object.keys(s.stars).length >= 1 },
    { id: 'fr1', icon: '🐣', name: '첫 친구', desc: '친구 1명 구하기', ok: (s) => Object.keys(s.friends).length >= 1 },
    { id: 'fr6', icon: '🐾', name: '친구 여섯', desc: '친구 6명 구하기', ok: (s) => Object.keys(s.friends).length >= 6 },
    { id: 'fr12', icon: '💞', name: '모두 구했다', desc: '친구 12명 모두 구하기', ok: (s) => Object.keys(s.friends).length >= 12 },
    { id: 'gold1', icon: '✨', name: '반짝 발견', desc: '황금 당근 1개 찾기', ok: () => goldCount() >= 1 },
    { id: 'gold12', icon: '🌟', name: '황금 탐험가', desc: '황금 당근 12개 찾기', ok: () => goldCount() >= 12 },
    { id: 'boss1', icon: '☁️', name: '구름 친구', desc: '심술 구름 1번 이기기', ok: (s) => Object.keys(s.boss || {}).length >= 1 },
    { id: 'boss4', icon: '🌈', name: '여정 완성', desc: '심술 구름 4마리와 친구 되기', ok: (s) => Object.keys(s.boss || {}).length >= 4 },
    { id: 'combo5', icon: '🔥', name: '불꽃 5연속', desc: '한 판에 5문제 연속 한 번에', ok: (s) => (s.stat.combo || 0) >= 5 },
    { id: 'perfect', icon: '💯', name: '완벽한 판', desc: '8문제 모두 한 번에 맞히기', ok: (s) => (s.stat.perfect || 0) >= 1 },
    { id: 'pole', icon: '👑', name: '깃대 꼭대기', desc: '깃대 꼭대기 잡기', ok: (s) => (s.stat.poleTop || 0) >= 1 },
    { id: 'star5', icon: '⭐', name: '별 부자', desc: '별 3개 받은 판 5개', ok: (s) => Object.values(s.stars).filter((x) => x === 3).length >= 5 },
    { id: 'cloth10', icon: '👗', name: '멋쟁이', desc: '옷 10개 갖기', ok: (s) => ART.ITEMS.filter((it) => s.owned[it.id]).length >= 10 },
    { id: 'photo3', icon: '📸', name: '사진 작가', desc: '사진 3장 찍기', ok: (s) => (s.stat.photos || 0) >= 3 },
    { id: 'day3', icon: '📅', name: '3일 연속', desc: '3일 연속 놀러 오기', ok: (s) => (s.streak || 0) >= 3 },
    { id: 'block10', icon: '❓', name: '구름 콩콩', desc: '선물 구름 10번 콩!', ok: (s) => (s.stat.blocks || 0) >= 10 },
    { id: 'flyer3', icon: '🦋', name: '행운 사냥꾼', desc: '황금 나비·별똥별 3번 잡기', ok: (s) => (s.stat.flyers || 0) >= 3 },
    { id: 'bonus1', icon: '🌧️', name: '당근 비', desc: '보너스 길 달리기', ok: (s) => (s.stat.bonus || 0) >= 1 },
    { id: 'bottle3', icon: '🍾', name: '편지 친구', desc: '병 편지 3통 열기', ok: (s) => (s.stat.bottles || 0) >= 3 },
    { id: 'rich', icon: '💰', name: '당근 부자', desc: '당근 모두 1000개 모으기', ok: (s) => (s.earned || 0) >= 1000 },
  ];
  const stat = () => (S().stat = S().stat || {});
  function checkStamps(quiet) {
    const s = S(); s.stamps = s.stamps || {}; stat();
    const got = STAMPS.filter((t) => !s.stamps[t.id] && t.ok(s));
    got.forEach((t) => { s.stamps[t.id] = today(); });
    if (!got.length) return;
    addCarrots(20 * got.length); Store.save(true);
    if (quiet) return;
    got.forEach((t, i) => setTimeout(() => {
      document.querySelectorAll('.stampPop').forEach((x) => x.remove());
      const el = document.createElement('div'); el.className = 'stampPop';
      el.innerHTML = `<div class="stamp on"><span>${t.icon}</span></div><div><b>칭찬 도장!</b><br>${t.name} <small>+20🥕</small></div>`;
      document.body.appendChild(el); Sfx.star(); setTimeout(() => el.remove(), 3200);
    }, 600 + i * 1400));
  }
  function stamps() {
    const s = S(); s.stamps = s.stamps || {};
    const n = Object.keys(s.stamps).length;
    app.innerHTML = `<div class="screen bg"><div class="topbar">${back()}<div class="title">🏅 칭찬 도장 ${n} / ${STAMPS.length}</div>${carrotsHTML()}</div>
      <p style="text-align:center;margin:0;font-size:21px;color:#9b8291">도장을 하나 받을 때마다 당근 20개!</p>
      <div class="stampGrid">${STAMPS.map((t) => `<div class="stampCard ${s.stamps[t.id] ? 'got' : ''}"><div class="stamp ${s.stamps[t.id] ? 'on' : ''}"><span>${t.icon}</span>${s.stamps[t.id] ? '<em>참 잘했어요</em>' : ''}</div><b>${t.name}</b><small>${t.desc}</small></div>`).join('')}</div></div>`;
  }

  /* ---------- 설정 ---------- */
  ACT.settings = () => {
    const s = S().set, st = S();
    const row = (k, label) => `<div class="toggle">${label}<button class="sw ${s[k] ? 'on' : ''}" data-a="toggleSet" data-k="${k}"></button></div>`;
    const b = st.bday || {};
    const opts = (n, v) => `<option value="">-</option>` + Array.from({ length: n }, (_, i) => `<option ${+v === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('');
    modal(`<h2>설정</h2>${row('sfx', '🔔 효과음')}${row('voice', '🗣️ 토리 목소리')}${row('music', '🎵 배경 음악')}${row('slow', '🐢 천천히 달리기')}${row('buzz', '📳 진동')}
      <div class="toggle">🙂 이름<input id="setName" class="inp" maxlength="6" value="${esc(st.name || '재윤')}"></div>
      <div class="toggle">🎂 생일<span><select id="bm" class="inp sm">${opts(12, b.m)}</select>월 <select id="bd" class="inp sm">${opts(31, b.d)}</select>일</span></div>
      <div class="row"><button class="btn mint" data-a="saveSet">저장</button><button class="btn" data-a="replayIntro">📖 이야기 다시 보기</button></div>
      <div class="row"><button class="btn" data-a="resetAsk" style="font-size:20px">처음부터 다시 하기</button></div>
      <p style="font-size:16px;color:#b8a3b0">버전 ${APP_VERSION}</p>`, { x: true });
  };
  ACT.saveSet = () => {
    const st = S();
    const nm = ($('#setName').value || '').trim().slice(0, 6);
    if (nm) st.name = nm;
    const m = $('#bm').value, d = $('#bd').value;
    st.bday = m && d ? { m: +m, d: +d } : null;
    Store.save(true); closeModal(); toast('저장했어요 ✓');
    if (cur === 'home') go('home');
  };
  ACT.replayIntro = () => { closeModal(); Story.play('intro'); };
  ACT.toggleSet = (d, el) => {
    const s = S().set; s[d.k] = !s[d.k]; el.classList.toggle('on', s[d.k]); Store.save(true);
    if (d.k === 'music') { if (s.music) Sfx.startMusic(); else Sfx.stopMusic(); }
    if (d.k === 'voice' && s.voice) Voice.say('토리 목소리가 켜졌어요!');
  };
  ACT.resetAsk = () => {
    const bg = modal(`<div class="big">⚠️</div><h2>정말 처음부터?</h2><p>당근, 옷, 친구, 별이 모두 사라져요.<br>엄마나 오빠에게 물어보고,<br>아래 버튼을 <b>3초 동안 꾹</b> 눌러요.</p>
      <div class="row"><button class="btn" data-a="closeModal">아니요</button><button class="btn pink holdBtn" id="holdReset"><span class="fill"></span><span class="lb">꾹 눌러서 지우기</span></button></div>`);
    const hb = bg.querySelector('#holdReset'); let st = 0, raf = 0;
    const tick = () => { const k = Math.min(1, (performance.now() - st) / 3000); hb.querySelector('.fill').style.width = k * 100 + '%'; if (k >= 1) { Store.reset(); closeModal(); go('home'); return; } raf = requestAnimationFrame(tick); };
    const down = (e) => { e.preventDefault(); st = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    const up = () => { cancelAnimationFrame(raf); hb.querySelector('.fill').style.width = '0%'; };
    hb.addEventListener('pointerdown', down); hb.addEventListener('pointerup', up); hb.addEventListener('pointerleave', up); hb.addEventListener('pointercancel', up);
  };

  /* ---------- 여정 지도 ---------- */
  function map(arg) {
    const st = S();
    app.innerHTML = `<div class="screen bg"><div class="topbar">${back()}<div class="title">🗺️ 토리의 여정</div>${carrotsHTML()}</div><div id="jwrap" class="jwrap"></div>
      <div class="jhint">칸을 누르면 토리가 걸어가요 👆</div></div>`;
    Journey.mount($('#jwrap'), arg && arg.at != null ? arg.at : st.pos);
    const ph = Runner.envNow().phase; if (ph !== 'day') $('.jbox').classList.add(ph);
    const nx = Journey.nextIdx();
    const bridge = arg && arg.walkNext && Journey.NODES[nx] && Journey.NODES[nx].s === 0 && Journey.NODES[nx].w > 0 && !st.seen['bridge' + Journey.NODES[nx].w];
    if (bridge) { st.seen['bridge' + Journey.NODES[nx].w] = true; setTimeout(() => { banner('🌉 다리가 생겼어요!'); Sfx.fanfare(); Voice.say(`다리가 생겼어! ${W[Journey.NODES[nx].w].name}으로 가자!`); }, 500); }
    if (arg && arg.walkNext && nx !== Journey.at) setTimeout(() => Journey.walkTo(nx, () => { st.pos = nx; Store.save(); }), bridge ? 1600 : 700);
    if (st.bottleDay !== today() && !st.seen.bottle) { st.seen.bottle = true; Store.save(); setTimeout(() => toast('🍾 바다에 병 편지가 떠 있어요! 찾아서 눌러 봐요', 3500), 1200); }
  }
  const LETTERS = [
    '토리야, 오늘도 힘내! 너는 할 수 있어! — 삐약이 🐥', '당근은 꼭꼭 씹어 먹어야 해! — 꿀곰이 🐻', '바다에서 반짝이는 조개를 봤어! — 펭펭이 🐧',
    '재윤이가 웃으면 무지개가 떠요 🌈 — 무지개 마을', '오늘 틀린 문제는 내일의 정답이 돼요! — 몽글이 🐑', '숨은 황금 당근은 높은 곳을 좋아해! — 도토리 🐿️',
    '깃발 꼭대기를 잡으면 기분이 최고야! — 귤냥이 🐱', '친구를 꾸며 주면 친구가 엄청 좋아해! — 판순이 🐼', '심술 구름도 사실은 외로웠대 — 여울이 🦊',
  ];
  ACT.bottle = () => {
    const st = S(); if (st.bottleDay === today()) return;
    st.bottleDay = today(); stat().bottles = (stat().bottles || 0) + 1; setTimeout(checkStamps, 1500);
    const n = 10 + Math.floor(Math.random() * 4) * 5;
    addCarrots(n); Store.save(true); Sfx.gift();
    const el = document.querySelector('.bottle'); if (el) el.remove();
    const msg = pick(LETTERS).replace('재윤이', QS.josa(st.name || '재윤', '이', '')).replace(/이가/, '이가');
    modal(`<div class="big">🍾</div><h2>바다에서 온 병 편지!</h2><div class="letter">${esc(msg)}</div><p>편지 속에 당근이 ${carrotTag().replace('<img', '<img style="width:30px;vertical-align:middle"')} ${n}개!</p><div class="row"><button class="btn pink big" data-a="closeModal">고마워!</button></div>`);
    Voice.say('병 편지다! ' + msg.split(' — ')[0]);
    confetti(innerWidth / 2, innerHeight / 2, 40);
  };
  ACT.bonusRun = (d) => {
    if (S().bonusDay === today()) { toast('🎁 보너스 길은 하루 한 번! 내일 또 와요'); Voice.say('보너스 길은 하루에 한 번! 내일 또 오자!'); return; }
    modal(`<div class="big">🥕🌧️</div><h2>보너스 길: 당근 비!</h2><p>문제 없이 마음껏 달리며<br>당근을 잔뜩 모아요! (하루 한 번)</p><div class="row"><button class="btn pink big" data-a="bonusGo" data-w="${d.w}">달리자! ▶</button></div>`, { x: true });
    Voice.say('보너스 길이다! 당근 비가 내린대!');
  };
  ACT.bonusGo = (d) => { closeModal(); go('game', { w: +d.w, s: 'x' }); };
  ACT.node = (d) => {
    const i = +d.i, n = Journey.NODES[i];
    if (Journey.walking) { Journey.onIdle(() => ACT.node(d)); return; }
    if (!Journey.open(i)) { toast('🔒 앞 칸을 먼저 깨면 열려요!'); Voice.say('앞 칸을 먼저 깨면 열려요!'); return; }
    Journey.walkTo(i, () => { S().pos = i; Store.save(); stageCard(n); });
  };
  function stageCard(n) {
    const st = S(), wd = W[n.w];
    if (n.s === 'b') {
      const won = !!(st.boss || {})[n.w];
      modal(`<div style="width:220px;margin:0 auto">${ART.boss(n.w, won ? 'happy' : 'angry')}</div><h2>${wd.icon} ${ART.BOSSES[n.w].name}</h2>
        <p>${won ? '이제 착한 친구가 됐어요! 다시 겨뤄 볼까요?' : '문제를 맞힐 때마다 당근을 던져요!<br>한 번에 맞히면 왕 당근! 🥕'}</p>
        <div class="row"><button class="btn pink big" data-a="play" data-w="${n.w}" data-s="b">${won ? '다시 겨루기 ▶' : '보스와 겨루기! ▶'}</button></div>`, { x: true, cls: 'card2' });
      return;
    }
    const k = stageKey(n.w, n.s), stars = st.stars[k] || 0, gold = (st.gold || {})[k] || [];
    const fr = friendOf(n.w, n.s), got = st.friends[fr.id];
    modal(`<div class="chapterTag" style="background:${wd.color}">${wd.icon} ${wd.name} ${n.s + 1}</div><h2>${wd.stages[n.s].name}</h2>
      <div class="cardRow"><div class="cardF">${got ? ART.friend(fr.id, got.top) : ART.friendShadow(fr.id)}<small>${got ? `${fr.name} 구함 ✓` : '이 친구를 구하러!'}</small></div>
      <div class="cardInfo"><div class="bigStars small">${[0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('')}</div>
      <div class="goldRow">${[0, 1, 2].map((i) => `<i class="${gold[i] ? 'on' : ''}"></i>`).join('')}<span>숨은 황금 당근</span></div></div></div>
      <div class="row"><button class="btn pink big" data-a="play" data-w="${n.w}" data-s="${n.s}">출발! ▶</button></div>`, { x: true, cls: 'card2' });
    Voice.say(got ? `${wd.stages[n.s].name}! 다시 달려 볼까?` : `${QS.josa(fr.kind, '을', '를')} 구하러 가자!`);
  }
  ACT.play = (d) => {
    const w = +d.w, s = d.s === 'b' ? 'b' : +d.s;
    closeModal();
    const st = S();
    const ch = 'ch' + w;
    const startIt = () => {
      if (s === 'b' && !(st.boss || {})[w] && !st.seen['boss' + w]) { st.seen['boss' + w] = true; Store.save(); Story.play('boss' + w, () => go('game', { w, s })); }
      else go('game', { w, s });
    };
    if (!st.seen[ch]) { st.seen[ch] = true; Store.save(); Story.play(ch, startIt); }
    else startIt();
  };

  /* ---------- 달리기 ---------- */
  function game({ w, s }) {
    const st = S();
    const boss = s === 'b', bonus = s === 'x';
    const qs = boss ? QS.makeBossSet(w, 10, st.recent) : bonus ? [] : QS.makeSet(w, s, 8, st.recent);
    // 🔁 전에 틀린 문제를 두 개까지 다시 (같은 섬, 무지개 길은 아무 섬)
    st.retry = (st.retry || []).filter((r) => r && r.q && r.q.choices);
    if (!boss && !bonus) {
      const pool = st.retry.filter((r) => r.w === w || w === W.length - 1).slice(0, 2);
      pool.forEach((r, k) => { const at = 2 + k * 3; if (at < qs.length && !qs.some((q) => q.key === r.q.key)) qs[at] = Object.assign({}, r.q, { retry: true }); });
    }
    const fr = boss || bonus ? null : friendOf(w, s);
    G = { w, s, boss, bonus, qs, qi: -1, tries: 0, res: [], combo: 0, best: 0, qCarrots: 0, field: 0, poleBonus: 0, gold: [false, false, false],
      rescue: fr && !st.friends[fr.id] ? fr.id : null, friend: fr, done: false, hints: 2 };
    const prog = bonus ? `<div class="prog boss"><span class="bossName">🎁 보너스 길 · 당근을 모아요! 🥕</span></div>` : boss
      ? `<div class="prog boss"><div class="hpbar"><i style="width:100%"></i></div><span class="bossName">☁️ ${ART.BOSSES[w].name}</span></div>`
      : `<div class="prog"><div class="bar" style="width:0%"></div>${qs.map((_, i) => `<span class="pin" style="left:${((i + 1) / 9) * 100}%"></span>`).join('')}<span class="goal">🏁</span><span class="me" style="left:0%">${lookSVG(st.look, 'run0', 'happy')}</span></div>`;
    app.innerHTML = `<div class="screen" id="gameScr">
      <div class="hud"><button class="iconbtn" data-a="pause" aria-label="멈춤">⏸️</button>${prog}
        ${boss || bonus ? '' : `<div class="goldHud">${[0, 1, 2].map(() => '<i></i>').join('')}</div>`}${carrotsHTML()}</div>
      <div class="comboHud" id="combo"></div>
      <div id="qbox"></div></div>`;
    Runner.start({
      mode: boss ? 'boss' : bonus ? 'bonus' : 'stage', bossIdx: w, hp: 8,
      world: W[w].id, count: qs.length, seed: Math.floor(Math.random() * 6), look: st.look,
      team: st.team.filter((id) => st.friends[id]).slice(0, 3).map((id) => ({ id, top: st.friends[id].top || '' })),
      rescue: G.rescue, slow: !!st.set.slow, tapHint: !st.seen.tap, goldHint: !st.seen.gold, blockHint: !st.seen.block,
      onAsk, onCarrot, onPass, onFinish: finish, onHint, onGold, onPole, onBlock, onBossHp, onFlyer,
    });
    st.plays++; Store.save();
    Voice.say(bonus ? '당근 비다! 마음껏 먹자!' : boss ? '심술 구름이다! 문제를 맞혀서 당근을 던지자!' : pick(['출발!', '달려 보자!', '준비, 출발!', '친구야, 기다려! 금방 갈게!']));
  }
  function hint(html, ms = 4000) {
    const g = $('#gameScr'); if (!g) return;
    const old = $('.tapHint'); if (old) old.remove();
    clearTimeout(hint.t);
    if (!html) return;
    g.insertAdjacentHTML('beforeend', `<div class="tapHint">${html}</div>`);
    hint.t = setTimeout(() => { const h = $('.tapHint'); if (h) h.remove(); }, ms);
  }
  function onHint(kind) {
    if (kind === true) { hint('👆 화면을 톡! 누르면 점프 · <b>꾹</b> 누르면 더 높이!', 7000); Voice.say('화면을 톡 누르면 점프! 꾹 누르면 더 높이 뛰어!'); }
    else if (kind === false) { S().seen.tap = true; Store.save(); hint(null); }
    else if (kind === 'block') { hint('❓ 선물 구름 밑에서 <b>톡!</b> 머리로 콩 하면 선물이 나와요', 5000); Voice.say('선물 구름이다! 밑에서 점프해서 머리로 콩!'); S().seen.block = true; Store.save(); }
    else if (kind === 'gold') { hint('✨ 반짝이는 황금 당근! 화면을 <b>꾹</b> 눌러서 높이 뛰어요', 5000); Voice.say('반짝이는 황금 당근이다! 꾹 눌러서 높이 뛰어!'); S().seen.gold = true; Store.save(); }
    else if (kind === 'pole') { hint('🏁 깃발 앞에서 <b>꾹</b> 눌러 높이 점프! 높을수록 보너스', 4500); Voice.say('깃발이다! 꾹 눌러서 높이 뛰어!'); }
    else hint(null);
  }
  function onCarrot(n, x, y, kind) {
    if (!G) return;
    G.field += n; addCarrots(n);
    mission('field', n); if (kind === 's' || kind === 'big') mission('shine', 1);
    flyText('+' + n, x, y - 30, n >= 5 ? '#f59f00' : '#ff922b');
  }
  function onGold(i, x, y) {
    if (!G) return;
    G.gold[i] = true;
    const el = document.querySelectorAll('.goldHud i')[i]; if (el) el.classList.add('on');
    banner('✨ 숨은 황금 당근! ✨'); flyText('황금 당근!', x - 40, y - 50, '#f59f00');
    Voice.say(pick(['우와! 황금 당근이다!', '숨은 황금 당근 찾았다!', '반짝반짝 황금 당근!']));
  }
  function onFlyer(x, y, kind) {
    if (!G) return;
    G.field += 10; addCarrots(10); flyText('+10 🥕', x - 30, y - 30, '#f59f00');
    banner(kind === 'meteor' ? '🌠 별똥별을 잡았다!' : '🦋 황금 나비를 잡았다!');
    Voice.say(kind === 'meteor' ? '별똥별을 잡았다! 소원을 빌어 봐!' : '황금 나비다! 행운이 올 거야!');
    stat().flyers = (stat().flyers || 0) + 1; mission('shine', 1);
  }
  function onPole(tier) {
    const B = [0, 10, 20, 30, 50][tier];
    if (tier === 4) stat().poleTop = (stat().poleTop || 0) + 1;
    G.poleBonus = B; addCarrots(B);
    banner(['', '🏁 도착!', '🏁 좋아!', '🌟 높이 점프!', '👑 꼭대기!'][tier] + ` +${B}`);
    Voice.say(['', '도착!', '좋아!', '와, 높다!', '꼭대기다! 최고야!'][tier]);
  }
  function onBlock(gives) {
    stat().blocks = (stat().blocks || 0) + 1;
    if (gives === 'star') { toast('🌈 무지개 별! 당근이 쏙쏙 끌려와요'); Voice.say('무지개 별이다! 반짝반짝!'); }
    else if (gives === 'balloon') { toast('🎈 풍선 타고 하늘 당근 냠냠!'); Voice.say('풍선 타고 둥실둥실!'); }
    else if (gives === 'carrots') Voice.say('당근이 와르르!');
  }
  function onBossHp(hp, max) {
    const b = $('.hpbar i'); if (b) b.style.width = (hp / max) * 100 + '%';
    if (hp <= 0) { const q = $('#qbox'); if (q) q.innerHTML = ''; Voice.say(`${ART.BOSSES[G.w].name}이 착해졌어!`); }
  }
  function onPass(qi) { updateProg(qi + 1); }
  function updateProg(n) {
    const bar = $('.prog .bar'), me = $('.prog .me');
    if (bar) bar.style.width = (n / 9) * 100 + '%';
    if (me) me.style.left = (n / 9) * 100 + '%';
  }
  function onAsk(qi) {
    if (!G) return;
    if (qi < 0) qi = G.qi + 1;                 // 보스판: 다음 문제
    if (qi >= G.qs.length) { G.qs.push(...QS.makeBossSet(G.w, 4)); }
    G.qi = qi; G.tries = 0; G.hinted = false;
    const q = G.qs[qi];
    const long = q.choices.some((c) => c.length > 7);
    const box = $('#qbox');
    box.innerHTML = `<div class="qpanel" id="qp">
      ${q.retry ? '<div class="retryTag">🔁 다시 도전!</div>' : ''}
      <div class="qL"><div class="qtext"><button class="speak" data-a="speakQ" aria-label="다시 듣기">🔊</button><span>${esc(q.text)}</span></div><div class="qvis">${q.visual}</div><div id="qex"></div>
        ${G.hints > 0 && q.choices.length > 2 ? `<button class="hintBtn" data-a="hint">💡 토리 힌트 <b>${G.hints}</b></button>` : ''}</div>
      <div class="qR">${q.choices.map((ch, i) => `<button class="choice ${q.emoji ? 'emo' : ''} ${q.subj === 'e' && !q.emoji ? 'en' : ''} ${long ? 'small' : ''}" data-a="choose" data-i="${i}">${esc(ch)}</button>`).join('')}</div></div>`;
    speakQ();
  }
  function speakQ() {
    if (!G || G.qi < 0) return;
    const q = G.qs[G.qi];
    Voice.say(q.speak).then(() => { if (q.say && !q.sayAfter && G && G.qs[G.qi] === q) Voice.say(q.say[0], q.say[1], { queue: true }); });
  }
  ACT.speakQ = () => speakQ();
  ACT.hint = (d, el) => {
    if (!G || G.answered || G.hints <= 0 || G.hinted) return;
    const q = G.qs[G.qi];
    const btns = [...document.querySelectorAll('.choice')].filter((b, i) => q.choices[i] !== q.answer && !b.classList.contains('no'));
    if (btns.length < 2) { toast('이미 하나 남았어요! 골라 봐요'); return; }
    G.hints--; G.hinted = true;
    const b = btns[Math.floor(Math.random() * btns.length)];
    b.classList.add('no', 'hinted'); el.remove();
    Sfx.pop(); Runner.react('wink', 1);
    Voice.say(pick(['이건 아니야! 남은 것 중에 골라 봐!', '하나 지워 줄게! 힘내!']));
  };
  function closeQ(kind) {
    const p = $('#qp'); if (p) p.classList.add('hide');
    setTimeout(() => {
      if ($('#qbox')) $('#qbox').innerHTML = '';
      if (!G) return;
      G.answered = false;
      if (G.boss) Runner.bossAttack(kind === 'first' ? 2 : 1);
      else Runner.answered(kind);
    }, 280);
  }
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
      const gain = first ? (G.hinted ? 3 : 5) : 2;
      G.res[G.qi] = { first, q };
      const st0 = S();
      if (first && !G.hinted) st0.retry = (st0.retry || []).filter((r) => r.q.key !== q.key);
      if (q.retry && first) setTimeout(() => banner('🔁 이번엔 맞혔다!'), 300);
      G.qCarrots += gain; addCarrots(gain);
      confetti(r.left + r.width / 2, r.top + r.height / 2, first ? 30 : 14);
      flyText(`+${gain} 🥕`, r.left + r.width / 2 - 30, r.top - 10);
      if (first) {
        G.combo++; G.best = Math.max(G.best, G.combo);
        if (G.combo >= 3 && G.combo % 3 === 0) {
          addCarrots(3); G.qCarrots += 3;
          if (!G.boss) { banner(`🔥 ${G.combo}연속! 무지개 별!`); setTimeout(() => Runner.power('star'), 400); }
          else banner(`🔥 ${G.combo}연속 정답!`);
        }
      } else G.combo = 0;
      showCombo();
      if (Math.random() < 0.6) setTimeout(() => Runner.cheer(pick(first ? ['최고야!', '천재다!', '멋져!', '토리 짱!', '야호!'] : ['잘했어!', '좋아좋아!'])), 900);
      const pin = document.querySelectorAll('.prog .pin')[G.qi]; if (pin) pin.classList.add(first ? 'ok' : 'meh');
      Voice.say(q.sayAfter && q.say ? q.say[0] : pick(first ? ['딩동댕!', '맞았어!', '최고야!', '멋져!', '우와, 천재다!', '정답!'] : ['맞았어!', '잘했어!', '좋아!']), q.sayAfter && q.say ? q.say[1] : 'ko');
      setTimeout(() => closeQ(first ? 'first' : 'second'), 750);
      return;
    }
    G.tries++; G.combo = 0; showCombo();
    if (G.tries === 1) {
      const st0 = S(); st0.retry = st0.retry || [];
      if (!st0.retry.some((r) => r.q.key === q.key)) { const { retry, ...plain } = q; st0.retry.unshift({ q: plain, w: G.w }); st0.retry = st0.retry.slice(0, 16); Store.save(); }
    }
    el.classList.add('no'); Sfx.wrong(); Runner.react('oops', 1.2);
    if (G.boss) Runner.bossTaunt();
    const left = q.choices.length - G.tries;
    if (G.tries >= 2 || left <= 1) {
      G.answered = true;
      G.res[G.qi] = { first: false, miss: true, q };
      const pin = document.querySelectorAll('.prog .pin')[G.qi]; if (pin) pin.classList.add('meh');
      document.querySelectorAll('.choice').forEach((b, i) => { if (q.choices[i] === q.answer) b.classList.add('show'); else b.classList.add('no'); });
      $('#qex').innerHTML = `<div class="explain">💡 ${esc(q.explain || ('정답은 ' + q.answer))}</div><button class="btn mint qgo" data-a="afterMiss">알겠어! ▶</button>`;
      Voice.say('정답은 이거야. ' + (q.explain || '')).then(() => { if (q.say && G && G.qs[G.qi] === q) Voice.say(q.say[0], q.say[1], { queue: true }); });
    } else {
      Runner.cheer(pick(['괜찮아!', '힘내!', '할 수 있어!']));
      Voice.say(G.boss ? pick(['흥! 틀렸지롱~ 다시 해 봐!', '후우~ 바람이다! 한 번 더!']) : pick(['괜찮아, 한 번 더!', '아깝다! 다시 해 볼까?', '음, 다른 걸 골라 볼까?']));
    }
  };
  ACT.afterMiss = () => closeQ('miss');
  function showCombo() {
    const c = $('#combo'); if (!c || !G) return;
    if (G.combo >= 2) { c.innerHTML = `🔥<b>${G.combo}</b><small>연속</small>`; c.className = 'comboHud on'; void c.offsetWidth; c.classList.add('pop'); }
    else c.className = 'comboHud';
  }
  function pauseGame() {
    if (!G || G.done) return;
    Runner.setPaused(true);
    modal(`<div class="big">⏸️</div><h2>잠깐 쉬어요</h2><div class="row"><button class="btn pink big" data-a="resume">▶ 계속 달리기</button></div><div class="row"><button class="btn" data-a="quitGame">🗺️ 지도로 가기</button></div>`);
  }
  ACT.pause = pauseGame;
  ACT.resume = () => { closeModal(); Runner.setPaused(false); };
  ACT.quitGame = () => { G = null; Runner.stop(); go('map'); };

  /* ---------- 판 끝 ---------- */
  const SPECIAL_POOL = () => ART.ITEMS.filter((it) => it.special && !it.gold && !it.ending && !it.event);
  function finish(res) {
    if (!G || G.done) return;
    G.done = true;
    const st = S();
    st.gold = st.gold || {}; st.boss = st.boss || {}; st.worldGift = st.worldGift || {};
    const giftQ = [];
    const pickGift = () => { const left = SPECIAL_POOL().filter((it) => !st.owned[it.id] && !giftQ.includes(it)); return left.length ? left[Math.floor(Math.random() * left.length)] : { bonus: 40 }; };
    const n = G.boss ? G.res.filter(Boolean).length : G.qs.length;
    const firsts = G.res.filter((r) => r && r.first).length;
    mission('play', 1); mission('first', firsts);
    stat().combo = Math.max(stat().combo || 0, G.best);
    if (!G.boss && n > 0 && firsts === n) stat().perfect = (stat().perfect || 0) + 1;
    st.correct += firsts;
    st.recent = [...G.qs.slice(0, G.qi + 1).map((q) => q.key), ...st.recent].slice(0, 120);
    if (G.boss) return bossFinish(firsts, n, giftQ, pickGift);
    if (G.bonus) {
      st.bonusDay = today(); stat().bonus = (stat().bonus || 0) + 1; addCarrots(15); Store.save(true); setTimeout(checkStamps, 1800);
      Sfx.fanfare(); confetti(innerWidth / 2, innerHeight * 0.3, 70);
      modal(`<div class="result"><div class="big">🥕🌧️🐰</div><h2>당근 비 끝!</h2><div class="gain">${carrotTag()}<b>+${G.field + G.poleBonus + 15}</b></div>
        <div class="gainParts"><span>🥕 길 ${G.field}</span><span>🏁 깃발 ${G.poleBonus}</span><span>🎁 보너스 15</span></div><p>내일 또 와요! 🌙</p>
        <div class="row"><button class="btn pink big" data-a="toMap">🗺️ 지도로 ▶</button></div></div>`);
      Voice.say(`당근을 ${G.field + G.poleBonus + 15}개나 모았어!`);
      G.result = { w: G.w, s: 'x' };
      return;
    }
    const key = stageKey(G.w, G.s);
    const stars = firsts >= n - 1 ? 3 : firsts >= n - 3 ? 2 : 1;
    const prev = st.stars[key] || 0;
    st.stars[key] = Math.max(prev, stars);
    if (stars === 3) mission('star3', 1);
    // 황금 당근
    const beforeGold = goldCount();
    const g0 = st.gold[key] || [false, false, false];
    const newGold = res.gold.filter((x, i) => x && !g0[i]).length;
    st.gold[key] = g0.map((x, i) => x || res.gold[i]);
    const allGold = st.gold[key].every(Boolean) && !g0.every(Boolean);
    const afterGold = goldCount();
    ART.ITEMS.filter((it) => it.gold && beforeGold < it.gold && afterGold >= it.gold && !st.owned[it.id]).forEach((it) => giftQ.push(it));
    const clear = 10, starB = stars * 5, goldB = newGold * 10 + (allGold ? 20 : 0);
    let treasure = 0, newFriend = null;
    if (G.rescue) {
      newFriend = G.friend;
      st.friends[newFriend.id] = { top: '' };
      if (st.team.length < 3) st.team.push(newFriend.id);
    } else treasure = 15;
    if (stars === 3 && prev < 3) giftQ.push(pickGift());
    G.giftQ = giftQ;
    const bonus = clear + starB + treasure + goldB;
    addCarrots(bonus);
    Store.save(true);
    const total = G.qCarrots + G.field + bonus + G.poleBonus;
    const wrongs = G.res.filter((r) => r && !r.first);
    Sfx.fanfare();
    confetti(innerWidth / 2, innerHeight * 0.3, 60);
    const goldNow = st.gold[key];
    modal(`<div class="result">
      ${firsts === n ? '<div class="perfect">PERFECT 💯</div>' : ''}
      <h2>도착! ${stars === 3 ? '완벽해요 🎉' : stars === 2 ? '잘했어요 🎉' : '해냈어요 🎉'}</h2>
      <div class="bigStars">${[0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('')}</div>
      <p>한 번에 맞힌 문제 <b>${firsts}</b> / ${n}${G.best >= 3 ? ` · 🔥 최고 ${G.best}연속` : ''}</p>
      <div class="goldRow big">${[0, 1, 2].map((i) => `<i class="${goldNow[i] ? 'on' : ''} ${res.gold[i] && !g0[i] ? 'new' : ''}"></i>`).join('')}<span>${allGold ? '황금 당근 다 모았다! +20' : newGold ? `황금 당근 ${newGold}개 찾았어요!` : '숨은 황금 당근을 찾아봐요'}</span></div>
      ${newFriend ? `<div class="topRow"><div class="chip on" style="font-size:24px">${ART.friend(newFriend.id)} 새 친구 <b>${newFriend.name}</b>(${newFriend.kind})${QS.josa(newFriend.kind, '을', '를').slice(newFriend.kind.length)} 구했어요!</div></div>` : ''}
      <div class="gain">${carrotTag()}<b>+${total}</b></div>
      <div class="gainParts"><span>🧠 문제 ${G.qCarrots}</span><span>🥕 길 ${G.field}</span><span>🏁 깃발 ${G.poleBonus}</span><span>⭐ 별 ${starB + clear}</span>${goldB ? `<span>✨ 황금 ${goldB}</span>` : ''}${treasure ? `<span>🎁 보물 ${treasure}</span>` : ''}</div>
      ${giftQ.length ? `<div class="row"><button class="btn lav big" data-a="openGift">🎁 선물 상자 열기!${giftQ.length > 1 ? ` (${giftQ.length}개)` : ''}</button></div>` : ''}
      ${wrongs.length ? `<details class="wrongs"><summary style="font-size:22px">📒 다시 볼 문제 ${wrongs.length}개</summary>${wrongs.map((r) => `<div>${esc(r.q.text)} → 정답 <b>${esc(r.q.answer)}</b></div>`).join('')}</details>` : ''}
      <div class="row" ${giftQ.length ? 'style="opacity:0;pointer-events:none" id="afterGift"' : ''}>
        <button class="btn" data-a="replay">🔁 다시</button>
        <button class="btn pink big" data-a="toMap">🗺️ 다음으로 ▶</button></div>
    </div>`);
    setTimeout(() => checkStamps(), 1800);
    Voice.say(stars === 3 ? '와! 별 세 개야! 정말 대단해!' : stars === 2 ? '별 두 개! 잘했어!' : '끝까지 왔어! 멋져!').then(() => {
      if (newFriend) Voice.say(`${newFriend.name}: 토리야, 구해 줘서 고마워! 나도 같이 갈래!`, 'ko', { queue: true });
    });
    G.result = { w: G.w, s: G.s };
  }
  function bossFinish(firsts, n, giftQ, pickGift) {
    const st = S(), w = G.w;
    const first = !st.boss[w];
    st.boss[w] = true;
    if (first) giftQ.push(pickGift());
    const ending = first && w === W.length - 1;
    if (ending && !st.owned.rainbowcrown) giftQ.push(ART.ITEMS.find((it) => it.id === 'rainbowcrown'));
    G.giftQ = giftQ;
    const bonus = first ? 50 : 20;
    addCarrots(bonus); Store.save(true);
    const total = G.qCarrots + G.field + bonus;
    const showResult = () => {
      Sfx.fanfare(); confetti(innerWidth / 2, innerHeight * 0.3, 70);
      modal(`<div class="result"><div style="display:flex;justify-content:center;align-items:center;gap:10px"><div style="width:180px">${ART.boss(w, 'happy')}</div><div style="width:110px">${ART.badge(w)}</div></div>
        <h2>${ART.BOSSES[w].name}이 친구가 됐어요!</h2>
        <p>${first ? `${W[w].name}의 배지를 받았어요! ${w < W.length - 1 ? '다음 섬으로 가는 다리가 생겼어요 🌉' : ''}<br>🎁 지도에 <b>보너스 길(당근 비)</b>이 열렸어요!` : '다시 이겼어요! 대단해요!'}</p>
        <div class="gain">${carrotTag()}<b>+${total}</b></div>
        <div class="gainParts"><span>🧠 문제 ${G.qCarrots}</span><span>🥕 길 ${G.field}</span><span>👑 보스 ${bonus}</span></div>
        ${giftQ.length ? `<div class="row"><button class="btn lav big" data-a="openGift">🎁 선물 상자 열기!${giftQ.length > 1 ? ` (${giftQ.length}개)` : ''}</button></div>` : ''}
        <div class="row" ${giftQ.length ? 'style="opacity:0;pointer-events:none" id="afterGift"' : ''}><button class="btn pink big" data-a="toMap">🗺️ ${w < W.length - 1 ? '다음 섬으로 ▶' : '지도로 ▶'}</button></div></div>`);
      Voice.say(first ? '배지를 받았어! 다음 섬으로 가자!' : '또 이겼다!');
      setTimeout(() => checkStamps(), 1800);
    };
    G.result = { w, s: 'b' };
    if (first) Story.play('win' + w, () => { if (ending) { st.ended = true; Store.save(true); Story.play('ending', showResult); } else showResult(); });
    else showResult();
  }
  ACT.replay = () => { const r = G && G.result; if (r) go('game', { w: r.w, s: r.s }); };
  ACT.toMap = () => { G = null; go('map', { walkNext: true }); };
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
        st.owned[it.id] = true; st.gifts.push(it.id); st.newItems = Object.assign(st.newItems || {}, { [it.id]: 1 }); Store.save(true);
        const lk = Object.assign({}, st.look, { [it.cat]: it.id });
        inner = `<div class="reveal">${lookSVG(lk, 'cheer', 'wow')}</div><h2>${it.name}!</h2><p>${it.gold ? `황금 당근 ${it.gold}개를 모아서 받은 옷이에요 ✨` : it.ending ? '여정을 끝낸 친구만 쓰는 왕관이에요 🌈' : '특별한 옷을 받았어요 ✨'}</p>
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
    toast(`${QS.josa(it.name, '을', '를')} 입었어요! ✨`);
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
        const isNew = (s.newItems || {})[it.id];
        return `<button class="card ${worn ? 'worn' : ''} ${it.special ? 'special' : ''} ${secret ? 'secret' : ''} ${!own && !it.special && it.price > s.carrots ? 'cant' : ''}" data-a="pickItem" data-id="${it.id}">
          ${isNew ? '<span class="newTag">NEW</span>' : ''}<div class="th">${thumb(lk, it.cat)}</div><div class="nm">${secret ? '???' : it.name}</div>
          ${own ? '<div class="tag">내 거예요</div>' : it.special ? `<div class="tag">${it.gold ? `✨ 황금 당근 ${it.gold}개` : it.ending ? '🌈 여정 끝' : it.event ? '🎄 크리스마스' : '🎁 별 3개 선물'}</div>` : `<div class="pr">${carrotTag()}${it.price}</div>`}</button>`;
      }).join('');
    }
    // 이번에 본 칸의 NEW 표시는 다음에 지워요
    setTimeout(() => { if (s.newItems) { ART.ITEMS.filter((it) => it.cat === CL.cat).forEach((it) => delete s.newItems[it.id]); Store.save(); } }, 1500);
    const hasNew = (cat) => ART.ITEMS.some((it) => it.cat === cat && (s.newItems || {})[it.id]);
    const newIn = (cat) => hasNew(cat) || (cat === 'fur' ? Object.entries(ART.FURS).some(([k, f]) => !s.owned['fur:' + k] && f.price <= s.carrots) : ART.ITEMS.some((it) => it.cat === cat && !it.special && !s.owned[it.id] && it.price <= s.carrots));
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
    if (it.special) {
      const m = it.gold ? `황금 당근을 ${it.gold}개 모으면 받아요!` : it.ending ? '여정을 끝까지 가면 받아요!' : it.event ? '크리스마스에 선물로 와요!' : '별 3개를 받으면 선물 상자에서 나와요!';
      toast('🎁 ' + m); Voice.say(m); return;
    }
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
      s.carrots -= price; onBuy(); Store.save(true); mission('dress', 1); setTimeout(checkStamps, 900);
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
      <p style="font-size:21px;margin:2px 0 6px">💕 좋아하는 것: ${esc(f.like || '')}</p><div class="topRow">${ART.TOPPERS.map((t) => `<button class="chip ${me.top === t.id ? 'on' : ''}" data-a="topper" data-id="${f.id}" data-t="${t.id}">${t.id ? ART.friend(f.id, t.id) : '🚫'} ${t.name}</button>`).join('')}</div>
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
          <div class="photoStage" id="pstage"><svg class="bd" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">${ART.backdrop(ST.bd)}</svg><svg class="frameTop" viewBox="0 0 1000 600" preserveAspectRatio="none">${ART.frame(ST.frame || '')}</svg><div class="trash" id="trash">🗑️</div></div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn" data-a="pose">🔄 토리 포즈</button>
            <button class="btn pink big" data-a="snap">📸 찰칵!</button>
            <button class="btn" data-a="clearStk">🧽 스티커 지우기</button></div>
        </div>
        <div class="studioSide">
          <div class="panel"><h3>배경</h3><div class="bdList">${ART.BACKDROPS.map((b) => `<button class="${ST.bd === b.id ? 'on' : ''}" data-a="bd" data-id="${b.id}" aria-label="${b.name}"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">${ART.backdrop(b.id)}</svg></button>`).join('')}</div></div>
          <div class="panel"><h3>테두리</h3><div class="frList">${ART.FRAMES.map((f) => `<button class="${(ST.frame || '') === f.id ? 'on' : ''}" data-a="frame" data-id="${f.id}">${f.id ? `<svg viewBox="0 0 1000 600">${ART.frame(f.id)}</svg>` : '🚫'}</button>`).join('')}</div></div>
          <div class="panel"><h3>스티커 (끌어서 옮겨요)</h3><div class="stkList">${ART.STICKERS.map((e) => `<button data-a="stk" data-e="${e}">${e}</button>`).join('')}</div></div>
          <div class="panel" style="overflow:auto;min-height:0"><h3>친구 부르기</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${mine.length ? mine.map((id) => `<button class="chip ${ST.pieces.some((p) => p.id === id) ? 'on' : ''}" data-a="callF" data-id="${id}" style="padding:4px 6px">${ART.friend(id, s.friends[id].top)}</button>`).join('') : '<p style="font-size:18px;margin:0;color:#9b8291">친구를 구하면 같이 찍을 수 있어요!</p>'}${Object.keys(s.boss || {}).map((i) => `<button class="chip ${ST.pieces.some((p) => p.kind === 'boss' && p.i == i) ? 'on' : ''}" data-a="callB" data-i="${i}" style="padding:4px 6px">${ART.boss(+i, 'happy')}</button>`).join('')}</div></div>
        </div></div></div>`;
    renderPieces();
  }
  function pieceHTML(p, i) {
    const s = S();
    if (p.kind === 'tori') { const [po, ex] = ST.poses[ST.pose % ST.poses.length]; return `<div class="piece" data-i="${i}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%">${lookSVG(s.look, po, ex)}</div>`; }
    if (p.kind === 'friend') return `<div class="piece" data-i="${i}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%">${ART.friend(p.id, (s.friends[p.id] || {}).top || '')}</div>`;
    if (p.kind === 'boss') return `<div class="piece" data-i="${i}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%">${ART.boss(p.i, 'happy')}</div>`;
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
  ACT.frame = (d) => { ST.frame = d.id; studio(); Sfx.pop(); };
  ACT.pose = () => { ST.pose++; renderPieces(); Sfx.pop(); };
  ACT.stk = (d) => {
    if (ST.pieces.filter((p) => p.kind === 'stk').length >= 24) { toast('스티커가 가득 찼어요!'); return; }
    ST.pieces.push({ kind: 'stk', e: d.e, x: 15 + Math.random() * 70, y: 12 + Math.random() * 50, size: 56 + Math.random() * 24 });
    renderPieces(); Sfx.pop();
  };
  ACT.clearStk = () => { ST.pieces = ST.pieces.filter((p) => p.kind !== 'stk'); renderPieces(); };
  ACT.callB = (d) => {
    const i = ST.pieces.findIndex((p) => p.kind === 'boss' && p.i === +d.i);
    if (i >= 0) ST.pieces.splice(i, 1); else ST.pieces.push({ kind: 'boss', i: +d.i, x: 20 + Math.random() * 60, y: 45, w: 22 });
    studio();
  };
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
      const svg = p.kind === 'tori' ? lookSVG(s.look, ...ST.poses[ST.pose % ST.poses.length]) : p.kind === 'boss' ? ART.boss(p.i, 'happy') : ART.friend(p.id, (s.friends[p.id] || {}).top || '');
      const ratio = p.kind === 'tori' ? 260 / 200 : p.kind === 'boss' ? 200 / 240 : 134 / 120;
      const h = w * ratio;
      body += svg.replace('<svg ', `<svg x="${p.x * 10 - w / 2}" y="${p.y * 6 - h}" `).replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`);
    }
    body += ART.frame(ST.frame || '');
    body += `<text x="975" y="580" font-size="20" text-anchor="end" fill="#fff" opacity=".9" font-family="sans-serif" stroke="#6e5363" stroke-width="3" paint-order="stroke">토리의 반짝 달리기 · ${today()}</text>`;
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
      await Photos.add(url); mission('photo', 1); stat().photos = (stat().photos || 0) + 1; checkStamps();
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
      modal(`<img class="photoBig" src="${p.url}" alt="사진"><div class="row"><button class="btn" data-a="delPhoto" data-id="${p.id}">🗑️ 지우기</button><button class="btn sky" data-a="savePhoto" data-id="${p.id}">💾 태블릿에 저장</button><button class="btn pink" data-a="closeModal">닫기</button></div>`, { x: true });
    };
    ACT.savePhoto = (d) => {
      const p = list.find((x) => x.id === d.id); if (!p) return;
      const a = document.createElement('a'); a.href = p.url; a.download = `토리사진_${new Date(p.at).toISOString().slice(0, 10)}_${p.id.slice(-4)}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      toast('💾 저장했어요! 갤러리(다운로드)에서 볼 수 있어요', 2600);
    };
    ACT.delPhoto = (d, el) => {
      if (!el.dataset.sure) { el.dataset.sure = '1'; el.textContent = '정말 지울까요? 한 번 더!'; el.classList.add('pink'); return; }
      Photos.del(d.id).then(() => { closeModal(); album(); });
    };
  }

  const SCREENS = { home, map, game, stamps, closet: () => { CL = { cat: CL.cat || 'hat', tryOn: null }; closet(); }, friends, studio: () => { ST = ST ? Object.assign(ST, { pieces: ST.pieces }) : null; studio(); }, album };

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
