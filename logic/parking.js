(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ParkingLogic=api})(globalThis,function(){'use strict';
const VEHICLES={compact:{w:26,l:48,wheelbase:29,max:112,accel:130,steer:.63},sedan:{w:30,l:58,wheelbase:36,max:125,accel:105,steer:.56},van:{w:34,l:64,wheelbase:41,max:95,accel:88,steer:.5}};
const LEVELS=[
 {name:'First arrival',start:{x:175,y:350,a:0},bay:{x:175,y:85,a:0,w:54,l:88},obstacles:[{x:75,y:90,w:48,h:96},{x:275,y:90,w:48,h:96}]},
 {name:'West wing',start:{x:82,y:350,a:0},bay:{x:82,y:87,a:0,w:48,l:86},obstacles:[{x:173,y:155,w:60,h:95},{x:275,y:80,w:48,h:95},{x:248,y:328,w:85,h:30}]},
 {name:'East corridor',start:{x:175,y:350,a:0},bay:{x:272,y:80,a:0,w:48,l:84},obstacles:[{x:75,y:80,w:48,h:95},{x:161,y:174,w:52,h:110},{x:85,y:334,w:90,h:27}]},
 {name:'Lateral approach',start:{x:65,y:350,a:0},bay:{x:282,y:210,a:Math.PI/2,w:48,l:85},obstacles:[{x:95,y:85,w:115,h:80},{x:190,y:330,w:140,h:70}]},
 {name:'Reverse arrival',start:{x:175,y:90,a:0},bay:{x:175,y:350,a:0,w:50,l:88},obstacles:[{x:75,y:250,w:48,h:90},{x:275,y:210,w:48,h:110}],reverse:true},
 {name:'Diagonal deck',start:{x:85,y:325,a:Math.PI/4},bay:{x:265,y:145,a:Math.PI/4,w:50,l:86},obstacles:[{x:66,y:85,w:85,h:70},{x:280,y:350,w:70,h:70}]},
 {name:'Sunset return',start:{x:280,y:120,a:-3*Math.PI/4},bay:{x:100,y:300,a:-3*Math.PI/4,w:48,l:86},obstacles:[{x:76,y:80,w:70,h:60},{x:272,y:344,w:70,h:70},{x:52,y:194,w:40,h:65}]},
 {name:'Cross-deck precision',start:{x:280,y:350,a:0},bay:{x:70,y:226,a:-Math.PI/2,w:46,l:82},obstacles:[{x:145,y:95,w:120,h:75},{x:170,y:344,w:130,h:60},{x:295,y:55,w:40,h:38}]}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function corners(p,w,l){return [[-w/2,-l/2],[w/2,-l/2],[w/2,l/2],[-w/2,l/2]].map(([x,y])=>({x:p.x+x*Math.cos(p.a)-y*Math.sin(p.a),y:p.y+x*Math.sin(p.a)+y*Math.cos(p.a)}))}
function overlaps(poly,rect){const other=[{x:rect.x-rect.w/2,y:rect.y-rect.h/2},{x:rect.x+rect.w/2,y:rect.y-rect.h/2},{x:rect.x+rect.w/2,y:rect.y+rect.h/2},{x:rect.x-rect.w/2,y:rect.y+rect.h/2}];for(const shape of [poly,other])for(let i=0;i<4;i++){const a=shape[i],b=shape[(i+1)%4],axis={x:-(b.y-a.y),y:b.x-a.x};const project=pts=>pts.map(p=>p.x*axis.x+p.y*axis.y),pa=project(poly),pb=project(other);if(Math.max(...pa)<=Math.min(...pb)||Math.max(...pb)<=Math.min(...pa))return false}return true}
function collision(p,vehicle,level){const poly=corners(p,vehicle.w,vehicle.l);return poly.some(v=>v.x<10||v.x>340||v.y<28||v.y>420)||level.obstacles.some(r=>overlaps(poly,r))}
function inBay(p,vehicle,bay,difficulty='medium'){const tol={easy:.26,medium:.17,hard:.1}[difficulty]||.17;if(Math.abs(angle(p.a-bay.a))>tol||Math.abs(p.v)>({easy:12,medium:7,hard:4}[difficulty]||7))return false;return corners(p,vehicle.w,vehicle.l).every(c=>{const x=c.x-bay.x,y=c.y-bay.y;return Math.abs(x*Math.cos(bay.a)+y*Math.sin(bay.a))<=bay.w/2&&Math.abs(-x*Math.sin(bay.a)+y*Math.cos(bay.a))<=bay.l/2})}
function create(options={}){const level=clamp(options.level|0||1,1,8),vehicle=VEHICLES[options.vehicle]?options.vehicle:'compact',difficulty=['easy','medium','hard'].includes(options.difficulty)?options.difficulty:'medium';const def=LEVELS[level-1];return{version:3,level,vehicle,difficulty,p:{...def.start,v:0},elapsed:0,collisions:0,hold:0,cooldown:0,done:false,accumulator:0}}
function tick(s,input,dt){if(s.done)return;s.elapsed+=dt;s.cooldown=Math.max(0,s.cooldown-dt);const v=VEHICLES[s.vehicle],old={...s.p};const throttle=(input.up?1:0)-(input.down?1:0);if(throttle){const braking=s.p.v*throttle<0;s.p.v+=throttle*(braking?245:v.accel)*dt}else s.p.v*=Math.exp(-2.2*dt);s.p.v=clamp(s.p.v,-58,v.max);if(Math.abs(s.p.v)<.1)s.p.v=0;const steer=((input.right?1:0)-(input.left?1:0))*v.steer;s.p.a=angle(s.p.a+s.p.v/v.wheelbase*Math.tan(steer)*dt);s.p.x+=Math.sin(s.p.a)*s.p.v*dt;s.p.y-=Math.cos(s.p.a)*s.p.v*dt;if(collision(s.p,v,LEVELS[s.level-1])){s.p={...old,v:-old.v*.08};if(s.cooldown===0){s.collisions++;s.cooldown=.8}s.hold=0}else if(inBay(s.p,v,LEVELS[s.level-1].bay,s.difficulty)){s.hold+=dt;if(s.hold>=({easy:.6,medium:.85,hard:1.1}[s.difficulty]))s.done=true}else s.hold=0}
function update(s,input,dt){if(!Number.isFinite(dt)||dt<=0)return s;s.accumulator+=clamp(dt,0,.25);while(s.accumulator+1e-10>=1/120){tick(s,input,1/120);s.accumulator=Math.max(0,s.accumulator-1/120)}return s}
function score(s){return Math.max(50,Math.round((1000+s.level*150-s.elapsed*4-s.collisions*90)*({easy:.8,medium:1,hard:1.3}[s.difficulty])))}
function restore(v,options={}){if(!v||v.version!==3||!Number.isInteger(v.level)||v.level<1||v.level>8||!VEHICLES[v.vehicle]||!['easy','medium','hard'].includes(v.difficulty)||!v.p||!['x','y','a','v'].every(k=>Number.isFinite(v.p[k]))||Math.abs(v.p.v)>150||Math.abs(v.p.a)>1e5||!Number.isFinite(v.elapsed)||v.elapsed<0||v.elapsed>1e7||!Number.isInteger(v.collisions)||v.collisions<0||v.collisions>1e6||typeof v.done!=='boolean')return null;
 if(['level','vehicle','difficulty'].some(k=>options[k]!==undefined&&options[k]!==v[k]))return null;
 const s=create(v);if(collision(v.p,VEHICLES[v.vehicle],LEVELS[v.level-1]))return null;
 s.p={x:v.p.x,y:v.p.y,a:angle(v.p.a),v:v.p.v};s.elapsed=v.elapsed;s.collisions=v.collisions;s.done=v.done&&inBay(s.p,VEHICLES[s.vehicle],LEVELS[s.level-1].bay,s.difficulty);return s}
function legacy(v){return v&&Number.isInteger(v.level)&&v.level>=0&&v.level<3&&v.player&&['x','y','a','v'].every(k=>Number.isFinite(v.player[k]))&&Math.abs(v.player.a)<1e5&&Math.abs(v.player.v)<=125&&v.player.x>=21&&v.player.x<=329&&v.player.y>=29&&v.player.y<=402}
function migrate(v,options={}){if(!legacy(v))return null;const s=create(options);s.migrated=true;return s}
function snapshot(s){return{version:3,level:s.level,vehicle:s.vehicle,difficulty:s.difficulty,p:{...s.p},elapsed:s.elapsed,collisions:s.collisions,done:s.done}}
// Collision-free reference approaches used by deterministic control tests. These are
// geometric routes, not a player autopilot; the actual simulation must follow them.
function approach(level){const def=LEVELS[level-1],poses=[{...def.start}],p={...def.start};
 const straight=(distance)=>{const sign=Math.sign(distance)||1;for(let d=0;d<Math.abs(distance)-1e-8;){const ds=Math.min(2,Math.abs(distance)-d)*sign;p.x+=Math.sin(p.a)*ds;p.y-=Math.cos(p.a)*ds;poses.push({...p});d+=Math.abs(ds)}};
 const arc=(radius,turn)=>{const sign=Math.sign(turn),length=Math.abs(turn)*radius,k=sign/radius;for(let d=0;d<length-1e-8;){const ds=Math.min(2,length-d),next=p.a+k*ds;p.x+=(Math.cos(p.a)-Math.cos(next))/k;p.y+=(Math.sin(p.a)-Math.sin(next))/k;p.a=next;poses.push({...p});d+=ds}};
 if(level===3){const theta=Math.acos(1-97/180);arc(90,theta);arc(90,-theta);straight(p.y-def.bay.y)}
 else if(level===4){straight(50);arc(90,Math.PI/2);straight(def.bay.x-p.x)}
 else if(level===8){straight(34);arc(90,-Math.PI/2);straight(p.x-def.bay.x)}
 else straight((def.bay.x-p.x)*Math.sin(p.a)-(def.bay.y-p.y)*Math.cos(p.a));return poses}
return{VEHICLES,LEVELS,corners,overlaps,collision,inBay,create,update,tick,score,restore,legacy,migrate,snapshot,approach,angle};
});
