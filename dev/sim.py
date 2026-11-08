# 시뮬레이션: python3 dev/sim.py [이름] [W H]
import asyncio, sys, json, random, os, subprocess, time
from playwright.async_api import async_playwright
NAME = sys.argv[1] if len(sys.argv) > 1 else 'run'
VW, VH = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1280, 800)
OUT = f'/home/claude/tori-run/dev/out/{NAME}'; os.makedirs(OUT, exist_ok=True)
PORT = 8811
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT)], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)
errs = []
async def shot(pg, n):
    await pg.screenshot(path=f'{OUT}/{n}.png')
async def play_stage(pg, w, s, acc=0.8, snap=None):
    await pg.evaluate(f"UI.ACT.play({{w:'{w}', s:'{s}'}})")
    asked = 0; t0 = time.time(); shots = 0
    while time.time() - t0 < 120:
        await pg.wait_for_timeout(120)
        if await pg.query_selector('.result'):
            break
        qp = await pg.query_selector('#qp:not(.hide)')
        if qp and not await pg.evaluate('UI.G && UI.G.answered'):
            if snap and shots < 2:
                await pg.wait_for_timeout(400); await shot(pg, f'{snap}_q{shots}'); shots += 1
            ans = await pg.evaluate('UI.G.qs[UI.G.qi].answer')
            ch = await pg.evaluate('UI.G.qs[UI.G.qi].choices')
            if random.random() < acc:
                idx = ch.index(ans)
                await pg.click(f'.choice[data-i="{idx}"]')
            else:
                wrong = [i for i, c in enumerate(ch) if c != ans]
                await pg.click(f'.choice[data-i="{wrong[0]}"]')
                await pg.wait_for_timeout(200)
                if random.random() < 0.5 and len(wrong) > 1:
                    await pg.click(f'.choice[data-i="{wrong[1]}"]')
                    await pg.wait_for_timeout(300)
                    if snap and shots < 3: await shot(pg, f'{snap}_miss'); shots += 1
                    await pg.click('[data-a="afterMiss"]')
                else:
                    await pg.click(f'.choice[data-i="{ch.index(ans)}"]')
            asked += 1
            await pg.wait_for_timeout(1100)
        # 가끔 점프
        if random.random() < 0.08:
            await pg.evaluate('Runner.tap()')
    return asked, time.time() - t0
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append('console: ' + m.text))
        await pg.goto(f'http://localhost:{PORT}/index.html')
        await pg.evaluate('window.__fast = 3')
        await pg.wait_for_timeout(1200)
        await shot(pg, '01_home_bonus')
        await pg.click('[data-a="takeBonus"]'); await pg.wait_for_timeout(600)
        await shot(pg, '02_home')
        await pg.click('[data-a="go"][data-to="map"]'); await pg.wait_for_timeout(500)
        await shot(pg, '03_map')
        a, t = await play_stage(pg, 0, 0, 0.75, snap='04_m0')
        await pg.wait_for_timeout(1500)
        await shot(pg, '05_result')
        print('m0', a, round(t, 1), 's')
        st = await pg.evaluate('JSON.stringify({c:Store.S.carrots, st:Store.S.stars, fr:Store.S.friends, team:Store.S.team})')
        print(st)
        # 다른 월드 한 판씩
        for w in [1, 2, 3]:
            a, t = await play_stage(pg, w, 0, 1.0, snap=f'06_w{w}')
            await pg.wait_for_timeout(1500)
            gift = await pg.query_selector('[data-a="openGift"]')
            if gift:
                await gift.click(); await pg.wait_for_timeout(600); await shot(pg, f'07_gift_{w}')
                await pg.click('#giftBox', force=True); await pg.wait_for_timeout(900); await shot(pg, f'07_gift_open_{w}')
                await pg.click('[data-a="wearGift"]'); await pg.wait_for_timeout(400)
            await shot(pg, f'06_w{w}_result')
            print('w', w, a, round(t, 1))
        # 게임 중 화면 하나 (달리는 중)
        await pg.evaluate("UI.ACT.play({w:'0', s:'1'})"); await pg.wait_for_timeout(1500); await shot(pg, '08_running')
        await pg.evaluate("UI.ACT.quitGame()")
        await pg.wait_for_timeout(400)
        await pg.evaluate("UI.go('home')"); await pg.wait_for_timeout(500); await shot(pg, '09_home_after')
        await pg.evaluate("UI.go('closet')"); await pg.wait_for_timeout(500); await shot(pg, '10_closet')
        await pg.click('.card[data-id="flowercrown"]'); await pg.wait_for_timeout(500); await shot(pg, '11_buy')
        y = await pg.query_selector('[data-a="buyYes"]')
        if y: await y.click(); await pg.wait_for_timeout(700)
        await shot(pg, '12_bought')
        await pg.click('.tab[data-c="cloth"]'); await pg.wait_for_timeout(300); await shot(pg, '13_cloth')
        await pg.click('.tab[data-c="fur"]'); await pg.wait_for_timeout(300); await shot(pg, '13b_fur')
        await pg.evaluate("UI.go('friends')"); await pg.wait_for_timeout(500); await shot(pg, '14_friends')
        f = await pg.query_selector('.fcard[data-a="friend"]')
        if f: await f.click(); await pg.wait_for_timeout(400); await shot(pg, '15_friend_modal'); await pg.click('[data-a="topper"][data-t="crown"]'); await pg.wait_for_timeout(300); await pg.evaluate('UI.ACT.closeModal()')
        await pg.evaluate("UI.go('studio')"); await pg.wait_for_timeout(600)
        for e in ['💖', '🌈', '⭐']: await pg.click(f'[data-a="stk"][data-e="{e}"]')
        await pg.click('[data-a="bd"][data-id="rainbow"]'); await pg.wait_for_timeout(300)
        # 토리 끌기
        box = await (await pg.query_selector('.piece')).bounding_box()
        await pg.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2); await pg.mouse.down()
        await pg.mouse.move(box['x'] + box['width']/2 - 120, box['y'] + box['height']/2 + 10, steps=6); await pg.mouse.up()
        await shot(pg, '16_studio')
        await pg.click('[data-a="snap"]'); await pg.wait_for_timeout(1500)
        await pg.evaluate("UI.go('album')"); await pg.wait_for_timeout(800); await shot(pg, '17_album')
        ph = await pg.query_selector('.ph')
        if ph: await ph.click(); await pg.wait_for_timeout(400); await shot(pg, '18_photo')
        await pg.evaluate('UI.ACT.closeModal()')
        await pg.evaluate("UI.ACT.settings()"); await pg.wait_for_timeout(300); await shot(pg, '19_settings')
        # 저장 → 새로고침 후 유지
        before = await pg.evaluate('JSON.stringify(Store.S)')
        await pg.wait_for_timeout(400)
        await pg.reload(); await pg.wait_for_timeout(900)
        after = await pg.evaluate('JSON.stringify(Store.S)')
        print('저장 유지', json.loads(before)['carrots'] == json.loads(after)['carrots'], json.loads(after)['carrots'])
        print('오류', len(errs)); [print(' ', e) for e in errs[:20]]
        await b.close()
try:
    asyncio.run(main())
finally:
    srv.terminate()
