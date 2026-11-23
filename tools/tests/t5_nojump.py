# 给 A 发消息，回复到之前切去看 B：不能被拉回 A，A 亮未读；等回复时也能在 B 发消息
import asyncio, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fakeapi import reply
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        async def h(route):
            await asyncio.sleep(1.5)  # 慢一点的 API
            await route.fulfill(status=200, content_type='application/json', body=reply(route.request.post_data))
        await pg.route('https://fake.api/**', h)
        await pg.goto('file:///home/claude/proj/game/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.setItem('idolsao_settings', JSON.stringify({provider:'openai',baseUrl:'https://fake.api/v1',apiKey:'k',model:'m'})); localStorage.setItem('idolsao_global', JSON.stringify({endings:{},tips:{gal:1,phoneStory:1,choice:1,home:1,chat:1,blink:1,pan:1,insta:1,desk:1}}))")
        await pg.evaluate("Game.newGame({role:'civ'}); Game.S.day=5; Game.S.seen.day3=true; UI.show('scr-desk'); UI.renderDesk(); Game.S.minutes=1400; Phone.open('home'); Phone.go('chat','friend')")
        await pg.fill('#chat-in','周六见'); await pg.click('#chat-send'); await pg.wait_for_timeout(200)
        await pg.evaluate("Phone.go('toktok'); Phone.go('chat','shop')")
        await pg.fill('#chat-in','今天订单多吗'); await pg.click('#chat-send'); await pg.wait_for_timeout(300)
        await pg.fill('#chat-in','草稿还在吗')
        await pg.wait_for_timeout(5000)
        r=await pg.evaluate("JSON.stringify({view:Phone.view, arg:Phone.arg, unread:Game.S.unread, friendReplies:Game.S.chats.friend.filter(m=>!m.me&&!m.sys).length, shopReplies:Game.S.chats.shop.filter(m=>!m.me).length, draft:document.querySelector('#chat-in').value})")
        print(r, errs)
        await pg.screenshot(path='/home/claude/shots/nojump.png', clip={'x':520,'y':0,'width':560,'height':900})
        await b.close()
asyncio.run(main())
