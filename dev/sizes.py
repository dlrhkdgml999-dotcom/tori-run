import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
OUT='/home/claude/tori-run/dev/out/sizes'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3','-m','http.server','8851'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.5)
errs=[]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for (n,w,h) in [('tab',1280,800),('phone',915,412),('port',800,1280)]:
            pg = await b.new_page(viewport={'width':w,'height':h})
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('http://localhost:8851/index.html'); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f'{OUT}/{n}_story.png')
            await pg.evaluate("document.querySelectorAll('.story').forEach(e=>e.remove()); Store.S.seen.intro=true; Object.assign(Store.S.stars,{m0:3,m1:2}); Store.S.friends.piyo={top:''}; Store.S.friends.dara={top:'crown'}; Store.S.team=['piyo','dara']; Store.S.gold={m0:[true,false,true]}; UI.go('map')")
            await pg.wait_for_timeout(900); await pg.screenshot(path=f'{OUT}/{n}_map.png')
            await pg.evaluate("UI.ACT.node({i:'2'})"); await pg.wait_for_timeout(1800); await pg.screenshot(path=f'{OUT}/{n}_card.png')
            await pg.evaluate("UI.ACT.closeModal(); Store.S.seen.ch0=true; Store.S.seen.boss0=true; UI.ACT.play({w:'0',s:'b'})"); await pg.wait_for_timeout(2600)
            await pg.screenshot(path=f'{OUT}/{n}_boss.png')
            await pg.evaluate("UI.ACT.quitGame(); UI.go('stamps')"); await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/{n}_stamps.png')
            await pg.evaluate("UI.go('home')"); await pg.wait_for_timeout(600); await pg.screenshot(path=f'{OUT}/{n}_home.png')
            await pg.close()
        print('errors', errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
