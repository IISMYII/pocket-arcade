// A scene always paints the entire canvas. Its playable world keeps square pixels
// while the ambient surround extends to the viewport; wide tables rotate naturally.
function sportsLayer(w,h,paint){const layer=document.createElement('canvas');layer.width=w*2;layer.height=h*2;const context=layer.getContext('2d',{alpha:false});context.scale(2,2);paint(context);return layer;}
function sportsFrame(c,ctx,w,h,rotate=true,color='#08171b'){
 let ambient=null;
 function geometry(){const turned=rotate&&c.clientWidth>c.clientHeight*1.15,sw=turned?h:w,sh=turned?w:h,s=Math.min(c.width/sw,c.height/sh);return{turned,s,ox:(c.width-sw*s)/2,oy:(c.height-sh*s)/2};}
 function backdrop(){if(ambient&&ambient.width===c.width&&ambient.height===c.height)return ambient;ambient=document.createElement('canvas');ambient.width=c.width;ambient.height=c.height;const b=ambient.getContext('2d',{alpha:false});b.fillStyle=color;b.fillRect(0,0,c.width,c.height);const glow=b.createRadialGradient(c.width*.5,c.height*.5,1,c.width*.5,c.height*.5,Math.max(c.width,c.height)*.7);glow.addColorStop(0,'#52716955');glow.addColorStop(1,'#020b0d00');b.fillStyle=glow;b.fillRect(0,0,c.width,c.height);b.strokeStyle='#afdfd00a';b.lineWidth=Math.max(1,c.width/800);const step=Math.max(20,c.width/18);for(let x=-c.height;x<c.width;x+=step){b.beginPath();b.moveTo(x,0);b.lineTo(x+c.height,c.height);b.stroke();}return ambient;}
 return{
  begin(){const g=geometry();ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(backdrop(),0,0);if(g.turned)ctx.setTransform(0,g.s,-g.s,0,g.ox+h*g.s,g.oy);else ctx.setTransform(g.s,0,0,g.s,g.ox,g.oy);},
  end(){ctx.restore();},turned(){return geometry().turned;},
  point(e){const g=geometry(),r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width-g.ox,y=(e.clientY-r.top)*c.height/r.height-g.oy;return g.turned?{x:y/g.s,y:h-x/g.s}:{x:x/g.s,y:y/g.s};}
 };
}
// Pocket Pool — original vector table, ball lighting and touch aiming.
function makePool(){
 const [c,ctx]=canvas(350,440),scene=sportsFrame(c,ctx,350,440,true,'#10201e'),palette=['#f5bf48','#5599e5','#ea6374','#ab7bd6','#6bc5a1','#ef9c55'];
 let balls=[],score=0,shots=0,aim=null,pointer=null,won=false,particles=[],time=0,saveClock=0;
 const pockets=[[35,35],[175,26],[315,35],[35,405],[175,414],[315,405]];
 function rack(){balls=[{x:175,y:326,vx:0,vy:0,white:true,n:0,col:'#fff'}];let n=0;for(let row=0;row<3;row++)for(let col=0;col<=row;col++)balls.push({x:175+(col-row/2)*24,y:142+row*22,vx:0,vy:0,white:false,n:n+1,col:palette[n++%6]});}
 rack();const saved=sessionRead('pool');if(saved&&Array.isArray(saved.balls)&&saved.balls.length>0&&saved.balls.length<=7&&saved.balls.every(b=>b&&[b.x,b.y,b.vx,b.vy].every(Number.isFinite)&&b.x>=15&&b.x<=335&&b.y>=10&&b.y<=430&&Math.abs(b.vx)<1000&&Math.abs(b.vy)<1000&&typeof b.white==='boolean'&&Number.isInteger(b.n)&&b.n>=0&&b.n<=6)&&saved.balls.filter(b=>b.white).length===1&&Number.isInteger(saved.score)&&saved.score>=0&&saved.score<=6&&Number.isInteger(saved.shots)&&saved.shots>=0){balls=saved.balls.map(b=>({...b,col:b.white?'#fff':palette[(b.n-1)%6]}));score=saved.score;shots=saved.shots;won=score===6;}
 function save(){sessionWrite('pool',{balls:balls.map(({x,y,vx,vy,white,n})=>({x,y,vx,vy,white,n})),score,shots});}
 const quiet=()=>balls.every(b=>Math.hypot(b.vx,b.vy)<6);
 function stats(){hud([['POTTED',score+'/6'],['SHOTS',shots],['BEST',best('pool')]]);}stats();
 function at(e){return scene.point(e);}
 listen(c,'pointerdown',e=>{if(won||pointer!==null||!quiet())return;const p=at(e),cue=balls.find(b=>b.white);if(Math.hypot(p.x-cue.x,p.y-cue.y)>34){message('Touch the white ball, pull back, then release.');return;}e.preventDefault();pointer=e.pointerId;c.setPointerCapture(pointer);aim={start:p,end:p};feedback('tap');});
 listen(c,'pointermove',e=>{if(e.pointerId===pointer&&aim)aim.end=at(e);});
 function cancel(){aim=null;pointer=null;}
 listen(c,'pointerup',e=>{if(e.pointerId!==pointer||!aim)return;const cue=balls.find(b=>b.white),dx=aim.start.x-aim.end.x,dy=aim.start.y-aim.end.y,power=Math.min(500,Math.hypot(dx,dy)*5),angle=Math.atan2(dy,dx);if(power>30){cue.vx=Math.cos(angle)*power;cue.vy=Math.sin(angle)*power;shots++;stats();feedback('tap');message('Shot '+shots+' · watch the angles.');save();}cancel();});listen(c,'pointercancel',cancel);
 message('Touch the white ball and pull back to line up your shot.');if(won)queueMicrotask(()=>{if(activeGame==='pool')finishGame('Table cleared','Six balls pocketed in '+shots+' shots.')});
 function flash(x,y,color){for(let n=0;n<9;n++){const a=n*Math.PI*2/9;particles.push({x,y,vx:Math.cos(a)*35,vy:Math.sin(a)*35,life:.7,col:color});}}
 const tableLayer=sportsLayer(350,440,ctx=>{
  ctx.fillStyle='#090e13';ctx.fillRect(0,0,350,440);
  const wood=ctx.createLinearGradient(0,0,350,440);wood.addColorStop(0,'#82593d');wood.addColorStop(.3,'#2d211c');wood.addColorStop(.65,'#715038');wood.addColorStop(1,'#241a16');rounded(ctx,6,5,338,430,23,wood);
  ctx.strokeStyle='#d8aa6555';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.roundRect(9+i*3,8+i*3,332-i*6,424-i*6,20-i*2);ctx.stroke();}
  rounded(ctx,23,20,304,400,16,'#153b34');const felt=ctx.createRadialGradient(150,170,15,175,220,270);felt.addColorStop(0,'#287e6b');felt.addColorStop(.8,'#115545');felt.addColorStop(1,'#0b382f');rounded(ctx,29,26,292,388,10,felt);
  ctx.fillStyle='#70ba9b15';for(let y=32;y<411;y+=5)for(let x=33;x<319;x+=6)ctx.fillRect(x,y,1,.6);
  ctx.strokeStyle='#a0dac22b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(32,302);ctx.lineTo(318,302);ctx.stroke();ctx.beginPath();ctx.arc(175,302,48,0,Math.PI);ctx.stroke();
  for(const [x,y]of pockets){circle(ctx,x,y,19,'#bc9251');circle(ctx,x,y,16,'#06130f');circle(ctx,x,y,12,'#020706');}
  for(const y of [100,173,267,340])for(const x of [16,334]){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#d5b986';ctx.fillRect(-2,-2,4,4);ctx.restore();}
  ctx.save();ctx.globalAlpha=.18;ctx.translate(175,225);ctx.rotate(-Math.PI/2);textAt(ctx,'POCKET • BILLIARDS',0,0,12,'#c6f2df');ctx.restore();
 });
 return {save,pause:cancel,resetInput:cancel,update(dt){time+=dt;if(!dt||won)return;saveClock+=dt;
  // Substeps prevent fast shots tunnelling through another ball on slower frames.
  const steps=Math.max(1,Math.ceil(dt/.009)),step=dt/steps;
  for(let s=0;s<steps;s++){
   for(const b of balls){b.x+=b.vx*step;b.y+=b.vy*step;const friction=Math.pow(.982,step*60);b.vx*=friction;b.vy*=friction;if(Math.hypot(b.vx,b.vy)<4)b.vx=b.vy=0;}
   for(let i=balls.length-1;i>=0;i--){const b=balls[i];if(pockets.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<19)){balls.splice(i,1);flash(b.x,b.y,b.col);if(b.white){balls.push({x:175,y:326,vx:0,vy:0,white:true,n:0,col:'#fff'});message('Scratch · cue ball returned to the table.');feedback('fail');}else{score++;record('pool',score);stats();feedback('score');message('Ball '+b.n+' pocketed · '+score+' of 6.');}continue;}if(b.x<32||b.x>318){b.x=Math.max(32,Math.min(318,b.x));b.vx*=-.86;}if(b.y<30||b.y>410){b.y=Math.max(30,Math.min(410,b.y));b.vy*=-.86;}}
   for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<22){const nx=dx/d,ny=dy/d,overlap=(22-d)/2;a.x-=nx*overlap;b.x+=nx*overlap;a.y-=ny*overlap;b.y+=ny*overlap;const v=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(v>0){a.vx-=v*nx*.97;a.vy-=v*ny*.97;b.vx+=v*nx*.97;b.vy+=v*ny*.97;}}}
  }
  particles=particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;return p.life>0;});
  if(score===6){won=true;save();feedback('success');finishGame('Table cleared','Six balls pocketed in '+shots+' shots.');}
  if(saveClock>1){saveClock=0;save();}
 },render(){
  scene.begin();ctx.drawImage(tableLayer,0,0,350,440);
  const cue=balls.find(b=>b.white);if(cue&&quiet()&&!won&&!aim){ctx.strokeStyle='#d4fff39c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cue.x,cue.y,19+Math.sin(time*3)*2,0,Math.PI*2);ctx.stroke();}
  if(aim&&cue){const dx=aim.start.x-aim.end.x,dy=aim.start.y-aim.end.y,len=Math.hypot(dx,dy),nx=dx/(len||1),ny=dy/(len||1);ctx.save();ctx.setLineDash([4,6]);ctx.strokeStyle='#e2fbe8b0';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cue.x+nx*16,cue.y+ny*16);ctx.lineTo(cue.x+nx*180,cue.y+ny*180);ctx.stroke();ctx.setLineDash([]);const back=24+Math.min(55,len*.5);ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle='#c59a60';ctx.beginPath();ctx.moveTo(cue.x-nx*back,cue.y-ny*back);ctx.lineTo(cue.x-nx*(back+65),cue.y-ny*(back+65));ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#f4e4c5';ctx.beginPath();ctx.moveTo(cue.x-nx*back,cue.y-ny*back);ctx.lineTo(cue.x-nx*(back+20),cue.y-ny*(back+20));ctx.stroke();ctx.restore();rounded(ctx,104,423,142,5,2,'#181f1c');rounded(ctx,104,423,Math.max(2,142*Math.min(1,len/100)),5,2,'#8de3b8');}
  for(const b of balls){circle(ctx,b.x+3,b.y+4,12,'#0005');const light=ctx.createRadialGradient(b.x-4,b.y-5,1,b.x,b.y,12);light.addColorStop(0,b.white?'#fff':b.col);light.addColorStop(.55,b.white?'#f9fff5':b.col);light.addColorStop(1,b.white?'#91a89c':'#17272b');circle(ctx,b.x,b.y,11,light);if(!b.white){circle(ctx,b.x,b.y,4.8,'#fff8e7');ctx.save();ctx.translate(b.x,b.y);if(scene.turned())ctx.rotate(-Math.PI/2);textAt(ctx,''+b.n,0,2.6,7,'#263326');ctx.restore();}circle(ctx,b.x-3.4,b.y-4,2.3,'#ffffffa8');}
  for(const p of particles){ctx.globalAlpha=p.life/.7;circle(ctx,p.x,p.y,2,p.col);}ctx.globalAlpha=1;scene.end();
 }};
}
gameEngines.pool=makePool;
// Photon Hockey — a luminous table, motion trails and direct-touch paddles.
function makeHockey(){
 const [c,ctx]=canvas(350,470),scene=sportsFrame(c,ctx,350,470,true,'#101728'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let puck={x:175,y:235,vx:95,vy:145},player={x:175,y:398},bot={x:175,y:72},you=0,ai=0,over=false,pointer=null,trail=[],rings=[],time=0,saveClock=0,serve=.65,lastScore='';
 const saved=sessionRead('hockey'),valid=(p,velocity=false)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=350&&p.y>=0&&p.y<=470&&(!velocity||[p.vx,p.vy].every(v=>Number.isFinite(v)&&Math.abs(v)<1000));
 if(saved&&valid(saved.puck,true)&&valid(saved.player)&&valid(saved.bot)&&[saved.you,saved.ai].every(v=>Number.isInteger(v)&&v>=0&&v<=5)){puck={...saved.puck};player={...saved.player};bot={...saved.bot};you=saved.you;ai=saved.ai;over=you>=5||ai>=5;}
 function save(){sessionWrite('hockey',{puck,player,bot,you,ai});}
 function stats(){hud([['YOU',you],['RIVAL',ai],['FIRST TO',5]]);}stats();
 function at(e){return scene.point(e);}
 function move(e){const p=at(e);player.x=clamp(p.x,38,312);player.y=clamp(p.y,270,430);}
 listen(c,'pointerdown',e=>{if(over||pointer!==null)return;pointer=e.pointerId;e.preventDefault();c.setPointerCapture(pointer);move(e);});listen(c,'pointermove',e=>{if(pointer===e.pointerId)move(e);});for(const ev of ['pointerup','pointercancel'])listen(c,ev,e=>{if(e.pointerId===pointer)pointer=null;});
 function reset(sign){puck={x:175,y:235,vx:(Math.random()-.5)*120,vy:sign*160};player.x=175;player.y=398;bot.x=175;bot.y=72;trail=[];serve=.65;}
 function goal(won){if(won){you++;record('hockey',you);lastScore='YOUR GOAL';feedback('score');}else{ai++;lastScore='RIVAL SCORES';feedback('fail');}message(won?'Goal! '+you+'–'+ai+' · keep the pressure on.':'Rival scores · '+you+'–'+ai+'.');rings.push({x:175,y:won?20:450,life:1,color:won?'#67e8df':'#f69aca'});reset(won?1:-1);stats();save();if(you===5||ai===5){over=true;feedback(you===5?'success':'fail');finishGame(you===5?'Match won':'Match complete',you+' – '+ai+' · First to five');}}
 function hit(p){const dx=puck.x-p.x,dy=puck.y-p.y,d=Math.hypot(dx,dy);if(d>0&&d<35){const nx=dx/d,ny=dy/d,closing=puck.vx*nx+puck.vy*ny;puck.x=p.x+nx*35.2;puck.y=p.y+ny*35.2;if(closing<0||Math.hypot(puck.vx,puck.vy)<80){const speed=clamp(Math.hypot(puck.vx,puck.vy)*1.08,195,470);puck.vx=nx*speed;puck.vy=ny*speed;rings.push({x:puck.x,y:puck.y,life:.35,color:'#d3f8ff'});}}}
 message('Drag your cyan paddle. Defend the lower goal and score five.');if(over)queueMicrotask(()=>{if(activeGame==='hockey')finishGame(you===5?'Match won':'Match complete',you+' – '+ai+' · First to five')});
 const tableLayer=sportsLayer(350,470,ctx=>{
  const bg=ctx.createLinearGradient(0,0,350,470);bg.addColorStop(0,'#101633');bg.addColorStop(.5,'#081b2a');bg.addColorStop(1,'#092a32');ctx.fillStyle=bg;ctx.fillRect(0,0,350,470);
  rounded(ctx,9,8,332,454,22,'#31465e');rounded(ctx,13,12,324,446,18,'#101627');
  const ice=ctx.createRadialGradient(175,235,20,175,235,250);ice.addColorStop(0,'#1a3f54');ice.addColorStop(1,'#10202e');rounded(ctx,20,19,310,432,12,ice);
  ctx.strokeStyle='#9dbcd31c';ctx.lineWidth=.65;for(let x=28;x<330;x+=12)for(let y=27;y<450;y+=12){ctx.beginPath();ctx.moveTo(x-1,y);ctx.lineTo(x+1,y);ctx.stroke();}
  ctx.save();ctx.shadowBlur=9;ctx.shadowColor='#5ec9ec';ctx.strokeStyle='#67b6d370';ctx.lineWidth=1.3;ctx.strokeRect(24,23,302,424);ctx.beginPath();ctx.moveTo(24,235);ctx.lineTo(326,235);ctx.stroke();ctx.beginPath();ctx.arc(175,235,48,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.strokeStyle='#7096b72e';ctx.lineWidth=1;for(const y of [62,408]){ctx.beginPath();ctx.arc(175,y,58,y===62?0:Math.PI,y===62?Math.PI:Math.PI*2);ctx.stroke();}
  ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#f497ce';rounded(ctx,113,14,124,5,2,'#f5a2d5');ctx.shadowColor='#6aeae4';rounded(ctx,113,451,124,5,2,'#77f4e3');ctx.restore();
  ctx.save();ctx.globalAlpha=.1;textAt(ctx,'PHOTON',175,198,24,'#d8eaff');textAt(ctx,'A I R   H O C K E Y',175,218,9,'#d8eaff');ctx.restore();
 });
 return {save,pause(){pointer=null;},resetInput(){pointer=null;},update(dt){time+=dt;if(over||!dt)return;rings=rings.filter(r=>(r.life-=dt)>0);saveClock+=dt;if(serve>0){serve-=dt;return;}
  const steps=Math.max(1,Math.ceil(dt/.01)),step=dt/steps;
  for(let i=0;i<steps&&!over;i++){
   const targetX=puck.vy<0?puck.x:175;bot.x=clamp(bot.x+clamp(targetX-bot.x,-step*160,step*160),38,312);bot.y=clamp(bot.y+clamp(Math.min(135,puck.y-85)-bot.y,-step*85,step*85),48,150);
   puck.x+=puck.vx*step;puck.y+=puck.vy*step;puck.vx*=Math.pow(.999,step*60);puck.vy*=Math.pow(.999,step*60);
   if(puck.x<24||puck.x>326){puck.x=clamp(puck.x,24,326);puck.vx*=-.97;}
   if(puck.y<22){if(puck.x>117&&puck.x<233){goal(true);break;}puck.y=22;puck.vy=Math.abs(puck.vy);}
   if(puck.y>448){if(puck.x>117&&puck.x<233){goal(false);break;}puck.y=448;puck.vy=-Math.abs(puck.vy);}
   hit(player);hit(bot);
  }
  trail.unshift({x:puck.x,y:puck.y});if(trail.length>12)trail.pop();if(saveClock>1){saveClock=0;save();}
 },render(){
  scene.begin();ctx.drawImage(tableLayer,0,0,350,470);
  for(let i=trail.length-1;i>=0;i--){ctx.globalAlpha=(1-i/12)*.24;circle(ctx,trail[i].x,trail[i].y,Math.max(2,10-i*.5),'#b5e9ff');}ctx.globalAlpha=1;
  function paddle(p,color,light){circle(ctx,p.x+2,p.y+6,27,'#0005');const metal=ctx.createRadialGradient(p.x-8,p.y-10,1,p.x,p.y,27);metal.addColorStop(0,light);metal.addColorStop(.35,color);metal.addColorStop(1,'#173340');circle(ctx,p.x,p.y,25,metal);ctx.strokeStyle=light;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.stroke();circle(ctx,p.x,p.y-2,14,'#112836');circle(ctx,p.x,p.y-4,12,color);ctx.strokeStyle=light+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-4,9,Math.PI,Math.PI*1.7);ctx.stroke();}
  paddle(bot,'#b74e9b','#ffc4ed');paddle(player,'#229eb5','#b1fff5');
  circle(ctx,puck.x+1,puck.y+3,12,'#0008');const puckLight=ctx.createRadialGradient(puck.x-3,puck.y-4,1,puck.x,puck.y,11);puckLight.addColorStop(0,'#fff');puckLight.addColorStop(.6,'#d7eef8');puckLight.addColorStop(1,'#5b819c');circle(ctx,puck.x,puck.y,10,puckLight);circle(ctx,puck.x,puck.y,3,'#37677c');
  for(const r of rings){ctx.globalAlpha=Math.min(1,r.life*2);ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,10+(1-r.life)*60,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  if(serve>0){ctx.save();ctx.globalAlpha=.85;rounded(ctx,96,256,158,26,13,'#07131cd9');textAt(ctx,lastScore||'READY TO RALLY',175,273,10,'#d4f6fc');ctx.restore();}scene.end();
 }};
}
gameEngines.hockey=makeHockey;
// Parking Challenge: illustrated rooftop lot, precise top-down steering, three bays.
function makeParking() {
  const [c,ctx]=canvas(350,430),scene=sportsFrame(c,ctx,350,430,true,'#1b3039'), slots=[{x:80,y:82},{x:270,y:82},{x:175,y:82}];
  const player={x:175,y:352,a:0,v:0}, press={left:false,right:false,up:false,down:false};
  let level=0,hold=0,over=false,clock=0,autosave=0,collisionCooldown=0;
  const prior=sessionRead('parking');
  if(prior&&Number.isInteger(prior.level)&&prior.level>=0&&prior.level<=3&&prior.player&&['x','y','a','v'].every(k=>Number.isFinite(prior.player[k]))&&prior.player.x>=21&&prior.player.x<=329&&prior.player.y>=29&&prior.player.y<=402&&Math.abs(prior.player.v)<=125&&Math.abs(prior.player.a)<1e7){
    Object.assign(player,prior.player);level=prior.level;over=level===3;
  }
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const release=()=>{Object.keys(press).forEach(k=>press[k]=false);controls.querySelectorAll('button').forEach(b=>b.classList.remove('pressed'))};
  const controls=h('div','dpad parking-controls');
  const buttons=[['',''],['↑','up'],['',''],['‹','left'],['↓','down'],['›','right']];
  const labels={up:'Hold to accelerate',down:'Hold to reverse or brake',left:'Steer left',right:'Steer right'};
  for(const [label,key] of buttons){
    const b=h('button',key?'':'pad-spacer',label);
    if(!key){b.tabIndex=-1;b.setAttribute('aria-hidden','true')}else{
      b.setAttribute('aria-label',labels[key]);
      listen(b,'pointerdown',e=>{e.preventDefault();if(over)return;press[key]=true;b.classList.add('pressed');b.setPointerCapture(e.pointerId)});
      for(const ev of ['pointerup','pointercancel','lostpointercapture'])listen(b,ev,()=>{press[key]=false;b.classList.remove('pressed')});
    }
    controls.append(b);
  }
  $('gameStage').append(controls);
  const keyMap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
  listen(document,'keydown',e=>{const key=keyMap[e.key];if(key){e.preventDefault();press[key]=true}});
  listen(document,'keyup',e=>{const key=keyMap[e.key];if(key)press[key]=false});
  listen(window,'blur',release);
  function save(){sessionWrite('parking',{level,player:{...player}})}
  function reset(){Object.assign(player,{x:175,y:352,a:0,v:0});hold=0;release()}
  function stats(){hud([['BAY',Math.min(3,level+1)+'/3'],['SPEED',Math.round(Math.abs(player.v))],['BEST',best('parking')+'/3']])}
  function parked(){if(over)return false;let a=((player.a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return Math.abs(player.x-slots[level].x)<13&&Math.abs(player.y-slots[level].y)<15&&Math.abs(a)<.25&&Math.abs(player.v)<16}
  const bg=document.createElement('canvas');bg.width=700;bg.height=860;const b=bg.getContext('2d');b.scale(2,2);
  const rr=(x,y,w,ht,r,col)=>{b.fillStyle=col;b.beginPath();b.roundRect(x,y,w,ht,r);b.fill()};
  const ground=b.createLinearGradient(0,0,350,430);ground.addColorStop(0,'#293f4b');ground.addColorStop(1,'#142a36');b.fillStyle=ground;b.fillRect(0,0,350,430);
  // Fine asphalt texture is drawn once, never allocated in the animation loop.
  for(let y=31;y<430;y+=7)for(let x=3;x<350;x+=7){b.fillStyle=(x+y)%3?'#ffffff04':'#00000015';b.fillRect(x+(y%3),y,1,1)}
  rr(0,0,350,25,0,'#0d202a');rr(6,3,338,18,4,'#44515b');
  for(let x=10;x<340;x+=38){rr(x,4,28,11,2,'#1d303c');rr(x+3,5,22,4,1,'#527182')}
  b.fillStyle='#83b4c3';b.font='600 6px -apple-system,Arial';b.textAlign='center';b.fillText('SKYLINE MOTOR CLUB  /  ROOFTOP 03',175,20);
  // Raised edge curbs, expansion joints, drainage and bollards.
  rr(0,27,8,403,0,'#51616a');rr(342,27,8,403,0,'#51616a');
  for(let y=31;y<424;y+=31){rr(0,y,8,13,0,'#b69c66');rr(342,y,8,13,0,'#b69c66')}
  b.strokeStyle='#7e96a01b';b.lineWidth=1;for(const y of [145,238,330]){b.beginPath();b.moveTo(12,y);b.lineTo(338,y);b.stroke()}
  for(const x of [16,334])for(const y of [156,293]){rr(x-3,y,6,20,1,'#0b1c25');for(let i=0;i<5;i++)rr(x-2,y+2+i*3,4,1,0,'#61757c')}
  // Planters and low retaining walls add depth without becoming invisible obstacles.
  for(const [x,y]of [[20,32],[319,32],[20,390],[319,390]]){rr(x+3,y+5,13,24,4,'#07172088');rr(x,y,13,24,3,'#73817b');rr(x+2,y+2,9,18,2,'#314b3c');b.fillStyle='#64916d';b.beginPath();b.ellipse(x+6,y+9,7,10,0,0,Math.PI*2);b.fill();b.fillStyle='#8ab481';b.beginPath();b.ellipse(x+4,y+6,4,6,0,0,Math.PI*2);b.fill()}
  b.strokeStyle='#dbe4cf70';b.lineWidth=2;b.setLineDash([12,16]);b.beginPath();b.moveTo(18,258);b.lineTo(332,258);b.stroke();b.setLineDash([]);
  // Direction chevrons and painted approach circle.
  b.strokeStyle='#b8c5bd22';b.lineWidth=2;b.beginPath();b.arc(175,350,42,0,Math.PI*2);b.stroke();
  for(const x of [80,270]){b.strokeStyle='#c8d4c94a';b.lineWidth=4;b.beginPath();b.moveTo(x-8,213);b.lineTo(x,203);b.lineTo(x+8,213);b.stroke()}
  b.fillStyle='#b2c9bf55';b.font='600 8px -apple-system,Arial';b.fillText('SLOW  ·  PRECISION ZONE',175,282);
  function car(){
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.a);
    rounded(ctx,-17+4,-30+6,34,61,9,'#06121ca6');
    const steer=(press.right?1:0)-(press.left?1:0);
    for(const x of [-18,18]){ctx.save();ctx.translate(x,-15);ctx.rotate(steer*.28);rounded(ctx,-3,-6,6,12,2,'#07131c');ctx.restore();rounded(ctx,x-3,13,6,12,2,'#07131c')}
    const paint=ctx.createLinearGradient(-16,0,16,0);paint.addColorStop(0,'#1b687b');paint.addColorStop(.23,'#64d5df');paint.addColorStop(.55,'#9be6e4');paint.addColorStop(1,'#217b91');
    rounded(ctx,-16,-29,32,58,8,paint);rounded(ctx,-14,-26,28,13,6,'#8bdedc');
    ctx.strokeStyle='#e2ffff6b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-11,-26);ctx.lineTo(-11,-17);ctx.moveTo(11,-26);ctx.lineTo(11,-17);ctx.stroke();
    rounded(ctx,-12,-14,24,16,4,'#122d43');
    const glass=ctx.createLinearGradient(-12,-14,12,2);glass.addColorStop(0,'#90d5e7');glass.addColorStop(.4,'#244a65');glass.addColorStop(.5,'#579bb5');glass.addColorStop(1,'#10283f');rounded(ctx,-11,-13,22,14,3,glass);
    rounded(ctx,-11,3,22,15,4,'#74cdcf');rounded(ctx,-10,18,20,6,2,'#173d50');
    ctx.strokeStyle='#c3ffff80';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(-13,22);ctx.moveTo(13,0);ctx.lineTo(13,22);ctx.stroke();
    rounded(ctx,-20,-7,4,5,2,'#68c5cf');rounded(ctx,16,-7,4,5,2,'#68c5cf');
    rounded(ctx,-12,-27,8,3,1,'#e8f8d3');rounded(ctx,4,-27,8,3,1,'#e8f8d3');
    const brake=press.down?'#ff7e7b':'#b24650';rounded(ctx,-12,24,8,3,1,brake);rounded(ctx,4,24,8,3,1,brake);
    if(press.down){ctx.shadowColor='#ff6575';ctx.shadowBlur=8;rounded(ctx,-10,27,6,2,1,'#ff9c99');rounded(ctx,4,27,6,2,1,'#ff9c99');ctx.shadowBlur=0}
    rounded(ctx,-6,26,12,2,1,'#bed8c9');ctx.restore();
  }
  if(over)queueMicrotask(()=>{if(activeGame==='parking')finishGame('Parking master','Three precise arrivals. All bays complete.')});
  stats();message(over?'All three bays complete. Restart for another drive.':'Hold ↑ to drive. Steer while moving. Release to brake, and settle inside the glowing bay.');
  return {
    save,pause:release,resetInput:release,
    update(dt){
      if(over)return;clock+=dt;autosave+=dt;collisionCooldown=Math.max(0,collisionCooldown-dt);
      if(press.up)player.v+=95*dt;if(press.down)player.v-=110*dt;
      if(!press.up&&!press.down)player.v*=Math.pow(.95,dt*60);
      player.v=clamp(player.v,-65,125);if(Math.abs(player.v)<1)player.v=0;
      const steer=(press.right?1:0)-(press.left?1:0);
      player.a+=steer*Math.sign(player.v||1)*Math.min(1,Math.abs(player.v)/35)*1.9*dt;
      player.x+=Math.sin(player.a)*player.v*dt;player.y-=Math.cos(player.a)*player.v*dt;
      if(player.x<21||player.x>329||player.y<29||player.y>402){player.x=clamp(player.x,21,329);player.y=clamp(player.y,29,402);player.v=0;if(!collisionCooldown){message('Easy on the curb. Reverse and try a wider approach.');feedback('fail');collisionCooldown=1.5}}
      if(parked()){
        hold+=dt;if(hold>.75){level++;record('parking',level);feedback('success');hold=0;
          if(level===3){over=true;release();save();finishGame('Parking master','Three precise arrivals. All bays complete.')}else{message('Beautiful parking. Next up: bay '+(level+1)+'.');reset();save()}
        }
      }else hold=0;
      if(autosave>1){autosave=0;save()}stats();
    },
    render(){
      scene.begin();ctx.drawImage(bg,0,0,350,430);
      for(let i=0;i<3;i++){
        const s=slots[i],active=i===level&&!over,done=i<level;
        rounded(ctx,s.x-31,s.y-44,62,90,3,active?'#5cdcc51c':'#061f2a40');
        ctx.save();ctx.lineWidth=active?2.5:1.5;ctx.strokeStyle=done?'#8cddd082':active?'#a2f7c5':'#9baea781';
        if(active){ctx.shadowColor='#6ce8bf';ctx.shadowBlur=8+Math.sin(clock*3)*3}
        ctx.beginPath();ctx.moveTo(s.x-26,s.y+41);ctx.lineTo(s.x-26,s.y-40);ctx.lineTo(s.x+26,s.y-40);ctx.lineTo(s.x+26,s.y+41);ctx.stroke();ctx.restore();
        rounded(ctx,s.x-19,s.y-45,38,7,2,active?'#a5d29a':'#596a6c');
        textAt(ctx,done?'✓':String(i+1).padStart(2,'0'),s.x,s.y+2,20,done?'#9fd9bd':active?'#d5fad5':'#a0b3aa');
        if(active){textAt(ctx,'PARK HERE',s.x,s.y+18,6,'#abdfc1');const pulse=.5+Math.sin(clock*3)*.12;ctx.globalAlpha=pulse;ctx.strokeStyle='#aaf5cd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x-7,s.y+64);ctx.lineTo(s.x,s.y+56);ctx.lineTo(s.x+7,s.y+64);ctx.stroke();ctx.globalAlpha=1}
      }
      car();
      if(hold>0){rounded(ctx,102,392,146,8,4,'#0d2029');rounded(ctx,104,394,142*clamp(hold/.75,0,1),4,2,'#abf7ce');textAt(ctx,'HOLD STEADY',175,386,8,'#c7ead2')}
      if(over){ctx.fillStyle='#071d2780';ctx.fillRect(0,0,350,430);textAt(ctx,'ALL BAYS COMPLETE',175,224,20,'#d6fce4')}scene.end();
    }
  };
}
gameEngines.parking=makeParking;
