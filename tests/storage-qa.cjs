// Regression coverage for pause-menu settings, storage fallback and interrupted swipes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const URL=process.env.ARCADE_URL||'http://127.0.0.1:8020/pocket-arcade/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL);
 await page.evaluate(()=>openGame('sudoku',true));
 await page.locator('#pauseBtn').tap();await page.locator('#soundToggle').tap();await page.locator('#exitBtn').tap();
 assert.equal(await page.locator('#globalSound').textContent(),'Sound on');
 assert.equal(await page.locator('#globalSound').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{localStorage.setItem('pa_preferences',JSON.stringify({sound:true,haptics:false,reducedMotion:false,customPreference:{preserve:'yes'}}));localStorage.setItem('unrelated_app_data','keep')});
 await page.reload();await page.locator('#globalSound').tap();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('pa_preferences')).customPreference),{preserve:'yes'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated_app_data')),'keep');
 await page.evaluate(()=>openGame('sudoku'));
 await page.keyboard.press('Escape');assert.equal(await page.locator('#pauseDialog').evaluate(d=>d.open),true);assert.equal(await page.evaluate(()=>paused),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#pauseDialog').evaluate(d=>d.open),false);assert.equal(await page.evaluate(()=>paused),false);
 // A gesture canceled while paused must not poison the next swipe's origin.
 await page.evaluate(()=>{openGame('2048',true);window.reviewDirections=[];const e=h('div');e.id='reviewSwipe';e.style.cssText='position:fixed;left:30px;top:150px;width:300px;height:300px;z-index:100;background:transparent';$('gameStage').append(e);bindSwipe(e,d=>window.reviewDirections.push(d))});
 const cdp=await context.newCDPSession(page);
 const touch=(type,x=80,y=200)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:['touchEnd','touchCancel'].includes(type)?[]:[{x,y}]});
 await touch('touchStart');await page.evaluate(()=>pauseGame());await touch('touchCancel');await page.evaluate(()=>resumeGame());
 await touch('touchStart',250,200);await touch('touchMove',80,200);await touch('touchEnd');
 assert.deepEqual(await page.evaluate(()=>window.reviewDirections),['left']);await cdp.detach();
 // Denied localStorage still keeps sessions and scores within the open document.
 const denied=await context.newPage();denied.on('pageerror',e=>errors.push(e.message));
 await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('storage denied','SecurityError')};Storage.prototype.removeItem=function(){throw new DOMException('storage denied','SecurityError')}});
 await denied.goto(URL);await denied.evaluate(()=>{openGame('sudoku',true);storeSet('pa_best_sudoku',9)});
 await denied.locator('.sudoku-board button').nth(2).tap();await denied.locator('.number-pad button').nth(3).tap();
 assert.equal(await denied.locator('.sudoku-board button').nth(2).textContent(),'4');
 await denied.locator('#backBtn').tap();await denied.evaluate(()=>openGame('sudoku'));
 assert.equal(await denied.locator('.sudoku-board button').nth(2).textContent(),'4');
 await denied.evaluate(()=>restartGame());
 assert.equal(await denied.locator('.sudoku-board button').nth(2).textContent(),'');
 assert.equal(await denied.evaluate(()=>best('sudoku')),9);
 assert.deepEqual(errors,[]);
 console.log('PASS pause sound label/ARIA sync, unknown preferences and unrelated storage preserved, Escape pause/resume, interrupted touchscreen swipe recovery, denied-storage session fallback and targeted restart without score loss.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
