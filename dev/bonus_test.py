import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
OUT='/home/claude/tori-run/dev/out/bonus'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3','-m','http.server','8861'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.5)
errs=[]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':1280,'height':800})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8861/index.html'); await pg.wait_for_timeout(700)
        await pg.evaluate("document.querySelectorAll('.story').forEach(e=>e.remove()); Object.assign(Store.S.seen,{intro:true,tap:true,ch0:true}); Object.assign(Store.S.stars,{m0:3,m1:2,m2:2}); Store.S.boss={0:true}; Store.S.friends.piyo={top:'party'}; Store.S.team=['piyo']; Store.S.day=today(); UI.go('map',{at:3})")
        await pg.wait_for_timeout(900); await pg.screenshot(path=f'{OUT}/map.png')
        await pg.click('[data-a="bonusRun"]', force=True); await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/bonus_modal.png')
        await pg.click('[data-a="bonusGo"]'); await pg.wait_for_timeout(2500); await pg.screenshot(path=f'{OUT}/bonus_run.png')
        await pg.evaluate(open('/home/claude/tori-run/dev/bot.js').read()); await pg.evaluate('window.__fast=4')
        for _ in range(300):
            await pg.wait_for_timeout(100)
            if await pg.query_selector('.result'): break
        await pg.wait_for_timeout(800); await pg.screenshot(path=f'{OUT}/bonus_result.png')
        print('stat', await pg.evaluate('JSON.stringify(Store.S.stat)'), 'bonusDay', await pg.evaluate('Store.S.bonusDay'))
        await pg.evaluate("UI.go('map',{at:3})"); await pg.wait_for_timeout(800)
        await pg.click('[data-a="bonusRun"]', force=True); await pg.wait_for_timeout(300)
        print('again modal?', bool(await pg.query_selector('[data-a="bonusGo"]')))
        await pg.evaluate("UI.go('studio')"); await pg.wait_for_timeout(500); await pg.click('[data-a="callB"]'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{OUT}/studio.png')
        await pg.click('[data-a="snap"]'); await pg.wait_for_timeout(1500)
        print('photos', len(await pg.evaluate('Photos.all()')))
        print('errors', errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
