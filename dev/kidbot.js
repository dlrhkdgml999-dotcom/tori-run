// 아이처럼: 가끔 톡, 가끔 꾹 (무작위)
clearInterval(window.__bot); window.__botLog = { jumps: 0 };
window.__bot = setInterval(() => {
  const G = Runner._G(); if (!G || G.state !== 'run' || G.tori.air) return;
  if (Math.random() < 0.035) { Runner.tap(); window.__botLog.jumps++; setTimeout(Runner.release, Math.random() < 0.4 ? 300 : 80); }
}, 50);
