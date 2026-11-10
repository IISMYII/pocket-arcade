registerSessionValidator('pool',data=>{const valid=PocketPool.validate(data);return !!valid&&!PocketPool.create(valid.options,valid).state.terminal});
// Pocket Pool V3: fixed-step physics, three solo modes, original cached artwork.
function makePool(){
 const [c,ctx]=canvas(350,440),scene=sportsFrame(c,ctx,350,440,true,'#10201e'),palette=['#f5bf48','#5599e5','#ea6374','#ab7bd6','#6bc5a1','#ef9c55'];
 const options=getGameOptions('pool'),model=PocketPool.create(options,sessionRead('pool')),state=model.state,pockets=PocketPool.POCKETS,quiet=model.quiet;
 let aim=null,pointer=null,particles=[],time=0,saveClock=0,reported=false;
 function paintBall(b){b.col=b.white?'#fff':palette[(b.n-1)%6];}state.balls.forEach(paintBall);
 function save(){sessionWrite('pool',model.snapshot());}
 function stats(){hud([['POTTED',state.score+'/6'],[state.options.mode==='sprint'?'TIME':state.options.mode==='precision'?'SHOTS LEFT':'SHOTS',state.options.mode==='sprint'?Math.max(0,Math.ceil(90-state.elapsed))+'s':state.options.mode==='precision'?Math.max(0,12-state.shots):state.shots],['POINTS',PocketPool.points(state)],['BEST',bestScore('pool')]]);}
 function finish(){if(reported||!state.terminal)return;reported=true;recordScore('pool',PocketPool.points(state));if(state.score===6)completeLevel('pool',({practice:1,precision:2,sprint:3})[state.options.mode],state.shots<=7?3:state.shots<=10?2:1);save();finishGame(state.score===6?'Table cleared':state.terminal==='time'?'Time complete':'Precision complete',state.score+' of 6 balls · '+state.shots+' shots',{stats:[['Mode',state.options.mode],['Potted',state.score+'/6'],['Points',PocketPool.points(state)],['Shots',state.shots],['Scratches',state.scratches],['Time',Math.floor(state.elapsed)+'s']]});}
 function cancel(){aim=null;pointer=null;}
 listen(c,'pointerdown',e=>{if(state.terminal||pointer!==null||!quiet()||state.cuePending)return;const p=scene.point(e),cue=state.balls.find(b=>b.white);if(!cue||Math.hypot(p.x-cue.x,p.y-cue.y)>34){message('Touch the white ball, pull back, then release.');return;}e.preventDefault();pointer=e.pointerId;c.setPointerCapture(pointer);aim={start:p,end:p};feedback('tap');});
 listen(c,'pointermove',e=>{if(e.pointerId===pointer&&aim)aim.end=scene.point(e);});
 listen(c,'pointerup',e=>{if(e.pointerId!==pointer||!aim)return;if(model.shoot(aim.start.x-aim.end.x,aim.start.y-aim.end.y)){stats();feedback('tap');message('Shot '+state.shots+' · let the table settle before your next stroke.');save();}cancel();});listen(c,'pointercancel',cancel);
 function flash(x,y,color){if(typeof preferences!=='undefined'&&preferences.reducedMotion)return;for(let n=0;n<9;n++){const a=n*Math.PI*2/9;particles.push({x,y,vx:Math.cos(a)*35,vy:Math.sin(a)*35,life:.7,col:color});}}
 stats();message(state.options.mode==='precision'?'Precision · clear six balls in 12 shots.':state.options.mode==='sprint'?'Sprint · clear the table in 90 seconds from your first stroke.':'Practice · take your time and clear all six balls.');
 if(state.terminal)queueMicrotask(()=>{if(activeGame==='pool')finish();});
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
 return {save,pause:cancel,resetInput:cancel,debug:{model,getState:()=>model.snapshot()},update(dt){time+=dt;saveClock+=dt;for(const event of model.advance(dt)){if(event.type==='pocket'){recordScore('pool',PocketPool.points(state));feedback('score');flash(event.x,event.y,palette[(event.n-1)%6]);message('Ball '+event.n+' pocketed · '+state.score+' of 6.');}else if(event.type==='scratch'){feedback('fail');flash(event.x,event.y,'#fff');message('Scratch · cue returns once the other balls stop.');}else if(event.type==='cue-return'){state.balls.forEach(paintBall);message('Cue ball returned to a clear spot. Line up your next shot.');}}if(typeof preferences!=='undefined'&&preferences.reducedMotion)particles.length=0;particles=particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;return p.life>0;});stats();if(saveClock>1){saveClock=0;save();}finish();},render(){const balls=state.balls,won=!!state.terminal;

  scene.begin();ctx.drawImage(tableLayer,0,0,350,440);
  const cue=balls.find(b=>b.white);if(cue&&quiet()&&!won&&!aim){ctx.strokeStyle='#d4fff39c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cue.x,cue.y,19+(typeof preferences!=='undefined'&&preferences.reducedMotion?0:Math.sin(time*3)*2),0,Math.PI*2);ctx.stroke();}
  if(aim&&cue){const dx=aim.start.x-aim.end.x,dy=aim.start.y-aim.end.y,len=Math.hypot(dx,dy),nx=dx/(len||1),ny=dy/(len||1);ctx.save();if(state.options.assist){const guide=PocketPool.aim(state,dx,dy);if(guide){ctx.setLineDash([4,6]);ctx.strokeStyle='#e2fbe8b0';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cue.x+nx*16,cue.y+ny*16);ctx.lineTo(guide.x,guide.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(guide.x,guide.y,11,0,Math.PI*2);ctx.stroke();}}const back=24+Math.min(55,len*.5);ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle='#c59a60';ctx.beginPath();ctx.moveTo(cue.x-nx*back,cue.y-ny*back);ctx.lineTo(cue.x-nx*(back+65),cue.y-ny*(back+65));ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#f4e4c5';ctx.beginPath();ctx.moveTo(cue.x-nx*back,cue.y-ny*back);ctx.lineTo(cue.x-nx*(back+20),cue.y-ny*(back+20));ctx.stroke();ctx.restore();rounded(ctx,104,423,142,5,2,'#181f1c');rounded(ctx,104,423,Math.max(2,142*Math.min(1,len/100)),5,2,'#8de3b8');}
  for(const b of balls){circle(ctx,b.x+3,b.y+4,12,'#0005');const light=ctx.createRadialGradient(b.x-4,b.y-5,1,b.x,b.y,12);light.addColorStop(0,b.white?'#fff':b.col);light.addColorStop(.55,b.white?'#f9fff5':b.col);light.addColorStop(1,b.white?'#91a89c':'#17272b');circle(ctx,b.x,b.y,11,light);if(!b.white){circle(ctx,b.x,b.y,4.8,'#fff8e7');ctx.save();ctx.translate(b.x,b.y);if(scene.turned())ctx.rotate(-Math.PI/2);textAt(ctx,''+b.n,0,2.6,7,'#263326');ctx.restore();}circle(ctx,b.x-3.4,b.y-4,2.3,'#ffffffa8');}
  for(const p of particles){ctx.globalAlpha=p.life/.7;circle(ctx,p.x,p.y,2,p.col);}ctx.globalAlpha=1;scene.end();
 }};
}
gameEngines.pool=makePool;
