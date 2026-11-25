import asyncio, json, sys
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fakeapi import reply
from playwright.async_api import async_playwright
DAY=int(sys.argv[1]); SH='/home/claude/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type=='error' and errs.append('console:'+m.text))
        async def handle(route):
            await asyncio.sleep(0.05)
            await route.fulfill(status=200, content_type='application/json', body=reply(route.request.post_data))
        await pg.route('https://fake.api/**', handle)
        await pg.goto('file:///home/claude/proj/game/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.setItem('idolsao_settings', JSON.stringify({provider:'openai',baseUrl:'https://fake.api/v1',apiKey:'k',model:'m'})); localStorage.setItem('idolsao_global', JSON.stringify({endings:{},tips:{gal:1,phoneStory:1,choice:1,home:1,chat:1,blink:1,pan:1,insta:1,desk:1}}))")
        await pg.evaluate("Game.newGame({role:'civ', name:'지은', nameZh:'智恩', sub:true}); Game.S.day="+str(DAY)+"; void Main.startDay()")
        await pg.wait_for_timeout(1500)
        shots=set()
        for i in range(300):
            if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition'); await pg.wait_for_timeout(50); continue
            app = await pg.evaluate("Phone.storyApp")
            if app and not await pg.locator('#phone.hidden').count():
                await pg.screenshot(path=SH+f'q{DAY}_{app}.png', clip={'x':520,'y':0,'width':560,'height':900})
            if await pg.locator('.story-choices .opt').count():
                await pg.screenshot(path=SH+'p_choice.png')
                await pg.click(".story-choices .opt >> nth=0"); await pg.wait_for_timeout(100)
                await pg.screenshot(path=SH+'p_after_choice.png'); continue
            if await pg.locator('.story-choices textarea').count():
                await pg.fill('.story-choices textarea','可以吃沙拉夜宵哦'); await pg.click('.story-choices .free button'); await pg.wait_for_timeout(300); continue
            if await pg.locator('#scr-desk.on').count() and not await pg.evaluate("!!Story.ev"): break
            if await pg.locator('#story-tap').count() and not await pg.locator('#phone.hidden').count(): await pg.click('#story-tap', force=True)
            elif await pg.locator("#scr-scene.on").count() and await pg.locator("#dialog:not(.hidden)").count(): await pg.click("#dialog", force=True)
            await pg.wait_for_timeout(30)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=SH+'p_desk.png')
        print(await pg.evaluate("JSON.stringify({g:Game.S.chats.group.map(m=>(m.speaker||'me')+':'+(m.zh||'')).slice(-6), he:Game.S.chats.he.map(m=>(m.speaker||'me')+':'+(m.zh||'')).slice(-6)})"))
        # 打开 BLINK / 论坛 看看合进去了没有
        await pg.evaluate("Phone.open('blink')"); await pg.wait_for_timeout(300); await pg.screenshot(path=SH+'p_blinkapp.png')
        await pg.evaluate("Phone.go('pan')"); await pg.wait_for_timeout(1500); await pg.evaluate("Phone.go('pan')"); await pg.screenshot(path=SH+'p_panapp.png')
        await pg.evaluate("Phone.go('toktok')"); await pg.wait_for_timeout(200); await pg.screenshot(path=SH+'p_toktok.png')
        print('errors', errs[:8]); await b.close()
asyncio.run(main())
