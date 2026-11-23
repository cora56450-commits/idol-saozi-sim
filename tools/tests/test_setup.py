import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/game/index.html'); await pg.wait_for_timeout(500)
        await pg.click('[data-act=new]'); await pg.wait_for_timeout(300)
        await pg.fill('#setup-name', ''); await pg.type('#setup-name', '李智恩'); await pg.wait_for_timeout(200)
        print('ko', await pg.input_value('#setup-name-ko'))
        await pg.screenshot(path='/home/claude/shots/setup.png')
        await pg.locator('#scr-setup button', has_text='开始').click(); await pg.wait_for_timeout(1500)
        for i in range(8):
            await pg.evaluate("() => { const t=document.querySelector('#tip'); if(t&&!t.classList.contains('hidden')) t.querySelector('button').click(); else Story.waiter && Story.advance(); }")
            await pg.wait_for_timeout(200)
        print(await pg.evaluate("JSON.stringify({n:Game.S.name, z:Game.S.nameZh, d: document.querySelector('#dlg-text').innerText})"))
        print('errors', errs); await b.close()
asyncio.run(main())
