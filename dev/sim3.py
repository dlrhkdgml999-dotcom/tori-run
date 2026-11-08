# 시뮬레이션 3: 아무 데나 막 누르기(원숭이 테스트) + 화면 캡처
import asyncio, random, os, subprocess, time, json
from playwright.async_api import async_playwright
OUT = '/home/claude/tori-run/dev/out/s3'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', '8831'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.6)
errs = []; random.seed(11)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx = await b.new_context(viewport={'width': 1280, 'height': 800}, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append('con ' + m.text))
        await pg.goto('http://localhost:8831/index.html'); await pg.wait_for_timeout(900)
        await pg.evaluate('window.__fast = 3')
        await pg.screenshot(path=f'{OUT}/00_first.png')
        screens = {}
        for i in range(700):
            btns = await pg.query_selector_all('[data-a]:not([disabled]), #giftBox, .piece')
            vis = []
            for bt in btns:
                bb = await bt.bounding_box()
                if bb and bb['width'] > 2 and 0 <= bb['y'] < 800 and 0 <= bb['x'] < 1280: vis.append((bt, bb))
            r = random.random()
            if vis and r < 0.8:
                bt, bb = random.choice(vis)
                try:
                    await pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
                except Exception as e: pass
            elif r < 0.9:
                await pg.mouse.click(random.randint(0, 1279), random.randint(0, 799))
            else:
                await pg.go_back() if random.random() < 0.5 else None
            await pg.wait_for_timeout(random.choice([60, 150, 400]))
            cur = await pg.evaluate('UI.cur')
            screens[cur] = screens.get(cur, 0) + 1
            if i % 100 == 0: await pg.screenshot(path=f'{OUT}/m{i:03d}_{cur}.png')
        S = await pg.evaluate('Store.S')
        print('화면별 방문', screens)
        print('당근', S['carrots'], '별', sum(S['stars'].values()), '친구', len(S['friends']), '산 옷', len([k for k in S['owned'] if not k.startswith('fur:')]), '판', S['plays'])
        bad = await pg.evaluate("Store.S.carrots < 0 || isNaN(Store.S.carrots) || Store.S.team.length > 3")
        print('이상한 값', bad)
        # 깨끗한 첫 화면 (친구 있을 때)
        await pg.evaluate("UI.ACT.closeModal(); UI.go('home')"); await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/zz_home.png')
        print('오류', len(errs)); [print(' ', e) for e in errs[:10]]
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
