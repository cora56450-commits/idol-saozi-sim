import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/game/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate("""() => { Game.newGame({name:'지은',role:'civ',sub:true}); }""")
        ok = await pg.evaluate("""() => { if(!Game.S) return 'nostate';
          Game.S.chats.he.push({ko:'자기야 뭐해',zh:'干嘛呢'});
          Game.S.chats.he.push({type:'voice',ko:'음… 누나 나 방금 끝났어 ㅋㅋ 배고파 죽겠다',zh:'嗯……姐姐我刚结束哈哈 饿死了',note:'0:07｜声音很困，说到一半打了个哈欠'});
          Game.S.chats.he.push({type:'voice',ko:'[음성 0:09]',zh:'[语音 0:09]',note:'小声哼了一遍高音'});
          UI.renderDesk(); Phone.open && Phone.open(); Phone.go('chat','he'); return 'ok'; }""")
        print(ok); await pg.wait_for_timeout(400); await pg.evaluate("document.querySelector('#tip button') && document.querySelector('#tip button').click()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots/voice.png')
        print('errors', errs); await b.close()
asyncio.run(main())
