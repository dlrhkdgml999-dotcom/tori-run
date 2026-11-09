# 실제 속도: 장애물·2단 점프·보스 구름 공 (봇) + 캡처
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
OUT='/home/claude/tori-run/dev/out/jump'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3','-m','http.server','8899'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.5)
errs=[]
async def run(pg, w, s, tag):
    await pg.evaluate(f"UI.ACT.closeModal(); UI.ACT.play({{w:'{w}',s:'{s}'}})")
    await pg.evaluate(open('/home/claude/tori-run/dev/bot.js').read())
    t0=time.time(); shot={'dbl':0,'h':0,'puff':0}; qn=0
    while time.time()-t0 < 150:
        await pg.wait_for_timeout(60)
        if await pg.query_selector('.result'): break
        if await pg.query_selector('.story'): await pg.click('.story [data-s="next"]'); continue
        st = await pg.evaluate("(()=>{const g=Runner._G(); if(!g) return null; const u=Runner.u, me=(g.scroll+Runner.tx)/u; const h=g.hurdles.find(h=>!h.passed&&!h.hit&&h.x-me<60&&h.x-me>-40); return {dbl:g.tori.dbl&&g.tori.air, h:!!h, puff:!!(h&&h.puff)}})()")
        if st:
            for k in ['dbl','h','puff']:
                if st[k] and shot[k] < 1: await pg.screenshot(path=f'{OUT}/{tag}_{k}.png'); shot[k]+=1
        if await pg.query_selector('#qp:not(.hide)') and not await pg.evaluate('UI.G.answered'):
            await pg.wait_for_timeout(1200); qn+=1
            i = await pg.evaluate('UI.G.qs[UI.G.qi].choices.indexOf(UI.G.qs[UI.G.qi].answer)'); await pg.click(f'.choice[data-i="{i}"]')
    g = await pg.evaluate("UI.G && {bumps: Runner._G()?Runner._G().bumps:null}")
    print(tag, '시간', round(time.time()-t0), '문제', qn, await pg.evaluate('JSON.stringify(Store.S.stat)'))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':1280,'height':800})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8899/index.html'); await pg.wait_for_timeout(600)
        await pg.evaluate("document.querySelectorAll('.story').forEach(e=>e.remove()); Object.assign(Store.S.seen,{intro:true,ch0:true,ch1:true,boss0:true,win0:true,gold:true,block:true,tap:true}); Store.S.day=today(); window.__env={phase:'day',season:'spring'}")
        await run(pg, 1, 1, 'stage')
        await run(pg, 0, 'b', 'boss')
        print('errors', errs); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
