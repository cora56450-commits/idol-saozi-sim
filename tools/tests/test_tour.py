import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/game/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate("localStorage.clear(); Game.newGame({name:'지은',nameZh:'智恩',role:'civ',sub:true}); UI.renderDesk()")
        for i in range(6):
            await pg.wait_for_timeout(350)
            await pg.screenshot(path=f'/home/claude/shots/tour{i}.png')
            await pg.click('.tour button')
        print('tour left:', await pg.evaluate("document.querySelectorAll('.tour').length"), 'errors', errs)
        await b.close()
asyncio.run(main())
