# 여정 시뮬레이션: python3 dev/simj.py 이름 [정답률] [월드수]
import asyncio, sys, random, os, subprocess, time, json
from playwright.async_api import async_playwright
NAME = sys.argv[1] if len(sys.argv) > 1 else 'j1'
ACC = float(sys.argv[2]) if len(sys.argv) > 2 else 0.8
NW = int(sys.argv[3]) if len(sys.argv) > 3 else 1
OUT = f'/home/claude/tori-run/dev/out/{NAME}'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', '8841'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.6)
errs = []; random.seed(3)
BOT = open('/home/claude/tori-run/dev/' + (os.environ.get('BOT') or 'bot.js')).read()
shots = {'n': 0}
async def shot(pg, n): await pg.screenshot(path=f'{OUT}/{shots["n"]:02d}_{n}.png'); shots['n'] += 1
async def story_through(pg, tag, snap=True):
    k = 0
    while await pg.query_selector('.story'):
        if snap and k < 4: await pg.wait_for_timeout(300); await shot(pg, f'{tag}_{k}')
        await pg.click('.story [data-s="next"]'); await pg.wait_for_timeout(350); k += 1
        if k > 10: break
async def play(pg, tag, snap=False):
    t0 = time.time(); seen = set(); qn = 0
    while time.time() - t0 < 300:
        await pg.wait_for_timeout(90)
        if await pg.query_selector('.story'): await story_through(pg, tag + '_story', snap)
        if await pg.query_selector('.result'): break
        st = await pg.evaluate('Runner.active ? Runner.state : null')
        G = await pg.evaluate('(()=>{const g=Runner._G(); if(!g) return null; return {p:g.power&&g.power.k, pole:!!g.pole, gold:g.gold}})()')
        if snap and G:
            if G['p'] and ('pw' + G['p']) not in seen: seen.add('pw' + G['p']); await shot(pg, f'{tag}_power_{G["p"]}')
            if G['pole'] and 'pole' not in seen: seen.add('pole'); await pg.wait_for_timeout(250); await shot(pg, f'{tag}_pole')
        if snap and st == 'rescue' and 'res' not in seen: seen.add('res'); await pg.wait_for_timeout(900); await shot(pg, f'{tag}_rescue')
        if snap and st == 'bossWin' and 'bw' not in seen: seen.add('bw'); await pg.wait_for_timeout(500); await shot(pg, f'{tag}_bosswin')
        am = await pg.query_selector('[data-a="afterMiss"]')
        if am: await am.click(); await pg.wait_for_timeout(300); continue
        if await pg.query_selector('#qp:not(.hide)') and not await pg.evaluate('UI.G && UI.G.answered'):
            if snap and qn in (0, 3): await pg.wait_for_timeout(300); await shot(pg, f'{tag}_q{qn}')
            q = await pg.evaluate('({a:UI.G.qs[UI.G.qi].answer, c:UI.G.qs[UI.G.qi].choices})')
            if os.environ.get('THINK'): await pg.wait_for_timeout(random.randint(2000, 5000))
            if random.random() < ACC: await pg.click(f'.choice[data-i="{q["c"].index(q["a"])}"]')
            else:
                wr = [i for i, c in enumerate(q['c']) if c != q['a']]
                await pg.click(f'.choice[data-i="{wr[0]}"]'); await pg.wait_for_timeout(250)
                if await pg.query_selector('[data-a="afterMiss"]'): await pg.click('[data-a="afterMiss"]')
                elif random.random() < 0.4 and len(wr) > 1:
                    await pg.click(f'.choice[data-i="{wr[1]}"]'); await pg.wait_for_timeout(300); await pg.click('[data-a="afterMiss"]')
                else: await pg.click(f'.choice[data-i="{q["c"].index(q["a"])}"]')
            qn += 1; await pg.wait_for_timeout(500)
    return time.time() - t0
async def after_result(pg, tag, snap):
    await pg.wait_for_timeout(700)
    if snap: await shot(pg, f'{tag}_result')
    while await pg.query_selector('[data-a="openGift"]'):
        await pg.click('[data-a="openGift"]'); await pg.wait_for_timeout(300); await pg.click('#giftBox', force=True); await pg.wait_for_timeout(500)
        if snap: await shot(pg, f'{tag}_gift')
        await pg.click('[data-a="giftDone"]'); await pg.wait_for_timeout(200)
    await pg.click('[data-a="toMap"]'); await pg.wait_for_timeout(2200)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx = await b.new_context(viewport={'width': 1280, 'height': 800}, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append('con ' + m.text))
        await pg.goto('http://localhost:8841/index.html'); await pg.wait_for_timeout(900)
        await story_through(pg, 'intro')
        await pg.wait_for_timeout(500); await shot(pg, 'bonus')
        await pg.click('[data-a="takeBonus"]'); await pg.wait_for_timeout(400); await shot(pg, 'home')
        await pg.evaluate(f"window.__fast = {os.environ.get('FAST') or 3}"); await pg.evaluate(BOT)
        await pg.click('[data-to="map"]'); await pg.wait_for_timeout(800); await shot(pg, 'map')
        log = []
        for w in range(NW):
            for s in range(4):
                i = w * 4 + s
                await pg.evaluate(f"UI.ACT.node({{i:'{i}'}})"); await pg.wait_for_timeout(1500)
                if w == 0 and s < 2: await shot(pg, f'card{i}')
                await pg.click('[data-a="play"]'); await pg.wait_for_timeout(300)
                snap = (NW == 1 and w == 0) or s == 3 or (w == NW - 1 and s == 0)
                t = await play(pg, f'w{w}s{s}', snap)
                g = await pg.evaluate('UI.G && UI.G.gold')
                log.append((w, s, round(t), g))
                await after_result(pg, f'w{w}s{s}', snap)
            await shot(pg, f'map_after_w{w}')
        if os.environ.get('SHORT'):
            S = await pg.evaluate('Store.S'); [print('판', l) for l in log]; print('blocks', S.get('stat'), '봇', await pg.evaluate('__botLog.jumps')); print('오류', len(errs), errs[:5]); await b.close(); return
        await pg.evaluate("UI.go('home')"); await pg.wait_for_timeout(2500)
        while await pg.query_selector('.modalBg [data-a]'):
            await pg.evaluate('UI.ACT.closeModal()'); await pg.wait_for_timeout(300)
        await shot(pg, 'home_end')
        await pg.evaluate("UI.go('stamps')"); await pg.wait_for_timeout(500); await shot(pg, 'stamps')
        await pg.evaluate("UI.go('map')"); await pg.wait_for_timeout(800); await shot(pg, 'map_end')
        for env in ['night', 'sunset']:
            await pg.evaluate(f"window.__env={{phase:'{env}', season:'winter'}}; UI.ACT.play({{w:'1',s:'0'}})"); await pg.wait_for_timeout(1500)
            await pg.evaluate('UI.ACT.pause()'); await pg.evaluate('UI.ACT.closeModal()'); await shot(pg, f'env_{env}')
            await pg.evaluate('UI.ACT.quitGame()'); await pg.wait_for_timeout(300)
        await pg.evaluate("window.__env=null")
        S = await pg.evaluate('Store.S')
        for l in log: print('판', l)
        print('당근', S['carrots'], '별', S['stars'], '황금', S.get('gold'), '보스', S.get('boss'), '봇 점프', await pg.evaluate('__botLog.jumps'))
        print('오류', len(errs)); [print(' ', e) for e in errs[:10]]
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
