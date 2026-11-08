import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
OUT='/home/claude/tori-run/dev/out/retry'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3','-m','http.server','8881'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.5)
errs=[]
async def run_stage(pg, s, mode):
    await pg.evaluate(f"UI.ACT.closeModal(); UI.ACT.play({{w:'0',s:'{s}'}})")
    seen_retry = 0; hinted = 0; shot = False
    for _ in range(900):
        await pg.wait_for_timeout(50)
        if await pg.query_selector('.result'): break
        am = await pg.query_selector('[data-a="afterMiss"]')
        if am: await am.click(); continue
        if await pg.query_selector('#qp:not(.hide)') and not await pg.evaluate('UI.G.answered'):
            q = await pg.evaluate('({a:UI.G.qs[UI.G.qi].answer, c:UI.G.qs[UI.G.qi].choices, r:!!UI.G.qs[UI.G.qi].retry})')
            if q['r']:
                seen_retry += 1
                if not shot: await pg.wait_for_timeout(300); await pg.screenshot(path=f'{OUT}/retry_q.png'); shot = True
            if mode == 'miss':
                wr = [i for i, c in enumerate(q['c']) if c != q['a']]
                await pg.click(f'.choice[data-i="{wr[0]}"]'); await pg.wait_for_timeout(150)
                if await pg.query_selector('[data-a="afterMiss"]'): continue
                await pg.click(f'.choice[data-i="{q["c"].index(q["a"])}"]')
            else:
                hb = await pg.query_selector('[data-a="hint"]')
                if hb and hinted < 2:
                    await hb.click(); hinted += 1; await pg.wait_for_timeout(250)
                    if hinted == 1: await pg.screenshot(path=f'{OUT}/hint.png')
                await pg.click(f'.choice[data-i="{q["c"].index(q["a"])}"]')
            await pg.wait_for_timeout(400)
    await pg.wait_for_timeout(500)
    return seen_retry, hinted
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':1280,'height':800})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8881/index.html'); await pg.wait_for_timeout(600)
        await pg.evaluate("document.querySelectorAll('.story').forEach(e=>e.remove()); Object.assign(Store.S.seen,{intro:true,tap:true,ch0:true,gold:true,block:true}); Store.S.day=today(); window.__fast=4")
        r1 = await run_stage(pg, 0, 'miss')
        print('1판 (다 틀림) retry 저장', await pg.evaluate('Store.S.retry.length'), r1)
        r2 = await run_stage(pg, 1, 'right')
        print('2판 (맞힘) 다시 도전 나옴/힌트', r2, '남은 retry', await pg.evaluate('Store.S.retry.length'))
        print('errors', errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
