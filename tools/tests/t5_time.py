# 聊天里的时间标记和「以下是新消息」
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
        await pg.evaluate("Game.newGame({role:'civ'}); Game.S.day=5; Game.S.seen.day3=true; void Main.startDay()"); await pg.wait_for_timeout(2000)
        await pg.evaluate("Phone.open('home'); Phone.go('chat','he')")
        await pg.fill('#chat-in','在干嘛'); await pg.click('#chat-send'); await pg.wait_for_timeout(2500)
        await pg.evaluate("Phone.close(); Game.S.dates=[]; UI.deskStats()")
        # 往后过两次，攒一些新消息
        for k in range(2):
            await pg.evaluate("Math.random=()=>0.1; Main.skipTime()"); await pg.wait_for_timeout(300)
            if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition')
            await pg.wait_for_timeout(2500)
        print('unread he', await pg.evaluate("Game.S.unread.he"), [m for m in await pg.evaluate("Game.S.chats.he.map(m=>m.t)")])
        await pg.evaluate("Phone.open('home'); Phone.go('chat','he')"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SH+'tm_chat.png', clip={'x':520,'y':0,'width':560,'height':900})
        print(errs); await b.close()
asyncio.run(main())
