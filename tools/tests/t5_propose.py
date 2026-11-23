# 书娟主动发来「明天12点弘大站2号出口见」→ 弹框问要不要记进日程 → 记下
import asyncio, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fakeapi import reply
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        async def h(route): await route.fulfill(status=200, content_type='application/json', body=reply(route.request.post_data))
        await pg.route('https://fake.api/**', h)
        await pg.goto('file:///home/claude/proj/game/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.setItem('idolsao_settings', JSON.stringify({provider:'openai',baseUrl:'https://fake.api/v1',apiKey:'k',model:'m'})); localStorage.setItem('idolsao_global', JSON.stringify({endings:{},tips:{gal:1,phoneStory:1,choice:1,home:1,chat:1,blink:1,pan:1,insta:1,desk:1}}))")
        await pg.evaluate("Game.newGame({role:'civ'}); Game.S.day=5; UI.show('scr-desk'); UI.renderDesk(); Game.S.minutes=1260; Main.ping('friend','约这周末出去', 5)")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path='/home/claude/shots/propose.png')
        print('modal:', await pg.locator('#modal-inner').inner_text())
        await pg.click('[data-x=yes]'); await pg.wait_for_timeout(300); await pg.evaluate('Phone.close()'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots/propose_card.png', clip={'x':600,'y':300,'width':400,'height':260}); print(await pg.evaluate("JSON.stringify({dates:Game.S.dates, card:document.querySelector('#desk-stats').innerText})"), errs)
        await b.close()
asyncio.run(main())
