import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv = subprocess.Popen(['python3','-m','http.server','8813'], cwd='/home/claude/tori-run', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(.5)
JS = open(sys.argv[1]).read()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':1280,'height':800})
        pg.on('pageerror', lambda e: print('ERR', e))
        pg.on('console', lambda m: print('CON', m.type, m.text))
        await pg.goto('http://localhost:8813/index.html'); await pg.wait_for_timeout(800)
        r = await pg.evaluate(JS)
        print(r)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='/home/claude/tori-run/dev/out/dbg.png')
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
