import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
OUT='/home/claude/tori-run/dev/out/flyer'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3','-m','http.server','8871'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.5)
errs=[]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':1280,'height':800})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8871/index.html'); await pg.wait_for_timeout(600)
        for env in ['night', 'day']:
            await pg.evaluate("document.querySelectorAll('.story').forEach(e=>e.remove()); Object.assign(Store.S.seen,{intro:true,tap:true,ch0:true,gold:true,block:true}); Store.S.day=today(); UI.ACT.closeModal(); window.__env={phase:'" + env + "',season:'autumn'}; UI.ACT.play({w:'0',s:'0'})")
            got = False
            for _ in range(400):
                await pg.wait_for_timeout(50)
                am = await pg.query_selector('#qp:not(.hide)')
                if am and not await pg.evaluate('UI.G.answered'):
                    i = await pg.evaluate('UI.G.qs[UI.G.qi].choices.indexOf(UI.G.qs[UI.G.qi].answer)'); await pg.click(f'.choice[data-i="{i}"]')
                f = await pg.evaluate('(()=>{const f=Runner._G()&&Runner._G().flyer; return f&&!f.gone&&!f.caught&&f.x<1100?{x:f.x,y:f.y,k:f.kind}:null})()')
                if f:
                    await pg.screenshot(path=f'{OUT}/{env}_flyer.png')
                    await pg.mouse.click(f['x'], f['y']); await pg.wait_for_timeout(300)
                    got = await pg.evaluate('Runner._G().flyer.caught')
                    await pg.screenshot(path=f'{OUT}/{env}_caught.png'); break
            print(env, 'caught', got, 'stat', await pg.evaluate('JSON.stringify(Store.S.stat)'))
            await pg.evaluate('UI.ACT.quitGame()')
        print('errors', errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
