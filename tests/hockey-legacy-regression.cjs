// Exact V2 makeHockey update/contact ordering, isolated without browser drawing.
const assert=require('node:assert/strict');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function legacy(){const puck={x:24,y:22,vx:-100,vy:-145},player={x:175,y:398},bot={x:38,y:48};let goals=0;
function hit(p){const dx=puck.x-p.x,dy=puck.y-p.y,d=Math.hypot(dx,dy);if(d>0&&d<35){const nx=dx/d,ny=dy/d,closing=puck.vx*nx+puck.vy*ny;puck.x=p.x+nx*35.2;puck.y=p.y+ny*35.2;if(closing<0||Math.hypot(puck.vx,puck.vy)<80){const speed=clamp(Math.hypot(puck.vx,puck.vy)*1.08,195,470);puck.vx=nx*speed;puck.vy=ny*speed;}}}
const samples=[];for(let i=0;i<2400;i++){const dt=1/240;const targetX=puck.vy<0?puck.x:175;bot.x=clamp(bot.x+clamp(targetX-bot.x,-dt*160,dt*160),38,312);bot.y=clamp(bot.y+clamp(Math.min(135,puck.y-85)-bot.y,-dt*85,dt*85),48,150);puck.x+=puck.vx*dt;puck.y+=puck.vy*dt;puck.vx*=Math.pow(.999,dt*60);puck.vy*=Math.pow(.999,dt*60);if(puck.x<24||puck.x>326){puck.x=clamp(puck.x,24,326);puck.vx*=-.97;}if(puck.y<22){if(puck.x>117&&puck.x<233)goals++;else{puck.y=22;puck.vy=Math.abs(puck.vy);}}if(puck.y>448){if(puck.x>117&&puck.x<233)goals++;else{puck.y=448;puck.vy=-Math.abs(puck.vy);}}hit(player);hit(bot);if(i%240===0)samples.push({second:i/240,x:+puck.x.toFixed(3),y:+puck.y.toFixed(3),speed:+Math.hypot(puck.vx,puck.vy).toFixed(2)});}
return{puck,goals,samples};}
const result=legacy();console.log(JSON.stringify(result,null,2));
// This invariant MUST fail on the preserved V2 algorithm: velocity alone does not prove movement.
const invariant=()=>assert.ok(Math.hypot(result.puck.x-24,result.puck.y-22)>40,'V2 upper-left puck must escape the corner instead of repeated wall/paddle penetration');
if(process.argv.includes('--assert-fixed'))invariant();else{assert.throws(invariant,/must escape/);console.log('PASS preserved V2 regression fixture reproduces original jam.');}
