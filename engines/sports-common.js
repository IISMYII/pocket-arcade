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
