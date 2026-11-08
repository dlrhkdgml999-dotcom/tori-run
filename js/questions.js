/* 토리의 반짝 달리기 — 문제 (1학년 2학기 범위, 모두 새로 지은 문제) */
'use strict';
const QS = (() => {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); if (c < 0xac00 || c > 0xd7a3) return w + b; return w + (((c - 0xac00) % 28) ? a : b); };
  const hasBatchim = (ch) => { const c = ch.charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };

  /* 정답 + 오답들 → 보기 3개 */
  function mk(o) {
    const wrong = [];
    for (const w of o.wrong) if (String(w) !== String(o.answer) && !wrong.some((x) => String(x) === String(w))) wrong.push(w);
    const opts = shuffle([o.answer, ...wrong.slice(0, (o.n || 3) - 1)]);
    return {
      key: o.key, subj: o.subj, text: o.text, visual: o.visual || '', speak: o.speak || o.text,
      say: o.say || null,                      // 영어 낱말처럼 따로 읽어 줄 것 [text, lang]
      choices: opts.map(String), answer: String(o.answer),
      big: !!o.big, emoji: !!o.emoji, explain: o.explain || '', sayAfter: !!o.sayAfter,
    };
  }
  /* 숫자 오답: 정답 근처, 1~99(또는 0~) 범위 */
  function numWrongs(ans, cands, lo = 0, hi = 100) {
    const out = [];
    for (const c of shuffle(cands)) { const v = ans + c; if (v >= lo && v <= hi && v !== ans && !out.includes(v)) out.push(v); }
    return out;
  }

  /* ================= 수학 1-2 ================= */
  const SINO = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const NAT_T = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
  const NAT_O = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
  const sino = (n) => { const t = Math.floor(n / 10), o = n % 10; return (t ? (t === 1 ? '' : SINO[t]) + '십' : '') + SINO[o]; };
  const native = (n) => NAT_T[Math.floor(n / 10)] + NAT_O[n % 10];
  const OBJ = ['🍓', '🍎', '🐟', '⭐', '🌸', '🍪', '🎈', '🐥'];
  const rods = (t, o) => {
    let s = '<div class="rods">';
    for (let i = 0; i < t; i++) s += '<div class="rod">' + '<i></i>'.repeat(10) + '</div>';
    s += '<div class="cubes">';
    for (let i = 0; i < o; i++) s += '<i></i>';
    return s + '</div></div>';
  };
  function clockSVG(h, m) {
    let s = '<svg viewBox="0 0 200 200" class="clock"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#6e5363" stroke-width="7"/>';
    for (let i = 1; i <= 12; i++) {
      const a = (i * 30 - 90) * Math.PI / 180;
      s += `<text x="${(100 + Math.cos(a) * 70).toFixed(1)}" y="${(100 + Math.sin(a) * 70 + 9).toFixed(1)}" text-anchor="middle" font-size="25" fill="#6e5363" font-family="Jua, sans-serif">${i}</text>`;
    }
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const a = (i * 6 - 90) * Math.PI / 180;
      s += `<circle cx="${(100 + Math.cos(a) * 86).toFixed(1)}" cy="${(100 + Math.sin(a) * 86).toFixed(1)}" r="1.6" fill="#c9b8c4"/>`;
    }
    const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
    s += `<line x1="100" y1="100" x2="${(100 + Math.sin(ha * Math.PI / 180) * 44).toFixed(1)}" y2="${(100 - Math.cos(ha * Math.PI / 180) * 44).toFixed(1)}" stroke="#ff6b8b" stroke-width="9" stroke-linecap="round"/>`;
    s += `<line x1="100" y1="100" x2="${(100 + Math.sin(ma * Math.PI / 180) * 66).toFixed(1)}" y2="${(100 - Math.cos(ma * Math.PI / 180) * 66).toFixed(1)}" stroke="#4c6ef5" stroke-width="6" stroke-linecap="round"/>`;
    return s + '<circle cx="100" cy="100" r="7" fill="#6e5363"/></svg>';
  }
  // 숫자 읽기(일·이·삼…) 받침으로 조사 고르기
  const numB = (n) => (n % 10 === 0 ? n !== 0 : [1, 3, 6, 7, 8].includes(n % 10));
  const numJosa = (n) => (numB(n) ? '과' : '와');
  const nObj = (n) => n + (numB(n) ? '을' : '를');
  const nIs = (n) => n + (numB(n) ? '이에요' : '예요');
  const tAns = (h, m) => h + '시' + (m ? ' 30분' : '');

  const M = {
    bundle() {
      const t = R(5, 9), o = R(1, 9), n = t * 10 + o;
      const wr = [o * 10 + t, n + 10, n - 10, n + 1, n - 1];
      return mk({ key: 'mb' + n, subj: 'm', text: `10개씩 묶음 ${t}개와 낱개 ${o}개는?`, visual: rods(t, o), answer: n, wrong: wr.filter((x) => x > 0 && x < 100 && x !== n), big: true,
        explain: `10개씩 묶음 ${t}개는 ${t * 10}, 낱개 ${o}개를 더하면 ${nIs(n)}.` });
    },
    readNative() {
      const n = R(5, 9) * 10 + R(1, 9);
      const wr = [n % 10 * 10 + Math.floor(n / 10), n + 10, n - 10, n + 1, n - 1];
      return mk({ key: 'mn' + n, subj: 'm', text: `'${native(n)}'${josa(native(n), '을', '를').slice(native(n).length)} 숫자로 쓰면?`, speak: `${josa(native(n), '을', '를')} 숫자로 쓰면?`, answer: n, wrong: wr.filter((x) => x > 9 && x < 100 && x !== n), big: true,
        explain: `${josa(NAT_T[Math.floor(n / 10)], '은', '는')} ${Math.floor(n / 10) * 10}, ${josa(NAT_O[n % 10], '은', '는')} ${n % 10}이니까 ${nIs(n)}.` });
    },
    readSino() {
      const n = R(5, 9) * 10 + R(1, 9);
      const wr = [n % 10 * 10 + Math.floor(n / 10), n + 10, n - 10, Math.floor(n / 10) * 100 + n % 10];
      return mk({ key: 'ms' + n, subj: 'm', text: `'${sino(n)}'${josa(sino(n), '을', '를').slice(sino(n).length)} 숫자로 쓰면?`, speak: `${josa(sino(n), '을', '를')} 숫자로 쓰면?`, answer: n, wrong: wr.filter((x) => x > 9 && x !== n), big: true,
        explain: `${josa(sino(n), '은', '는')} ${n}${numB(n) ? '이라고' : '라고'} 써요.` });
    },
    biggest() {
      const t = R(5, 9), base = t * 10 + R(0, 9);
      let set = [base];
      while (set.length < 3) { const v = pick([base % 10 * 10 + Math.floor(base / 10), base + R(-9, 9), (t - 1) * 10 + R(0, 9), t * 10 + R(0, 9)]); if (v >= 50 && v < 100 && !set.includes(v)) set.push(v); }
      const small = Math.random() < 0.4;
      const ans = small ? Math.min(...set) : Math.max(...set);
      return mk({ key: 'mc' + (small ? 's' : 'b') + set.slice().sort().join(','), subj: 'm', text: small ? '가장 작은 수는?' : '가장 큰 수는?', answer: ans, wrong: set.filter((x) => x !== ans), big: true,
        explain: '10개씩 묶음의 수(앞자리)를 먼저 비교하고, 같으면 낱개(뒷자리)를 비교해요.' });
    },
    seq() {
      const kind = R(0, 2);
      if (kind === 0) {
        const n = R(50, 98);
        return mk({ key: 'mq+' + n, subj: 'm', text: `${n}보다 1 큰 수는?`, answer: n + 1, wrong: [n - 1, n + 10, n + 2], big: true, explain: `${n} 바로 다음 수는 ${nIs(n + 1)}.` });
      }
      if (kind === 1) {
        const n = R(51, 99);
        return mk({ key: 'mq-' + n, subj: 'm', text: `${n}보다 1 작은 수는?`, answer: n - 1, wrong: [n + 1, n - 10, n - 2], big: true, explain: `${n} 바로 앞의 수는 ${nIs(n - 1)}.` });
      }
      const s = R(50, 95), hole = R(1, 3), arr = [s, s + 1, s + 2, s + 3, s + 4];
      const ans = arr[hole];
      return mk({ key: 'mq_' + s + '_' + hole, subj: 'm', text: '❓에 들어갈 수는?', visual: `<div class="seqrow">${arr.map((v, i) => `<b>${i === hole ? '❓' : v}</b>`).join('')}</div>`, speak: '물음표에 들어갈 수는?', answer: ans, wrong: [ans + 1, ans - 1, ans + 10], big: true, explain: '수가 1씩 커지고 있어요.' });
    },
    evenOdd() {
      const n = R(2, 20), obj = pick(OBJ);
      const even = n % 2 === 0;
      return mk({ key: 'me' + n, subj: 'm', text: `${obj}가 ${n}개 있어요. 둘씩 짝을 지으면?`, speak: `${n}개를 둘씩 짝을 지으면?`, visual: `<div class="objs">${(obj).repeat(n)}</div>`,
        answer: even ? '남는 것이 없어요 (짝수)' : '하나가 남아요 (홀수)', wrong: [even ? '하나가 남아요 (홀수)' : '남는 것이 없어요 (짝수)'], n: 2,
        explain: even ? `${n}${numB(n) ? '은' : '는'} 둘씩 짝을 지으면 남는 것이 없어서 짝수예요.` : `${n}${numB(n) ? '은' : '는'} 둘씩 짝을 지으면 하나가 남아서 홀수예요.` });
    },
    shape() {
      const Qs = [
        ['뾰족한 곳이 3군데인 모양은?', '▲'], ['뾰족한 곳이 4군데인 모양은?', '■'], ['뾰족한 곳이 없고 둥근 모양은?', '●'],
        ['📺 텔레비전 화면과 같은 모양은?', '■'], ['🍙 삼각김밥과 같은 모양은?', '▲'], ['🪙 동전과 같은 모양은?', '●'],
        ['🖼️ 액자와 같은 모양은?', '■'], ['⚠️ 조심 표지판과 같은 모양은?', '▲'], ['🍩 도넛 바깥쪽과 같은 모양은?', '●'],
        ['곧은 선이 3개인 모양은?', '▲'], ['곧은 선이 4개인 모양은?', '■'], ['곧은 선이 하나도 없는 모양은?', '●'],
      ];
      const [q, a] = pick(Qs);
      return mk({ key: 'mh' + q, subj: 'm', text: q, answer: a, wrong: ['▲', '■', '●'], big: true, explain: '■ 네모(사각형) · ▲ 세모(삼각형) · ● 동그라미(원)' });
    },
    addEasy() {
      const kind = R(0, 2);
      let a, b;
      if (kind === 0) { a = R(2, 8) * 10 + R(1, 5); b = R(1, 9 - a % 10); }
      else if (kind === 1) { a = R(1, 6) * 10; b = R(1, 9 - a / 10) * 10; }
      else { a = R(2, 7); b = R(1, 10 - a); }
      const ans = a + b;
      return mk({ key: 'ma' + a + '+' + b, subj: 'm', text: `${a} + ${b} = ❓`, speak: `${a} 더하기 ${b}는?`, answer: ans, wrong: numWrongs(ans, [1, -1, 10, -10, 2]), big: true,
        explain: kind === 1 ? `10개씩 묶음끼리 더해요. ${a / 10} + ${b / 10} = ${ans / 10} → ${ans}` : `${a} + ${b} = ${ans}` });
    },
    subEasy() {
      const kind = R(0, 2);
      let a, b;
      if (kind === 0) { a = R(2, 9) * 10 + R(3, 9); b = R(1, a % 10); }
      else if (kind === 1) { a = R(3, 9) * 10; b = R(1, a / 10 - 1) * 10; }
      else { a = R(5, 10); b = R(1, a - 1); }
      const ans = a - b;
      return mk({ key: 'ms' + a + '-' + b, subj: 'm', text: `${a} − ${b} = ❓`, speak: `${a} 빼기 ${b}는?`, answer: ans, wrong: numWrongs(ans, [1, -1, 10, -10, 2], 0, 100), big: true, explain: `${a} − ${b} = ${ans}` });
    },
    makeTen() {
      const a = R(1, 9);
      return mk({ key: 'mt' + a, subj: 'm', text: `${a}${numJosa(a)} 더해서 10이 되는 수는?`, speak: `${a}${numJosa(a)} 더해서 10이 되는 수는?`, visual: `<div class="tenframe">${'<i class="on"></i>'.repeat(a)}${'<i></i>'.repeat(10 - a)}</div>`,
        answer: 10 - a, wrong: numWrongs(10 - a, [1, -1, 2, -2], 0, 10), big: true, explain: `${a} + ${10 - a} = 10` });
    },
    addCarry() {
      const a = R(3, 9), b = R(11 - a, 9);
      const ans = a + b;
      return mk({ key: 'mA' + a + '+' + b, subj: 'm', text: `${a} + ${b} = ❓`, speak: `${a} 더하기 ${b}는?`, answer: ans, wrong: numWrongs(ans, [1, -1, -10, 2, -2], 1, 20), big: true,
        explain: `${a}에 ${nObj(10 - a)} 먼저 더해 10을 만들고, 남은 ${nObj(b - (10 - a))} 더하면 ${nIs(ans)}.` });
    },
    subBorrow() {
      const a = R(11, 18), b = R(a - 9, 9);
      const ans = a - b;
      return mk({ key: 'mS' + a + '-' + b, subj: 'm', text: `${a} − ${b} = ❓`, speak: `${a} 빼기 ${b}는?`, answer: ans, wrong: numWrongs(ans, [1, -1, 10, 2, -2], 0, 20), big: true,
        explain: `${a}에서 ${nObj(a - 10)} 먼저 빼서 10을 만들고, 10에서 ${nObj(b - (a - 10))} 더 빼면 ${nIs(ans)}.` });
    },
    three() {
      const a = R(1, 9), c = R(1, 9);
      const ans = 10 + c;
      return mk({ key: 'm3' + a + '+' + c, subj: 'm', text: `${a} + ${10 - a} + ${c} = ❓`, speak: `${a} 더하기 ${10 - a} 더하기 ${c}는?`, answer: ans, wrong: numWrongs(ans, [1, -1, -10, 2, -2], 1, 30), big: true,
        explain: `${a} + ${10 - a} = 10을 먼저 만들면 10 + ${c} = ${ans}` });
    },
    clock0() {
      const h = R(1, 12);
      const other = ((h + R(1, 10) - 1) % 12) + 1;
      return mk({ key: 'mk' + h, subj: 'm', text: '시계가 가리키는 시각은?', visual: clockSVG(h, 0), answer: tAns(h, 0), wrong: [tAns(h, 30), tAns(other, 0), tAns(12, 0)].filter((x) => x !== tAns(h, 0)),
        explain: `긴바늘이 12를 가리키면 '몇 시'예요. 짧은바늘이 ${nObj(h)} 가리키니까 ${h}시!` });
    },
    clock30() {
      const h = R(1, 12), nh = h % 12 + 1;
      return mk({ key: 'mK' + h, subj: 'm', text: '시계가 가리키는 시각은?', visual: clockSVG(h, 30), answer: tAns(h, 30), wrong: [tAns(nh, 30), tAns(h, 0), tAns(nh, 0)],
        explain: `긴바늘이 6을 가리키면 '30분'이에요. 짧은바늘이 ${h}${numJosa(h)} ${nh} 사이에 있으면 ${h}시 30분!` });
    },
    pattern() {
      const sets = [['🍎', '🍌'], ['⭐', '🌙'], ['🐰', '🥕'], ['🔴', '🔵'], ['🌸', '🍀'], ['🍓', '🍋', '🍇'], ['🐶', '🐱', '🐰'], ['🟡', '🟢', '🟣']];
      const items = pick(sets);
      let unit;
      if (items.length === 3) unit = items.slice();
      else unit = pick([[items[0], items[1]], [items[0], items[0], items[1]], [items[0], items[1], items[1]]]);
      const seq = []; while (seq.length < 7) seq.push(unit[seq.length % unit.length]);
      const ans = seq[6];
      const others = ['🍉', '🎈', '🐟', '🌈'];
      return mk({ key: 'mp' + unit.join(''), subj: 'm', text: '규칙에 따라 ❓에 올 것은?', speak: '규칙에 따라 물음표에 올 것은?', visual: `<div class="seqrow emo">${seq.slice(0, 6).map((v) => `<b>${v}</b>`).join('')}<b class="q">❓</b></div>`,
        answer: ans, wrong: [...items.filter((x) => x !== ans), pick(others)], big: true, emoji: true, explain: `${unit.join(' ')} 가 계속 되풀이돼요.` });
    },
  };

  /* ================= 국어 1-2 ================= */
  const SPELL = [
    ['🐶', '강아지', ['강아찌', '감아지']], ['🦋', '나비', ['나삐', '너비']], ['🌷', '꽃', ['꼿', '꼳']], ['🍇', '포도', ['보도', '포두']],
    ['🐟', '물고기', ['물꼬기', '물고끼']], ['🏫', '학교', ['학꾜', '핚교']], ['🍞', '빵', ['방', '팡']], ['🌙', '달', ['닫', '탈']],
    ['👟', '신발', ['신빨', '싱발']], ['🐘', '코끼리', ['코기리', '꼬끼리']], ['⭐', '별', ['벌', '볃']], ['🐔', '닭', ['닥', '달']],
    ['🚗', '자동차', ['자통차', '자동자']], ['🌳', '나무', ['나므', '너무']], ['🥛', '우유', ['오유', '우요']], ['🍓', '딸기', ['달기', '땅기']],
    ['🐰', '토끼', ['도끼', '토기']], ['☂️', '우산', ['우상', '오산']], ['🎈', '풍선', ['풍썬', '붕선']], ['🐢', '거북이', ['거부기', '거북기']],
    ['🍦', '아이스크림', ['아이수크림', '아이스크린']], ['👓', '안경', ['안겅', '앙경']], ['🦒', '기린', ['기린이', '기링']], ['🍉', '수박', ['수빡', '수발']],
    ['🧦', '양말', ['얌말', '양발']], ['🐿️', '다람쥐', ['다람지', '다람주']], ['🌻', '해바라기', ['해바리기', '해바락이']], ['🍪', '과자', ['가자', '과짜']],
    ['🚂', '기차', ['기자', '끼차']], ['🦁', '사자', ['싸자', '사짜']], ['🏠', '집', ['짐', '칩']], ['🍑', '복숭아', ['복숭이', '복쑹아']],
    ['🐻', '곰', ['꼼', '곰이']], ['🌈', '무지개', ['무지게', '무지계']], ['🧸', '인형', ['인영', '잉형']], ['🐌', '달팽이', ['달펭이', '달팽니']],
    ['🍳', '달걀', ['달갈', '닭걀']], ['🎂', '케이크', ['캐이크', '케익']], ['🐝', '꿀벌', ['꿀뻘', '굴벌']], ['🦆', '오리', ['어리', '오니']],
  ];
  const NOB = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '하', '고', '노', '도', '모', '보', '소', '오', '우', '주', '후', '기', '리', '미', '시', '이', '구', '누', '두', '루', '무', '부', '수', '개', '새', '해', '토', '포', '코'];
  const YESB = ['강', '달', '문', '밤', '산', '곰', '눈', '물', '발', '손', '옷', '집', '책', '꽃', '빵', '별', '닭', '밥', '콩', '공', '숲', '잎', '귤', '돈', '말', '봄', '불', '상', '방', '굴'];
  const OPP = [['크다', '작다'], ['길다', '짧다'], ['많다', '적다'], ['높다', '낮다'], ['빠르다', '느리다'], ['덥다', '춥다'], ['무겁다', '가볍다'], ['밝다', '어둡다'],
    ['넓다', '좁다'], ['기쁘다', '슬프다'], ['열다', '닫다'], ['앞', '뒤'], ['위', '아래'], ['들어가다', '나오다'], ['깨끗하다', '더럽다'], ['굵다', '가늘다'], ['오른쪽', '왼쪽'], ['안', '밖'], ['일어나다', '눕다'], ['웃다', '울다']];
  const ANIM_SOUND = [['🐶', '강아지', '멍멍'], ['🐱', '고양이', '야옹'], ['🦆', '오리', '꽥꽥'], ['🐮', '소', '음매'], ['🐷', '돼지', '꿀꿀'], ['🐓', '닭', '꼬끼오'], ['🐸', '개구리', '개굴개굴'], ['🐦', '참새', '짹짹'], ['🐑', '양', '매애']];
  const MOVE = [['🐰', '토끼', '깡충깡충'], ['🐢', '거북이', '엉금엉금'], ['🐧', '펭귄', '뒤뚱뒤뚱'], ['🐍', '뱀', '스르르'], ['🦋', '나비', '팔랑팔랑'], ['🐌', '달팽이', '느릿느릿'], ['🐟', '물고기', '뻐끔뻐끔'], ['🐝', '꿀벌', '윙윙']];
  const PUNCT = {
    '.': ['나는 아침에 우유를 마셨어요', '토리가 당근을 먹어요', '오늘은 날씨가 맑습니다', '동생과 공원에 갔어요', '나는 그림 그리기를 좋아해요', '우리 집 강아지는 하얗습니다'],
    '?': ['너는 무슨 색을 좋아하니', '지금 몇 시예요', '같이 놀러 갈래', '이 책은 누구 거야', '점심에 무엇을 먹었니', '내일 비가 올까요'],
    '!': ['와, 무지개가 떴다', '우아, 정말 크다', '조심해', '야호, 이겼다', '불이야', '와, 눈이 온다'],
  };
  const PNAME = { '.': '마침표 (.)', '?': '물음표 (?)', '!': '느낌표 (!)' };
  const FIRST = [['🐻', '곰', 'ㄱ'], ['🦋', '나비', 'ㄴ'], ['🌙', '달', 'ㄷ'], ['📻', '라디오', 'ㄹ'], ['🥕', '무', 'ㅁ'], ['⭐', '별', 'ㅂ'], ['🍎', '사과', 'ㅅ'], ['🦆', '오리', 'ㅇ'], ['🚗', '자동차', 'ㅈ'], ['🚂', '기차', 'ㄱ'], ['🍞', '빵', 'ㅃ'], ['🐰', '토끼', 'ㅌ'], ['🍇', '포도', 'ㅍ'], ['☀️', '해', 'ㅎ'], ['🐘', '코끼리', 'ㅋ'], ['🦒', '기린', 'ㄱ'], ['🍉', '수박', 'ㅅ'], ['🐟', '물고기', 'ㅁ']];
  const JAMO = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const K = {
    spell() {
      const [e, w, wr] = pick(SPELL);
      return mk({ key: 'ks' + w, subj: 'k', text: '그림에 알맞은 낱말은?', speak: '그림에 알맞은 낱말을 골라요', visual: `<div class="bigemo">${e}</div>`, answer: w, wrong: wr, big: true, explain: `${e} 는 '${w}'${hasBatchim(w[w.length - 1]) ? '이라고' : '라고'} 써요.` });
    },
    batchim() {
      const want = Math.random() < 0.6;
      const ans = want ? pick(YESB) : pick(NOB);
      const wr = want ? shuffle(NOB).slice(0, 2) : shuffle(YESB).slice(0, 2);
      return mk({ key: 'kb' + (want ? 'y' : 'n') + ans, subj: 'k', text: want ? '받침이 있는 글자는?' : '받침이 없는 글자는?', answer: ans, wrong: wr, big: true,
        explain: want ? `'${ans}' 아래에는 받침이 있어요.` : `'${ans}' 아래에는 받침이 없어요.` });
    },
    first() {
      const [e, w, j] = pick(FIRST);
      return mk({ key: 'kf' + w, subj: 'k', text: `'${w}'의 첫소리는?`, speak: `${w}의 첫소리는?`, visual: `<div class="bigemo">${e}</div>`, answer: j, wrong: shuffle(JAMO.filter((x) => x !== j)).slice(0, 2), big: true,
        explain: `'${w}'${hasBatchim(w[w.length - 1]) ? '은' : '는'} '${j}' 소리로 시작해요.` });
    },
    opp() {
      const pair = pick(OPP), flip = Math.random() < 0.5;
      const [a, b] = flip ? [pair[1], pair[0]] : pair;
      const wr = shuffle(OPP.filter((p) => p !== pair)).slice(0, 2).map((p) => p[R(0, 1)]);
      return mk({ key: 'ko' + a, subj: 'k', text: `'${a}'의 반대말은?`, speak: `${a}의 반대말은?`, answer: b, wrong: wr, big: true, explain: `'${a}' ↔ '${b}'` });
    },
    sound() {
      const it = pick(ANIM_SOUND);
      if (Math.random() < 0.5) {
        return mk({ key: 'kn' + it[1], subj: 'k', text: `${josa(it[1], '은', '는')} 어떻게 울까요?`, visual: `<div class="bigemo">${it[0]}</div>`, answer: it[2], wrong: shuffle(ANIM_SOUND.filter((x) => x !== it)).slice(0, 2).map((x) => x[2]), big: true, explain: `${it[1]} : ${it[2]}` });
      }
      return mk({ key: 'kN' + it[2], subj: 'k', text: `'${it[2]}' 우는 동물은?`, speak: `${it[2]}, 하고 우는 동물은?`, answer: it[0], wrong: shuffle(ANIM_SOUND.filter((x) => x !== it)).slice(0, 2).map((x) => x[0]), big: true, emoji: true, explain: `${it[0]} ${it[1]} : ${it[2]}` });
    },
    move() {
      const it = pick(MOVE);
      if (Math.random() < 0.5) {
        return mk({ key: 'km' + it[1], subj: 'k', text: `'${it[2]}' 움직이는 동물은?`, speak: `${it[2]} 움직이는 동물은?`, answer: it[0], wrong: shuffle(MOVE.filter((x) => x !== it)).slice(0, 2).map((x) => x[0]), big: true, emoji: true, explain: `${it[0]} ${it[1]} : ${it[2]}` });
      }
      return mk({ key: 'kM' + it[1], subj: 'k', text: `${josa(it[1], '은', '는')} 어떻게 움직일까요?`, visual: `<div class="bigemo">${it[0]}</div>`, answer: it[2], wrong: shuffle(MOVE.filter((x) => x !== it)).slice(0, 2).map((x) => x[2]), big: true, explain: `${it[1]} : ${it[2]}` });
    },
    punct() {
      const p = pick(['.', '?', '!']);
      const sent = pick(PUNCT[p]);
      return mk({ key: 'kp' + sent, subj: 'k', text: '( )에 들어갈 문장 부호는?', speak: `${sent}. 괄호에 들어갈 문장 부호는?`, visual: `<div class="sent">${sent}<span class="blank">( )</span></div>`,
        answer: PNAME[p], wrong: Object.values(PNAME), explain: p === '.' ? '설명하는 문장 끝에는 마침표(.)' : p === '?' ? '묻는 문장 끝에는 물음표(?)' : '놀라거나 기쁜 마음을 나타낼 때는 느낌표(!)' });
    },
  };

  /* ================= 영어 (파닉스) ================= */
  const WORDS = [
    ['apple', '🍎'], ['ball', '⚽'], ['cat', '🐱'], ['dog', '🐶'], ['egg', '🥚'], ['fish', '🐟'], ['goat', '🐐'], ['hat', '🎩'],
    ['ice', '🧊'], ['juice', '🧃'], ['kite', '🪁'], ['lion', '🦁'], ['moon', '🌙'], ['nose', '👃'], ['octopus', '🐙'], ['pig', '🐷'],
    ['queen', '👸'], ['rabbit', '🐰'], ['sun', '☀️'], ['tiger', '🐯'], ['umbrella', '☂️'], ['van', '🚐'], ['watch', '⌚'], ['yo-yo', '🪀'], ['zebra', '🦓'],
    ['bus', '🚌'], ['cake', '🎂'], ['duck', '🦆'], ['frog', '🐸'], ['milk', '🥛'], ['bear', '🐻'], ['tree', '🌳'], ['star', '⭐'],
  ];
  const CVC = [['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['hat', '🎩'], ['sun', '☀️'], ['bus', '🚌'], ['cup', '☕'], ['bed', '🛏️'], ['box', '📦'], ['fox', '🦊'], ['hen', '🐔'], ['bug', '🐛'], ['map', '🗺️'], ['pen', '🖊️'], ['van', '🚐'], ['bat', '🦇'], ['web', '🕸️'], ['jam', '🍯']];
  const LET = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const LOOKALIKE = { b: 'dp', d: 'bq', p: 'qb', q: 'pd', m: 'nw', n: 'mu', u: 'nv', w: 'mv', i: 'jl', j: 'il', l: 'it', t: 'lf', f: 't', h: 'nk', a: 'eo', e: 'ac', o: 'ac', c: 'eo', g: 'qy', y: 'gv', v: 'uy', s: 'zc', z: 'sx', x: 'kz', k: 'hx', r: 'nf' };
  const lookWrong = (c) => { const l = (LOOKALIKE[c] || '').split(''); const rest = shuffle(LET.filter((x) => x !== c && !l.includes(x))); return [...shuffle(l), ...rest]; };

  const E = {
    caseUL() {
      const c = pick(LET), up = Math.random() < 0.5;
      const ans = up ? c : c.toUpperCase();
      const wr = lookWrong(c).map((x) => (up ? x : x.toUpperCase()));
      return mk({ key: 'eu' + (up ? 'U' : 'L') + c, subj: 'e', text: up ? `대문자 ${c.toUpperCase()}의 소문자는?` : `소문자 ${c}의 대문자는?`, speak: up ? `대문자 ${c.toUpperCase()}의 소문자는?` : `소문자 ${c}의 대문자는?`,
        visual: `<div class="bigletter">${up ? c.toUpperCase() : c}</div>`, say: [c.toUpperCase(), 'en'], answer: ans, wrong: wr, big: true, explain: `${c.toUpperCase()} ${c}` });
    },
    start() {
      const [w, e] = pick(WORDS);
      const c = w[0];
      return mk({ key: 'es' + w, subj: 'e', text: '어떤 글자로 시작할까요?', speak: '어떤 글자로 시작할까요?', say: [w, 'en'],
        visual: `<div class="bigemo">${e}</div><div class="word"><span class="hole">?</span>${w.slice(1)}</div>`, answer: c, wrong: lookWrong(c), big: true, explain: `${w} → 첫 글자는 ${c}` });
    },
    listen() {
      const [w, e] = pick(WORDS);
      const wr = shuffle(WORDS.filter((x) => x[0] !== w)).slice(0, 2).map((x) => x[1]);
      return mk({ key: 'el' + w, subj: 'e', text: '잘 듣고 알맞은 그림을 골라요', speak: '잘 듣고 알맞은 그림을 골라요', say: [w, 'en'], visual: `<div class="listen">🔊</div>`, answer: e, wrong: wr, big: true, emoji: true, explain: `${e} ${w}` });
    },
    read() {
      const [w, e] = pick(CVC);
      const wr = shuffle(CVC.filter((x) => x[0] !== w)).slice(0, 2).map((x) => x[1]);
      return mk({ key: 'er' + w, subj: 'e', text: '낱말을 읽고 알맞은 그림을 골라요', speak: '낱말을 읽고 알맞은 그림을 골라요', visual: `<div class="word big">${w}</div>`, say: [w, 'en'], answer: e, wrong: wr, big: true, emoji: true, explain: `${w} ${e}`, sayAfter: true });
    },
    vowel() {
      const [w, e] = pick(CVC);
      const v = w[1];
      return mk({ key: 'ev' + w, subj: 'e', text: '빈칸에 들어갈 글자는?', speak: '빈칸에 들어갈 글자는?', say: [w, 'en'], visual: `<div class="bigemo">${e}</div><div class="word">${w[0]}<span class="hole">?</span>${w[2]}</div>`,
        answer: v, wrong: shuffle(['a', 'e', 'i', 'o', 'u'].filter((x) => x !== v)), big: true, explain: `${w[0]} - ${v} - ${w[2]} → ${w}` });
    },
  };

  /* ================= 월드 · 스테이지 ================= */
  const WORLDS = [
    { id: 'm', name: '숫자 들판', subj: '수학', icon: '🔢', color: '#74c0fc',
      stages: [
        { name: '100까지의 수', gens: [M.bundle, M.readNative, M.readSino, M.biggest, M.seq] },
        { name: '덧셈 뺄셈 · 모양', gens: [M.addEasy, M.subEasy, M.makeTen, M.shape, M.evenOdd] },
        { name: '10 만들기 · 시계 · 규칙', gens: [M.addCarry, M.subBorrow, M.three, M.clock0, M.clock30, M.pattern] },
      ] },
    { id: 'k', name: '글자 숲', subj: '국어', icon: '🌳', color: '#69db7c',
      stages: [
        { name: '낱말 · 첫소리', gens: [K.spell, K.first, K.batchim] },
        { name: '흉내 내는 말 · 반대말', gens: [K.sound, K.move, K.opp] },
        { name: '문장 부호 · 모두 섞어', gens: [K.punct, K.spell, K.opp, K.batchim, K.move] },
      ] },
    { id: 'e', name: 'ABC 바닷가', subj: '영어', icon: '🐚', color: '#ffa94d',
      stages: [
        { name: '대문자 · 소문자', gens: [E.caseUL, E.start] },
        { name: '첫소리 · 듣고 고르기', gens: [E.start, E.listen] },
        { name: '읽고 고르기', gens: [E.read, E.vowel, E.listen] },
      ] },
    { id: 'r', name: '무지개 길', subj: '섞어서', icon: '🌈', color: '#b197fc',
      stages: [
        { name: '쉬운 길', gens: [M.bundle, M.seq, K.spell, K.first, E.caseUL, E.start] },
        { name: '보통 길', gens: [M.addEasy, M.subEasy, M.shape, K.sound, K.opp, E.listen] },
        { name: '반짝 길', gens: [M.addCarry, M.subBorrow, M.clock30, K.punct, K.move, E.read, E.vowel] },
      ] },
  ];

  /* 한 판 문제 만들기 (같은 문제 없이, 과목·종류 고르게) */
  function makeSet(w, s, n = 8, avoid = []) {
    const gens = WORLDS[w].stages[s].gens;
    const out = [], keys = new Set();
    let order = [];
    let guard = 0;
    while (out.length < n && guard++ < 400) {
      if (!order.length) order = shuffle(gens);
      const g = order.pop();
      const q = g();
      if (keys.has(q.key)) continue;
      if (guard < 200 && avoid.includes(q.key)) continue;
      keys.add(q.key);
      q.gen = g.name || '';
      out.push(q);
    }
    return out;
  }

  return { WORLDS, makeSet, M, K, E, josa, hasBatchim, clockSVG, native, sino };
})();
if (typeof module !== 'undefined') module.exports = QS;
