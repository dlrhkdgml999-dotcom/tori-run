// 문제 점검: node dev/q_audit.js [N]
const QS = require('../js/questions.js');
const N = +process.argv[2] || 3000;
let bad = 0; const warn = [];
const err = (m, q) => { if (bad++ < 30) console.log('이상:', m, JSON.stringify(q).slice(0, 220)); };
for (let w = 0; w < QS.WORLDS.length; w++) for (let s = 0; s < 3; s++) {
  const pos = [0, 0, 0], longest = { hit: 0, n: 0 }; const keyAns = {};
  let total = 0;
  for (let i = 0; i < N / 8; i++) {
    const set = QS.makeSet(w, s);
    if (set.length !== 8) err('판 문제 수 ' + set.length, { w, s });
    for (const q of set) {
      total++;
      if (!q.choices.includes(q.answer)) err('정답이 보기에 없음', q);
      if (new Set(q.choices).size !== q.choices.length) err('보기 중복', q);
      if (q.choices.length < 2) err('보기 부족', q);
      if (q.choices.length === 2 && q.gen !== 'evenOdd') err('보기 2개', q);
      if ([q.text, q.speak, q.visual, ...q.choices].some((x) => /undefined|NaN/.test(String(x)))) err('undefined', q);
      if (keyAns[q.key] !== undefined && keyAns[q.key] !== q.answer) err('같은 키 다른 정답', q);
      keyAns[q.key] = q.answer;
      // 산수 검산
      const m = q.text.match(/^(\d+) ([+−]) (\d+)(?: \+ (\d+))? = ❓$/);
      if (m) {
        let v = m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
        if (m[4]) v += +m[4];
        if (String(v) !== q.answer) err('계산 틀림', q);
        if (v < 0) err('음수', q);
        if (q.choices.some((c) => +c < 0)) err('음수 보기', q);
      }
      const b = q.text.match(/^10개씩 묶음 (\d)개와 낱개 (\d)개는\?$/);
      if (b && String(+b[1] * 10 + +b[2]) !== q.answer) err('묶음 틀림', q);
      const t = q.text.match(/^(\d)와\(과\) 더해서 10/);
      if (t && String(10 - t[1]) !== q.answer) err('10 만들기 틀림', q);
      if (q.text === '가장 큰 수는?' && String(Math.max(...q.choices.map(Number))) !== q.answer) err('가장 큰 수', q);
      if (q.text === '가장 작은 수는?' && String(Math.min(...q.choices.map(Number))) !== q.answer) err('가장 작은 수', q);
      if (/숫자로 쓰면/.test(q.text)) {
        const word = q.text.match(/'(.+)'/)[1];
        if (QS.native(+q.answer) !== word && QS.sino(+q.answer) !== word) err('수 읽기 틀림', q);
      }
      if (/받침이 있는 글자/.test(q.text) && (!QS.hasBatchim(q.answer) || q.choices.filter(QS.hasBatchim).length !== 1)) err('받침', q);
      if (/받침이 없는 글자/.test(q.text) && (QS.hasBatchim(q.answer) || q.choices.filter((c) => !QS.hasBatchim(c)).length !== 1)) err('받침 없음', q);
      if (/의 소문자는/.test(q.text) && q.answer.toUpperCase() !== q.text.match(/대문자 (\w)/)[1]) err('대소문자', q);
      if (/의 대문자는/.test(q.text) && q.answer.toLowerCase() !== q.text.match(/소문자 (\w)/)[1]) err('대소문자', q);
      if (q.text.includes('은(는)') || /을\(를\)/.test(q.text)) {}
      pos[q.choices.indexOf(q.answer)]++;
      if (q.choices.length === 3 && !q.emoji) {
        const L = q.choices.map((c) => c.length); const mx = Math.max(...L);
        if (L.filter((x) => x === mx).length === 1) { longest.n++; if (q.answer.length === mx) longest.hit++; }
      }
    }
  }
  const p = pos.map((x) => Math.round(x / total * 100));
  const lr = longest.n ? Math.round(longest.hit / longest.n * 100) : 0;
  console.log(`${QS.WORLDS[w].name} ${s + 1}: ${total}문제, 서로 다른 문제 ${Object.keys(keyAns).length}, 정답 자리 ${p.join('/')}%, 가장 긴 보기=정답 ${lr}%`);
  if (lr > 55) warn.push(`${QS.WORLDS[w].name} ${s + 1} 긴 보기 쏠림 ${lr}%`);
  if (Object.keys(keyAns).length < 40) warn.push(`${QS.WORLDS[w].name} ${s + 1} 문제 종류 적음`);
}
console.log('주의:', warn.length ? warn.join(' / ') : '없음');
console.log('이상:', bad);
