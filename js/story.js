/* 포포의 반짝 모험 — 이야기 장면 (오프닝·장 시작·보스·엔딩) */
'use strict';
const Story = (() => {
  const W = 1000, H = 560;
  const name = () => (Store.S.name || '재윤');
  const callName = () => QS.josa(name(), '아', '야');   // 재윤아
  /* SVG 하나를 장면 안에 놓기 (x=가운데, y=발 위치, w=폭) */
  function place(svg, x, y, w, extra = '') {
    const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const vw = +m[1], vh = +m[2], h = w * vh / vw;
    return `<g ${extra}>` + svg.replace('<svg ', `<svg x="${x - w / 2}" y="${y - h}" `).replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`) + '</g>';
  }
  const bubble = (inner, x, y, r) => `<g>${inner}<circle cx="${x}" cy="${y}" r="${r}" fill="#d0ebff" fill-opacity=".35" stroke="#b197fc" stroke-width="4"/><ellipse cx="${x - r * 0.45}" cy="${y - r * 0.45}" rx="${r * 0.18}" ry="${r * 0.1}" fill="#fff" transform="rotate(-40 ${x - r * 0.45} ${y - r * 0.45})"/></g>`;
  const look = () => Store.S.look;
  const friendsRow = (y, w = 92, ids = ART.FRIENDS.map((f) => f.id)) => ids.map((id, i) => place(ART.friend(id), 70 + i * ((W - 140) / Math.max(1, ids.length - 1)), y + (i % 2) * 14, w)).join('');

  function scenes(id) {
    const n = name(), cn = callName();
    const world = (i) => QS.WORLDS[i];
    const B = (i) => ART.BOSSES[i];
    switch (id) {
      case 'intro': return [
        { bd: 'rainbow', art: () => place(ART.tori(look(), 'cheer', 'happy'), 500, 470, 190) + friendsRow(520, 78), text: '무지개 마을에는 포포와 친구들이 사이좋게 살았어요.' },
        { bd: 'night', art: () => place(ART.boss(3, 'angry'), 500, 330, 420) + place(ART.tori(look(), 'stand', 'oops'), 210, 520, 150), text: '그런데 어느 날, 심술 구름이 나타났어요.\n"흥! 다들 너무 즐거워 보이잖아!"' },
        { bd: 'meadow', art: () => ART.FRIENDS.map((f, i) => bubble(place(ART.friend(f.id), 90 + (i % 6) * 164, 230 + Math.floor(i / 6) * 190, 82), 90 + (i % 6) * 164, 190 + Math.floor(i / 6) * 190, 58)).join(''), text: '심술 구름은 친구 12명을 비눗방울에 가두고\n멀리멀리 날아가 버렸어요!' },
        { bd: 'meadow', art: () => place(ART.tori(look(), 'cheer', 'wow'), 500, 520, 220), text: `포포는 친구들을 구하러 여정을 떠나기로 했어요.\n${cn}, 같이 가 줄래?`, btn: '같이 가자! 🦄' },
      ];
      case 'ch0': case 'ch1': case 'ch2': case 'ch3': {
        const i = +id[2];
        const lines = [
          '숫자 먹보 구름이 숫자를 몽땅 섞어 놨대!\n수를 바르게 세면 길이 열려요.',
          '글자 엉킴 구름이 글자를 꼬불꼬불 엉켜 놨대!\n낱말을 바르게 찾아 줘요.',
          '파도 장난 구름이 알파벳을 바다에 흩뿌렸대!\n소리를 잘 듣고 모아 봐요.',
          '드디어 무지개 길!\n대왕 심술 구름이 무지개 성에서 기다리고 있대요.',
        ];
        return [{ bd: ['meadow', 'forest', 'beach', 'rainbow'][i], chapter: `${i + 1}장`, title: `${world(i).icon} ${world(i).name}`, art: () => place(ART.tori(look(), 'run0', 'happy'), 330, 520, 170) + place(ART.boss(i, 'angry'), 720, 300, 250), text: lines[i], btn: '출발! ▶' }];
      }
      case 'boss0': case 'boss1': case 'boss2': case 'boss3': {
        const i = +id[4];
        return [{ bd: 'night', art: () => place(ART.boss(i, 'angry'), 620, 380, 420) + place(ART.tori(look(), 'stand', 'normal'), 220, 520, 160), text: `${B(i).name}: "흥! 여기는 못 지나가!"\n포포: "${cn}, 문제를 맞혀서 당근을 던지자!"`, btn: '덤벼라! 🥕' }];
      }
      case 'win0': case 'win1': case 'win2': case 'win3': {
        const i = +id[3];
        return [
          { bd: 'rainbow', art: () => place(ART.boss(i, 'happy'), 640, 360, 380) + place(ART.tori(look(), 'stand', 'happy'), 230, 520, 160), text: `${B(i).name}: "사실… 나도 같이 놀고 싶었어.\n심술부려서 미안해!"` },
          { bd: 'rainbow', art: () => place(ART.boss(i, 'happy'), 640, 360, 380) + place(ART.tori(look(), 'cheer', 'happy'), 230, 520, 160) + place(ART.badge(i), 500, 250, 120), text: `포포: "괜찮아! 그럼 우리 친구 하자!"\n${world(i).name}의 배지를 받았어요!`, btn: '좋아! ✨' },
        ];
      }
      case 'ending': return [
        { bd: 'rainbow', art: () => place(ART.tori(Object.assign({}, look(), { hat: 'rainbowcrown' }), 'cheer', 'happy'), 500, 470, 200) + friendsRow(530, 80) + [0, 1, 2, 3].map((i) => place(ART.boss(i, 'happy'), 120 + i * 250, 170, 150)).join(''), text: '무지개 마을에 다시 무지개가 떴어요!\n친구들이 모두 집으로 돌아왔어요.' },
        { bd: 'party', art: () => place(ART.tori(Object.assign({}, look(), { hat: 'rainbowcrown' }), 'cheer', 'wow'), 500, 520, 230), text: `${cn}, 정말 고마워!\n너는 최고의 여행 친구야! 💖\n🎁 무지개 왕관을 받았어요!` },
        { bd: 'night', art: () => place(ART.tori(look(), 'jump', 'happy'), 500, 500, 200) + friendsRow(540, 70), text: '끝… 이 아니에요!\n별 3개와 황금 당근을 모으러\n언제든 다시 달려요 ✨', btn: '또 놀자!' },
      ];
    }
    return [];
  }

  function play(id, onDone) {
    const list = scenes(id);
    if (!list.length) { onDone && onDone(); return; }
    let i = 0;
    const el = document.createElement('div'); el.className = 'story';
    document.body.appendChild(el);
    const show = () => {
      const sc = list[i];
      const art = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="storyArt">${ART.backdrop(sc.bd, W, H)}${sc.art()}</svg>`;
      el.innerHTML = `<div class="storyBox">${sc.chapter ? `<div class="chapter"><small>${sc.chapter}</small>${sc.title}</div>` : ''}<div class="storyPic">${art}</div>
        <div class="storyText">${esc(sc.text).replace(/\n/g, '<br>')}</div>
        <div class="storyBtns"><button class="btn" data-s="skip">${list.length > 1 && i < list.length - 1 ? '건너뛰기' : ''}</button><span class="dots">${list.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span><button class="btn pink big" data-s="next">${sc.btn || '다음 ▶'}</button></div></div>`;
      el.querySelector('[data-s="skip"]').style.visibility = list.length > 1 && i < list.length - 1 ? 'visible' : 'hidden';
      Voice.say(sc.text.replace(/\n/g, ' '));
    };
    const done = () => { Voice.stop(); el.classList.add('out'); setTimeout(() => el.remove(), 300); onDone && onDone(); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      Sfx.tap();
      if (b.dataset.s === 'skip') return done();
      i++; if (i >= list.length) done(); else show();
    });
    show();
  }
  return { play, scenes };
})();
