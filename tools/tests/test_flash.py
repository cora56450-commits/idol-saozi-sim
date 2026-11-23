import asyncio, sys
from playwright.async_api import async_playwright
JS_DRIVE = """async (maxMs) => {
 const out=[]; const t0=Date.now(); let idle=0; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const vis=e=>e&&!e.classList.contains('hidden')&&e.offsetParent!==null;
 while(Date.now()-t0<maxMs){
  const tip=document.querySelector('#tip'); if(vis(tip)){tip.querySelector('button').click();await sleep(50);continue;}
  const cv=document.querySelector('#cg-view'); if(vis(cv)){out.push('[CGVIEW]');cv.click();await sleep(50);continue;}
  const ta=document.querySelector('.story-choices textarea, #choices textarea');
  if(document.querySelector('.story-choices .opt')){document.querySelector('.story-choices .opt').click();await sleep(80);continue;}
  if(document.querySelector('#choices .btn-choice')){document.querySelector('#choices .btn-choice').click();await sleep(80);continue;}
  if(ta){ta.value='好';(ta.parentElement.querySelector('button')).click();await sleep(80);continue;}
  if(Story.waiter){ const scr=[...document.querySelectorAll('.screen.on')].map(e=>e.id).join();
    const ph=vis(document.querySelector('#phone'));
    const d=document.querySelector('#dlg-text'); 
    if(scr.includes('scene')&&!ph) out.push('[GAL] '+(d?d.innerText:'').slice(0,40)+' cg='+document.querySelector('#scene-cg').classList.contains('on')+' bg='+(document.querySelector('#scene-bg').style.backgroundImage.split('/').pop()));
    Story.advance(); await sleep(60); idle=0; continue;}
  if(++idle>20)break; await sleep(100);
 }
 return out.join('\\n')+'\\nend scr='+[...document.querySelectorAll('.screen.on')].map(e=>e.id)+' ev='+(Story.ev&&Story.ev.id)+' phoneHidden='+document.querySelector('#phone').classList.contains('hidden');
}"""
async def main(role):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1600,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/game/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.click('[data-act=new]')
        await pg.click(f'[data-role={role}]') if await pg.locator(f'[data-role={role}]').count() else None
        await pg.locator('#scr-setup button', has_text='开始').click()
        print(await pg.evaluate(JS_DRIVE, 25000))
        await pg.screenshot(path=f'/home/claude/shots/flash_{role}.png')
        print('errors', errs)
        await b.close()
asyncio.run(main(sys.argv[1]))
