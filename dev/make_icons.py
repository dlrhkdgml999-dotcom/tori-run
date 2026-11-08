import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':512,'height':512})
        await pg.goto('file:///home/claude/tori-run/index.html')
        await pg.wait_for_timeout(300)
        svg = await pg.evaluate('ART.iconSVG()')
        msvg = await pg.evaluate("ART.iconSVG().replace('translate(96 40) scale(1.6)','translate(146 110) scale(1.2)')")
        for name, s, size in [('icon-512', svg, 512), ('icon-192', svg, 192), ('icon-maskable-512', msvg, 512)]:
            await pg.set_viewport_size({'width':size,'height':size})
            await pg.set_content(f'<html><body style="margin:0">{s.replace("<svg ", f"<svg width={size} height={size} ",1)}</body></html>')
            await pg.wait_for_timeout(150)
            await pg.screenshot(path=f'/home/claude/tori-run/icons/{name}.png')
        await b.close()
asyncio.run(main())
