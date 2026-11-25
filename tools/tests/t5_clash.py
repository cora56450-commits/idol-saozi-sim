# 两个约撞时间：弹框二选一，推掉的人回一句
import asyncio, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fakeapi import reply
from playwright.async_api import async_playwright
async def run(keep_new):
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        async def h(route): await route.fulfill(status=200, content_type='application/json', body=reply(route.request.post_data))
        await pg.route('https://fake.api/**', h)
        await pg.goto('file:///home/claude/proj/game/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.setItem('idolsao_settings', JSON.stringify({provider:'openai',baseUrl:'https://fake.api/v1',apiKey:'k',model:'m'})); localStorage.setItem('idolsao_global', JSON.stringify({endings:{},tips:{gal:1,phoneStory:1,choice:1,home:1,chat:1,blink:1,pan:1,insta:1,desk:1}}))")
        await pg.evaluate("Game.newGame({role:'civ'}); Game.S.day=5; Game.S.seen.day3=true; UI.show('scr-desk'); UI.renderDesk(); Game.S.minutes=1260; Phone.isBusy=()=>false;")
        # 先和他约了后天 19:00
        await pg.evaluate("Game.addDate({day_offset:2,time:'19:00',place:'她家',what:'收工后过来'},5,'他')")
        await pg.evaluate("Phone.open('home'); Phone.go('chat','friend')")
        await pg.fill('#chat-in','好，周六见'); await pg.click('#chat-send'); await pg.wait_for_timeout(2500)
        txt = await pg.inner_text('#modal')
        await pg.click('#modal [data-x=%s]' % ('yes' if keep_new else 'no')); await pg.wait_for_timeout(2500)
        r = await pg.evaluate("JSON.stringify({dates:Game.S.dates.map(d=>[d.who,d.time,d.done,!!d.cancelled]), he:Game.S.chats.he.slice(-3).map(m=>m.sys||m.zh), fr:Game.S.chats.friend.slice(-3).map(m=>m.sys||m.zh), card:document.querySelector('#desk-stats')&&document.querySelector('#desk-stats').innerText})")
        print(txt.replace('\n',' | ')); print(r, errs)
        await pg.screenshot(path='/home/claude/shots/clash.png')
        await b.close()
asyncio.run(run(True)); asyncio.run(run(False))
