const P=require('../logic/parking.js');
function drive(level,vehicle,difficulty='hard'){
 const s=P.create({level,vehicle,difficulty}),route=P.approach(level),bay=P.LEVELS[level-1].bay,reverse=level===5;let index=0;
 for(let i=0;i<25000&&!s.done;i++){
  let nearest=index,dist=Infinity;for(let k=index;k<Math.min(route.length,index+25);k++){const d=Math.hypot(s.p.x-route[k].x,s.p.y-route[k].y);if(d<dist){dist=d;nearest=k}}index=nearest;
  const look=route[Math.min(route.length-1,index+8)],toEnd=Math.hypot(s.p.x-bay.x,s.p.y-bay.y),heading=P.angle(Math.atan2(look.x-s.p.x,s.p.y-look.y)+(reverse?Math.PI:0));
  let error=P.angle(heading-s.p.a);if(toEnd<8)error=P.angle(bay.a-s.p.a);
  const steer=error*(reverse?-1:1),desired=(toEnd<4?0:toEnd<16?5:26)*(reverse?-1:1);let throttle=0;if(desired-s.p.v>1)throttle=1;else if(desired-s.p.v< -1)throttle=-1;
  if(P.inBay(s.p,P.VEHICLES[vehicle],bay,difficulty)&&toEnd<5)throttle=0;
  P.update(s,{up:throttle===1,down:throttle===-1,right:steer>.018,left:steer<-.018},1/120);
 }
 return s
}
module.exports=drive;
