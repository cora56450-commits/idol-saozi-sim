# 和书娟约周六 → 到那天去赴约
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fakeapi import reply
from playwright.async_api import async_playwright
SH='/home/claude/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        async def h(route): await route.fulfill(status=200, content_type='application/json', body=reply(route.request.post_data))
        await pg.route('https://fake.api/**', h)
        await pg.goto('file:///home/claude/proj/game/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.setItem('idolsao_settings', JSON.stringify({provider:'openai',baseUrl:'https://fake.api/v1',apiKey:'k',model:'m'})); localStorage.setItem('idolsao_global', JSON.stringify({endings:{},tips:{gal:1,phoneStory:1,choice:1,home:1,chat:1,blink:1,pan:1,insta:1,desk:1}}))")
        await pg.evaluate("Game.newGame({role:'civ'}); Game.S.day=5; Game.S.seen.day3=true; UI.show('scr-desk'); UI.renderDesk(); Game.S.minutes=1260; Phone.isBusy=()=>false;")
        await pg.evaluate("Phone.open('home'); Phone.go('chat','friend')")
        await pg.fill('#chat-in','好，周六见'); await pg.click('#chat-send'); await pg.wait_for_timeout(2500)
        if await pg.locator('#modal:not(.hidden) [data-x=yes]').count(): await pg.click('#modal [data-x=yes]')
        await pg.evaluate("Phone.close()")
        print('dates', await pg.evaluate("JSON.stringify(Game.S.dates)"))
        await pg.evaluate("Game.S.day=7; Game.S.seen.day7=true; void Main.startDay()"); await pg.wait_for_timeout(1500)
        await pg.evaluate("Game.S.minutes=1140; UI.deskStats()")
        await pg.screenshot(path=SH+'n_card.png', clip={'x':600,'y':300,'width':400,'height':240})
        await pg.click('#ds-next'); await pg.wait_for_timeout(400)
        shot=False
        for i in range(150):
            if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition'); continue
            if await pg.locator('#choices textarea').count():
                if not shot: await pg.screenshot(path=SH+'n_input.png'); shot=True
                await pg.click('.date-leave'); await pg.wait_for_timeout(200); continue
            if await pg.locator('#scr-desk.on').count() and not await pg.evaluate("!!Story.ev"): break
            if await pg.locator('#scr-scene.on').count():
                if i==2: await pg.screenshot(path=SH+'n_scene.png')
                await pg.click('#dialog', force=True)
            await pg.wait_for_timeout(60)
        print(await pg.evaluate("JSON.stringify({dates:Game.S.dates, recent:Game.S.recent.slice(-2), aff:Game.S.aff})"), errs)
        await b.close()
asyncio.run(main())
