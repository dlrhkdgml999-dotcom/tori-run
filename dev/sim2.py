# 시뮬레이션 2: 재윤이 하루 — 12판 전부(정답률 70%), 실제 속도 한 판 시간, 보상 계산, 다른 화면 크기
import asyncio, sys, json, random, os, subprocess, time
from playwright.async_api import async_playwright
OUT = '/home/claude/tori-run/dev/out/s2'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', '8821'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.6)
errs = []
random.seed(7)
async def answer_loop(pg, acc, snaps=None, tag=''):
    t0 = time.time(); n = 0; rescue_shot = False
    while time.time() - t0 < 400:
        await pg.wait_for_timeout(100)
        if await pg.query_selector('.result'): break
        stt = await pg.evaluate('Runner.state')
        if snaps and stt == 'rescue' and not rescue_shot:
            await pg.wait_for_timeout(700); await pg.screenshot(path=f'{OUT}/{tag}_rescue.png'); rescue_shot = True
        if await pg.query_selector('#qp:not(.hide)') and not await pg.evaluate('UI.G && UI.G.answered'):
            await pg.wait_for_timeout(int(random.uniform(1500, 4000) / (await pg.evaluate('window.__fast||1'))))
            q = await pg.evaluate('({a:UI.G.qs[UI.G.qi].answer, c:UI.G.qs[UI.G.qi].choices})')
            if random.random() < acc:
                await pg.click(f'.choice[data-i="{q["c"].index(q["a"])}"]')
            else:
                wr = [i for i, c in enumerate(q['c']) if c != q['a']]
                await pg.click(f'.choice[data-i="{wr[0]}"]'); await pg.wait_for_timeout(500)
                if random.random() < 0.4 and len(wr) > 1:
                    await pg.click(f'.choice[data-i="{wr[1]}"]'); await pg.wait_for_timeout(800); await pg.click('[data-a="afterMiss"]')
                else:
                    await pg.click(f'.choice[data-i="{q["c"].index(q["a"])}"]')
            n += 1
            await pg.wait_for_timeout(1000)
        elif random.random() < 0.12:
            await pg.mouse.click(640, 600)   # 화면 톡 (점프)
    return n, time.time() - t0
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx = await b.new_context(viewport={'width': 1280, 'height': 800}, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8821/index.html'); await pg.wait_for_timeout(900)
        await pg.click('[data-a="takeBonus"]'); await pg.wait_for_timeout(300)
        # 실제 속도 한 판
        await pg.evaluate("UI.ACT.play({w:'0',s:'0'})")
        n, t = await answer_loop(pg, 0.7, snaps=True, tag='real')
        print(f'실제 속도 한 판: 문제 {n}개, {t:.0f}초')
        await pg.screenshot(path=f'{OUT}/real_result.png')
        await pg.evaluate('UI.ACT.closeModal()')
        # 나머지 11판 (빠르게)
        await pg.evaluate('window.__fast = 4')
        log = []
        order = [(w, s) for s in range(3) for w in range(4)][1:]
        for (w, s) in order:
            c0 = await pg.evaluate('Store.S.carrots')
            await pg.evaluate(f"UI.ACT.play({{w:'{w}',s:'{s}'}})")
            n, t = await answer_loop(pg, 0.7)
            await pg.wait_for_timeout(600)
            g = await pg.query_selector('[data-a="openGift"]')
            if g:
                await g.click(); await pg.wait_for_timeout(300); await pg.click('#giftBox', force=True); await pg.wait_for_timeout(500)
                await pg.click('[data-a="giftDone"]')
            c1 = await pg.evaluate('Store.S.carrots')
            st = await pg.evaluate(f"Store.S.stars['{'mker'[w]}{s}']")
            log.append((w, s, st, c1 - c0, round(t)))
            await pg.evaluate('UI.ACT.closeModal()')
        for l in log: print('판', l)
        S = await pg.evaluate('Store.S')
        print('당근', S['carrots'], '번 당근', S['earned'], '친구', len(S['friends']), '별', sum(S['stars'].values()), '선물', S['gifts'])
        price = await pg.evaluate("ART.ITEMS.filter(i=>!i.special).reduce((a,i)=>a+i.price,0) + Object.values(ART.FURS).reduce((a,f)=>a+f.price,0)")
        print('살 수 있는 옷 전부 값', price)
        await pg.evaluate("UI.go('map')"); await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/map_after.png')
        await pg.evaluate("UI.go('home')"); await pg.wait_for_timeout(400)
        await pg.click('[data-a="missions"]'); await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/missions.png')
        await pg.evaluate('UI.ACT.closeModal()')
        await pg.evaluate("UI.go('friends')"); await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/friends_after.png')
        # 다른 화면 크기
        for (nm, vw, vh) in [('phone_land', 915, 412), ('tab_port', 800, 1280), ('phone_port', 390, 844)]:
            await pg.set_viewport_size({'width': vw, 'height': vh})
            for scr in ['home', 'map', 'closet', 'studio']:
                await pg.evaluate(f"UI.go('{scr}')"); await pg.wait_for_timeout(350)
                await pg.screenshot(path=f'{OUT}/{nm}_{scr}.png')
            await pg.evaluate("UI.ACT.play({w:'1',s:'2'})")
            for _ in range(80):
                await pg.wait_for_timeout(100)
                if await pg.query_selector('#qp'): break
            await pg.wait_for_timeout(500); await pg.screenshot(path=f'{OUT}/{nm}_game.png')
            await pg.evaluate('UI.ACT.quitGame()')
        print('오류', len(errs), errs[:5])
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
