// Pocket Arcade V2 — original Canvas artwork. Logical coordinates are scaled by the shell.
function adventureStar(ctx,x,y,r,color,spin=0){ctx.save();ctx.translate(x,y);ctx.rotate(spin);ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,v=i%2?r*.45:r;ctx.lineTo(Math.cos(a)*v,Math.sin(a)*v)}ctx.closePath();ctx.fill();ctx.restore()}
function adventureReduced(){return typeof preferences!=='undefined'&&preferences.reducedMotion===true}
function adventureBurst(list,x,y,color,count=10){if(adventureReduced())return;for(let i=0;i<count;i++){const a=i/count*Math.PI*2;list.push({x,y,vx:Math.cos(a)*(25+Math.random()*55),vy:Math.sin(a)*(25+Math.random()*55),life:.65,color})}}
function adventureParticles(ctx,list,dt){if(adventureReduced()){list.length=0;return}for(let i=list.length-1;i>=0;i--){const p=list[i];p.life-=dt;if(p.life<=0){list.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=75*dt}}
function adventureDrawParticles(ctx,list,shape=null){ctx.save();for(const p of list){ctx.globalAlpha=Math.min(1,p.life*2);if(shape)adventureAt(ctx,p.x,p.y,shape);circle(ctx,p.x,p.y,Math.max(1,p.life*4),p.color);if(shape)ctx.restore()}ctx.restore()}
const adventureFinite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
function adventureShape(c,w,h){const r=c.getBoundingClientRect(),sx=r.width/w||1,sy=r.height/h||1,unit=Math.min(sx,sy);return{x:unit/sx,y:unit/sy}}
function adventureAt(ctx,x,y,shape){ctx.save();ctx.translate(x,y);ctx.scale(shape.x,shape.y);ctx.translate(-x,-y)}

