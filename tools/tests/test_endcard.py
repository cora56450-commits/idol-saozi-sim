import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/game/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate("localStorage.setItem('idolsao_global', JSON.stringify({tips:{desk:1,gal:1,phoneStory:1,choice:1}})); ['밤편지','사랑이 잘','Love wins all'].forEach(s=>Game.markEnding(s)); Game.newGame({name:'지은',nameZh:'智恩',role:'civ',sub:true}); UI.renderDesk(); UI.galleryModal()")
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='/home/claude/shots/gallery.png')
        print('errors', errs); await b.close()
asyncio.run(main())
