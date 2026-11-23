import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/game/index.html'); await pg.wait_for_timeout(300)
        async def run_day(d, role='civ', setup=''):
            await pg.evaluate(f"Game.newGame({{role:'{role}'}}); {setup}; Game.S.day={d}; void Main.startDay()")
            await pg.wait_for_timeout(2200)
            for i in range(400):
                if await pg.locator('#sp-title').count():
                    await pg.fill('#sp-title','这不就是大创的贴纸吗'); await pg.fill('#sp-body','我也买过同款西兰花贴纸，大创两千韩元一张，别瞎猜了，大家去刷新歌吧，下周还要打榜。'); await pg.click('.story-choices .free button')
                if await pg.locator('.story-choices .opt').count(): await pg.click('.story-choices .opt >> nth=0')
                elif await pg.locator('.story-choices textarea').count(): await pg.fill('.story-choices textarea','嗯'); await pg.click('.story-choices .free button')
                if await pg.locator('#choices .btn-choice').count(): await pg.click('#choices .btn-choice >> nth=0')
                elif await pg.locator('#choices textarea').count(): await pg.fill('#choices textarea','嗯'); await pg.click('#choices .send')
                if await pg.locator('#end-ok').count(): break
                if await pg.locator('#scr-desk.on').count() and await pg.locator('#phone.hidden').count() and not await pg.evaluate("!!Story.ev"): break
                if await pg.locator('#transition:not(.hidden)').count(): await pg.click('#transition'); continue
                if await pg.locator('#story-tap').count() and not await pg.locator('#phone.hidden').count(): await pg.click('#story-tap', force=True)
                elif await pg.locator('#scr-scene.on').count(): await pg.click('#dialog', force=True)
                await pg.wait_for_timeout(25)
            print(d, role, await pg.evaluate("JSON.stringify({aff:Game.S.aff,exp:Game.S.exp,amb:Game.S.amb,flags:Game.S.flags,outcome:Game.S.outcome,ending:Game.S.ending,seen:Object.keys(Game.S.seen)})"))
        await run_day(33)
        await run_day(40)
        await run_day(72, 'civ', 'Game.S.aff=20')
        await run_day(78, 'staff', 'Game.S.flags.knot1=true')
        await run_day(84, 'civ', 'Game.S.amb=40')
        await run_day(90, 'civ', 'Game.S.aff=80;Game.S.flags.knot1=true;Game.S.flags.knot2=true')
        await pg.screenshot(path='/home/claude/shots/t2_end.png')
        print('errors', errs[:5]); await b.close()
asyncio.run(main())
