import asyncio, json, sys
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fakeapi import reply
from playwright.async_api import async_playwright
SH='/home/claude/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        calls=[]
        async def handle(route):
            body=route.request.post_data; c=json.loads(body)['messages'][0]['content']; calls.append(next((k for k in ['现在是一次线下见面','把下面每一句中文','你要生成游戏里第','现在你扮演私下的徐允在','饭力工坊工作群（白秀珍'] if k in c),'other'))
            await route.fulfill(status=200, content_type='application/json', body=reply(body))
        await pg.route('https://fake.api/**', handle)
        await pg.goto('file:///home/claude/proj/game/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.setItem('idolsao_settings', JSON.stringify({provider:'openai',baseUrl:'https://fake.api/v1',apiKey:'k',model:'m'})); localStorage.setItem('idolsao_global', JSON.stringify({endings:{},tips:{gal:1,phoneStory:1,choice:1,home:1,chat:1,blink:1,pan:1,insta:1,desk:1}}))")
        await pg.evaluate("Game.newGame({role:'civ', name:'지은', nameZh:'智恩', sub:true}); Game.S.day=5; Game.S.seen.day3=true; void Main.startDay()")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=SH+'d_desk0.png')
        # 往后过两次
        for k in range(2):
            await pg.click('#ds-next'); await pg.wait_for_timeout(400)
            if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition')
            await pg.wait_for_timeout(600)
        print('time', await pg.evaluate("UI.clock()+' '+Game.workStatus()"))
        await pg.screenshot(path=SH+'d_desk1.png')
        # 和他聊天 → 约 21:00
        await pg.evaluate("Phone.open('home'); Phone.go('chat','he')")
        await pg.fill('#chat-in','今晚来我家吗'); await pg.click('#chat-send'); await pg.wait_for_timeout(3500)
        await pg.screenshot(path=SH+'d_chat.png', clip={'x':520,'y':0,'width':560,'height':900})
        await pg.evaluate("Phone.go('toktok')"); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SH+'d_list.png', clip={'x':520,'y':0,'width':560,'height':900})
        await pg.evaluate("Phone.go('pan')"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SH+'d_pan.png', clip={'x':520,'y':0,'width':560,'height':900})
        await pg.evaluate("Phone.go('insta')"); await pg.wait_for_timeout(300)
        await pg.click('.ig-like >> nth=0'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=SH+'d_insta.png', clip={'x':520,'y':0,'width':560,'height':900})
        await pg.evaluate("Phone.close()"); await pg.wait_for_timeout(300)
        print('dates', await pg.evaluate("JSON.stringify(Game.S.dates)"))
        await pg.screenshot(path=SH+'d_desk2.png')
        # 往后过直到见面
        for k in range(6):
            if await pg.evaluate("!!Story.ev"): break
            if await pg.locator('#ds-next').count(): await pg.click('#ds-next')
            await pg.wait_for_timeout(300)
            if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition')
            await pg.wait_for_timeout(700)
        rounds=0
        for i in range(200):
            if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition'); continue
            if await pg.locator('#choices textarea').count():
                if rounds==0: await pg.screenshot(path=SH+'d_input.png')
                if rounds<2: await pg.fill('#choices textarea','今天累不累'); await pg.click('#choices .send'); rounds+=1
                else: await pg.click('.date-leave'); rounds+=1
                await pg.wait_for_timeout(300); continue
            if await pg.locator('#scr-desk.on').count() and not await pg.evaluate("!!Story.ev"): break
            if await pg.locator('#scr-scene.on').count():
                if i==3: await pg.screenshot(path=SH+'d_scene.png')
                await pg.click('#dialog', force=True)
            await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=SH+'d_desk3.png')
        print(await pg.evaluate("JSON.stringify({t:UI.clock(),aff:Game.S.aff,exp:Game.S.exp,dates:Game.S.dates,recent:Game.S.recent.slice(-3),shop:Game.S.chats.shop.length})"))
        import collections; print('calls', collections.Counter(calls), calls[:30])
        print('errors', errs[:8]); await b.close()
asyncio.run(main())
