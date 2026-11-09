// 점프 봇: 장애물·❓구름·황금 당근·높은 당근·깃대 앞에서 알아서 뛰어요 (시뮬레이션용)
window.__botLog = { jumps: 0, dbl: 0 };
clearInterval(window.__bot);
window.__bot = setInterval(() => {
  const G = Runner._G(); if (!G || (G.state !== 'run' && G.state !== 'walk')) return;
  const u = Runner.u, tx = Runner.tx;
  const me = (G.scroll + tx) / u;
  if (G.tori.air) return;
  let want = 0, dbl = false;
  for (const hd of G.hurdles) {
    if (hd.hit || hd.smashed || hd.passed) continue;
    const dx = hd.x - me;
    if (dx > 20 && dx < (hd.roll ? 150 : 95)) { want = Math.max(want, 60); if (hd.tall || hd.roll) dbl = true; }
  }
  for (const it of G.items) {
    if (it.got || it.used) continue;
    const dx = it.x - me;
    if (it.kind === 'q' && dx > 30 && dx < 75) want = Math.max(want, 60);
    if (it.kind === 'G' && dx > 40 && dx < 120) { want = Math.max(want, 330); dbl = true; }
    if ((it.kind === 's' || it.kind === 'big') && dx > 40 && dx < 110) want = Math.max(want, 200);
  }
  if (!G.boss && G.obs.every((o) => o.done) && me > G.finishX - 190 && me < G.finishX - 100) { want = 330; dbl = true; }
  if (want) {
    Runner.tap(); window.__botLog.jumps++; setTimeout(Runner.release, want);
    if (dbl) setTimeout(() => { Runner.tap(); window.__botLog.dbl++; setTimeout(Runner.release, 120); }, 170);
  }
}, 16);
