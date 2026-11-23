# 他在忙：消息挂着显示「1」，往后过以后才回；他今天的状态
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fakeapi import reply
from playwright.async_api import async_playwright
SH='/home/claude/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        seen=[]
        async def h(route):
            body=route.request.post_data
            if '才看到手机' in body: seen.append('late-reply')
            if '他现在的状态' in body: seen.append('mood')
            await route.fulfill(status=200, content_type='application/json', body=reply(body))
        await pg.route('https://fake.api/**', h)
        await pg.goto('file:///home/claude/proj/game/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.setItem('idolsao_settings', JSON.stringify({provider:'openai',baseUrl:'https://fake.api/v1',apiKey:'k',model:'m'})); localStorage.setItem('idolsao_global', JSON.stringify({endings:{},tips:{gal:1,phoneStory:1,choice:1,home:1,chat:1,blink:1,pan:1,insta:1,desk:1}}))")
        await pg.evaluate("Game.newGame({role:'civ'}); Game.S.day=5; Game.S.seen.day3=true; void Main.startDay()"); await pg.wait_for_timeout(2000)
        await pg.evaluate("Game.S.minutes=660; Phone.lastReply={}; Phone.open('home'); Phone.go('chat','he'); window._r=Math.random; Math.random=()=>0.1")
        await pg.fill('#chat-in','在干嘛'); await pg.click('#chat-send'); await pg.wait_for_timeout(800)
        await pg.fill('#chat-in','今天累不累'); await pg.click('#chat-send'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=SH+'b_pending.png', clip={'x':520,'y':0,'width':560,'height':900})
        print('pending', await pg.evaluate("JSON.stringify(Game.S.pendingReply)"), 'mood', await pg.evaluate("Game.heMood().text"))
        await pg.evaluate("Math.random=window._r; Phone.close(); Game.S.dates=[]; Main.skipTime()"); await pg.wait_for_timeout(300)
        if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition')
        await pg.wait_for_timeout(3000)
        await pg.evaluate("Phone.open('home'); Phone.go('chat','he')"); await pg.wait_for_timeout(400)
        await pg.screenshot(path=SH+'b_after.png', clip={'x':520,'y':0,'width':560,'height':900})
        print('after', await pg.evaluate("JSON.stringify({p:Game.S.pendingReply, he:Game.S.chats.he.map(m=>[m.me?'me':'他', m.t, m.unread||false])})"), seen, errs)
        await b.close()
asyncio.run(main())
