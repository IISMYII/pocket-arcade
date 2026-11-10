// Photon Hockey V3 — cached V2 artwork, independent fixed-step simulation.
registerSessionValidator('hockey',raw=>PocketHockey.isSnapshot(raw)&&!raw.ended&&Math.max(raw.you,raw.ai)<PocketHockey.options(raw.options).target);
function makeHockey(){
 const [c,ctx]=canvas(350,470),scene=sportsFrame(c,ctx,350,470,true,'#101728');
 const config=PocketHockey.options(getGameOptions('hockey')),saved=sessionRead('hockey');
 let model=saved?PocketHockey.restore(saved,config):PocketHockey.create(config),pointer=null,trail=[],rings=[],time=0,saveClock=0,reported=false;
 function save(){sessionWrite('hockey',PocketHockey.snapshot(model));}
 const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
 function stats(){hud([['YOU',model.you],['RIVAL',model.ai],['TARGET',model.options.target],['TIME',clock(model.elapsed)]]);}
 function resetInput(){pointer=null;PocketHockey.setTarget(model,model.player.x,model.player.y);}
 function move(e){const p=scene.point(e);PocketHockey.setTarget(model,p.x,p.y);}
 listen(c,'pointerdown',e=>{if(model.ended||pointer!==null)return;pointer=e.pointerId;e.preventDefault();c.setPointerCapture(pointer);move(e);});
 listen(c,'pointermove',e=>{if(pointer===e.pointerId)move(e);});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])listen(c,ev,e=>{if(pointer===e.pointerId)pointer=null;});
 function finish(){if(reported)return;reported=true;const win=model.you>=model.options.target;
 const result=Math.max(0,model.you*100+(win?Math.max(0,model.options.target-model.ai)*20:0)+model.stats.saves*5);recordScore('hockey',Math.floor(result));
 if(win)completeLevel('hockey',['easy','medium','hard'].indexOf(model.options.difficulty)+1,model.ai<=model.options.target/2?3:2);
 save();finishGame(win?'Match won':'Match complete',model.you+' – '+model.ai+' · '+model.options.difficulty+' · first to '+model.options.target,{stats:[['SHOTS',model.stats.shots],['PADDLE HITS',model.stats.hits],['SAVES',model.stats.saves],['TIME',clock(model.elapsed)],['RECOVERIES',model.stats.recoveries]],next:()=>{setGameOptions('hockey',config);openGame('hockey',true)}});}
 function simulate(dt){const events=PocketHockey.advance(model,dt);for(const e of events){
 if(e.type==='hit'){if(!preferences.reducedMotion)rings.push({x:e.x,y:e.y,life:.35,color:'#d3f8ff'});if(e.who==='you')feedback('tap');}
 if(e.type==='goal'){feedback(e.who==='you'?'score':'fail');message(e.who==='you'?'Goal! '+e.you+'–'+e.ai:'Rival scores · '+e.you+'–'+e.ai);if(!preferences.reducedMotion)rings.push({x:175,y:e.who==='you'?20:450,life:1,color:e.who==='you'?'#67e8df':'#f69aca'});trail=[];save();}
 if(e.type==='recovery'){message(e.method==='neutral-serve'?'Neutral re-serve after a blocked puck. No points awarded.':'Puck freed from a stalled contact. No points awarded.');save();}
 if(e.type==='end')finish();
 }return events;}
 stats();message('Drag to guide your cyan paddle · '+config.difficulty+' · first to '+config.target+'.');
 if(saved&&model.recoveryLog.length)message('Restored safely · a blocked puck received a neutral serve. Scores kept.');
 if(model.ended)queueMicrotask(()=>{if(activeGame==='hockey')finish();});
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
 return {save,pause:resetInput,resetInput,
 debug:{get state(){return PocketHockey.snapshot(model)},setState(raw){model=PocketHockey.restore(raw,config);reported=false;stats();},advance(dt){return simulate(dt);}},
 update(dt){time+=dt;if(!dt||model.ended)return;rings=rings.filter(r=>(r.life-=dt)>0);simulate(dt);saveClock+=dt;
 if(preferences.reducedMotion){trail.length=0;rings.length=0}else{trail.unshift({x:model.puck.x,y:model.puck.y});if(trail.length>12)trail.pop()}if(saveClock>1){saveClock=0;save();}stats();
 },render(){const {puck,player,bot}=model;
  scene.begin();ctx.drawImage(tableLayer,0,0,350,470);
  for(let i=trail.length-1;i>=0;i--){ctx.globalAlpha=(1-i/12)*.24;circle(ctx,trail[i].x,trail[i].y,Math.max(2,10-i*.5),'#b5e9ff');}ctx.globalAlpha=1;
  function paddle(p,color,light){circle(ctx,p.x+2,p.y+6,27,'#0005');const metal=ctx.createRadialGradient(p.x-8,p.y-10,1,p.x,p.y,27);metal.addColorStop(0,light);metal.addColorStop(.35,color);metal.addColorStop(1,'#173340');circle(ctx,p.x,p.y,25,metal);ctx.strokeStyle=light;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.stroke();circle(ctx,p.x,p.y-2,14,'#112836');circle(ctx,p.x,p.y-4,12,color);ctx.strokeStyle=light+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-4,9,Math.PI,Math.PI*1.7);ctx.stroke();}
  paddle(bot,'#b74e9b','#ffc4ed');paddle(player,'#229eb5','#b1fff5');
  circle(ctx,puck.x+1,puck.y+3,12,'#0008');const puckLight=ctx.createRadialGradient(puck.x-3,puck.y-4,1,puck.x,puck.y,11);puckLight.addColorStop(0,'#fff');puckLight.addColorStop(.6,'#d7eef8');puckLight.addColorStop(1,'#5b819c');circle(ctx,puck.x,puck.y,10,puckLight);circle(ctx,puck.x,puck.y,3,'#37677c');
  for(const r of rings){ctx.globalAlpha=Math.min(1,r.life*2);ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,10+(1-r.life)*60,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  if(model.serve>0){ctx.save();ctx.globalAlpha=.85;rounded(ctx,96,256,158,26,13,'#07131cd9');textAt(ctx,model.serve>.35?String(Math.max(1,Math.ceil(model.serve))):'PLAY',175,273,10,'#d4f6fc');ctx.restore();}scene.end();
 }};
}
gameEngines.hockey=makeHockey;
