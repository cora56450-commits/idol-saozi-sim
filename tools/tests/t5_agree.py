# 书娟主动约周六，玩家只回「好啊」，AI 没标约好 → 兜底识别出来，排进日程
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
        await pg.evaluate("""Game.newGame({role:'civ'}); Game.S.day=5; Game.S.seen.day3=true; UI.show('scr-desk'); UI.renderDesk(); Game.S.minutes=1260; Phone.isBusy=()=>false;
          Game.S.chats.friend.push({day:5,t:1250,speaker:'郑书娟',ko:'토요일 저녁 어때 홍대에서 고기 먹자',zh:'周六晚上怎么样 弘大那边吃肉'});
          Phone.open('home'); Phone.go('chat','friend')""")
        await pg.fill('#chat-in','好啊'); await pg.click('#chat-send'); await pg.wait_for_timeout(2500)
        print(await pg.evaluate("JSON.stringify({dates:Game.S.dates, sys:Game.S.chats.friend.filter(m=>m.sys).map(m=>m.sys)})"), errs)
        await pg.screenshot(path='/home/claude/shots/agree.png', clip={'x':520,'y':0,'width':560,'height':900})
        await b.close()
asyncio.run(main())
