import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv = subprocess.Popen(['python3','-m','http.server','8814'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.5)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx = await b.new_context(viewport={'width':1280,'height':800}, has_touch=True)
        pg = await ctx.new_page()
        await pg.goto('http://localhost:8814/index.html'); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.ACT.closeModal(); UI.ACT.play({w:'0',s:'0'})"); await pg.wait_for_timeout(1200)
        await pg.touchscreen.tap(700, 600); await pg.wait_for_timeout(120)
        print('손가락 톡 → 점프:', await pg.evaluate('Runner._G().tori.air'), await pg.evaluate('Runner.state'))
        await pg.wait_for_timeout(900)
        await pg.mouse.click(700, 500); await pg.wait_for_timeout(120)
        print('마우스 톡 → 점프:', await pg.evaluate('Runner._G().tori.air'), await pg.evaluate('Runner.state'))
        # 결승까지 빨리: 모든 문제 정답
        await pg.evaluate('window.__fast=4')
        for _ in range(400):
            await pg.wait_for_timeout(100)
            if await pg.evaluate("Runner.state === 'rescue'"): break
            if await pg.query_selector('#qp:not(.hide)') and not await pg.evaluate('UI.G.answered'):
                i = await pg.evaluate('UI.G.qs[UI.G.qi].choices.indexOf(UI.G.qs[UI.G.qi].answer)')
                await pg.click(f'.choice[data-i="{i}"]')
        await pg.evaluate('window.__fast=1'); await pg.wait_for_timeout(1300)
        await pg.screenshot(path='dev/out/rescue2.png')
        for _ in range(60):
            await pg.wait_for_timeout(100)
            if await pg.query_selector('.result'): break
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='dev/out/result2.png')
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
