const QS = require('../js/questions.js');
const strip = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, '[그림]').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
for (let w = 0; w < 4; w++) for (let s = 0; s < 3; s++) {
  console.log(`\n== ${QS.WORLDS[w].name} ${s + 1} (${QS.WORLDS[w].stages[s].name})`);
  for (const q of QS.makeSet(w, s, 6)) console.log(`- ${q.text} | ${strip(q.visual)} | [${q.choices.join(' / ')}] 정답 ${q.answer} | 💡${q.explain}`);
}
