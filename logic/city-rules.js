/* Verdant City V3: deterministic, integer-currency economy. No network or dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CityRules=api})(globalThis,function(){
 'use strict';
 const VERSION=3,MAX_LEVEL=5,MAX_MONEY=1e12,MAX_TIME=8640000000000000,OFFLINE_CAP=8*3600;
 const definitions=Object.freeze({
  house:{name:'House',cost:60,income:.60,pop:8,jobs:0,amenity:0,requires:0,art:'house',role:'Affordable homes and a small rental income.'},
  shop:{name:'Market',cost:100,income:2.20,pop:2,jobs:6,amenity:0,requires:0,art:'shop',role:'Local jobs and dependable commercial income.'},
  park:{name:'Garden',cost:80,income:.15,pop:0,jobs:0,amenity:12,requires:0,art:'park',role:'Public space improves occupancy and all city income.'},
  apartment:{name:'Apartments',cost:260,income:1.60,pop:24,jobs:0,amenity:0,requires:40,art:'house',role:'Dense housing unlocks the larger city milestones.'},
  workshop:{name:'Workshop',cost:360,income:5.40,pop:4,jobs:14,amenity:0,requires:70,art:'shop',role:'Industry provides many jobs and strong income.'},
  civic:{name:'Civic hall',cost:520,income:2.50,pop:6,jobs:4,amenity:25,requires:110,art:'park',role:'A civic landmark that supports a dense district.'}
 });
 const goals={population:[20,60,120,240],income:[300,1000,2500,5000]}; // income in cents / second
 const rewards=[7500,15000,30000,60000];
 const achievementIds=['first-building','district','six-specialties','master-builder','population-120','income-25'];
 const rewardIds=Object.keys(goals).flatMap(k=>goals[k].map((_,i)=>k+':'+i));
 const integer=(n,min=0,max=MAX_MONEY)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const time=n=>integer(n,0,MAX_TIME);
 const safeAdd=(a,b)=>Math.max(0,Math.min(MAX_MONEY,Math.floor(a+b)));
 function options(v={}){return {mode:v.mode==='growth'?'growth':'balanced',objective:v.objective==='income'?'income':'population'}}
 function fresh(now=Date.now()){now=time(now)?now:0;return {version:VERSION,coins:24000,tiles:Array(25).fill(null),fraction:0,clock:{last:now,highWater:now},stats:{built:0,upgraded:0,sold:0,earned:0,playedMs:0},rewards:[],achievements:[]}}
 function isValid(v){return !!(v&&v.version===VERSION&&integer(v.coins)&&Array.isArray(v.tiles)&&v.tiles.length===25&&v.tiles.every(t=>t===null||(t&&Object.hasOwn(definitions,t.type)&&integer(t.level,1,MAX_LEVEL)&&integer(t.invested,1)))&&Number.isFinite(v.fraction)&&v.fraction>=0&&v.fraction<1&&v.clock&&time(v.clock.last)&&time(v.clock.highWater)&&v.clock.highWater>=v.clock.last&&v.stats&&['built','upgraded','sold','earned','playedMs'].every(k=>integer(v.stats[k]))&&Array.isArray(v.rewards)&&v.rewards.length<=rewardIds.length&&new Set(v.rewards).size===v.rewards.length&&v.rewards.every(k=>rewardIds.includes(k))&&Array.isArray(v.achievements)&&v.achievements.length<=achievementIds.length&&new Set(v.achievements).size===v.achievements.length&&v.achievements.every(k=>achievementIds.includes(k)))}
 function snapshot(state){return JSON.parse(JSON.stringify(state))}
 function restore(v){return isValid(v)?{valid:true,state:snapshot(v),migrated:false,notes:[]}:{valid:false,state:null,migrated:false,notes:['Saved city is invalid.']}}
 function migrate(v,now=Date.now()){
  if(v?.version===VERSION)return restore(v);
  if(!v||!Number.isFinite(v.coins)||v.coins<0||!time(v.last)||!Array.isArray(v.tiles)||v.tiles.length!==25||!v.tiles.every(t=>t===null||(t&&['house','shop','park'].includes(t.type)&&integer(t.level,1,999999))))return {valid:false,state:null,migrated:false,notes:[]};
  const state=fresh(now),notes=[];state.coins=Math.min(MAX_MONEY,Math.round(v.coins*100));state.clock.last=v.last;state.clock.highWater=v.last;
  const oldCosts={house:40,shop:85,park:65};
  state.tiles=v.tiles.map((t,i)=>{if(!t)return null;const level=Math.min(MAX_LEVEL,t.level),oldInvested=Math.min(MAX_MONEY,Math.round(oldCosts[t.type]*(1+t.level*(t.level-1)/2)*100));
   if(t.level>MAX_LEVEL){const retained=oldCosts[t.type]*(1+MAX_LEVEL*(MAX_LEVEL-1)/2)*100;state.coins=safeAdd(state.coins,Math.floor((oldInvested-retained)/2));notes.push('Lot '+(i+1)+' retained at level 5; excess legacy upgrades refunded at 50%.')}
   return {type:t.type,level,invested:Math.min(MAX_MONEY,Math.round(oldCosts[t.type]*(1+level*(level-1)/2)*100))}});
  state.stats.built=state.tiles.filter(Boolean).length;notes.unshift('Original pa_city save remains untouched.');return {valid:true,state,migrated:true,notes};
 }
 function metrics(state,opts={}){
  opts=options(opts);let capacity=0,jobs=0,amenities=0,baseIncome=0,occupied=0;const types=new Set();
  for(const tile of state.tiles){if(!tile)continue;const d=definitions[tile.type];occupied++;types.add(tile.type);capacity+=d.pop*tile.level;jobs+=d.jobs*tile.level;amenities+=d.amenity*tile.level;baseIncome+=d.income*100*Math.pow(tile.level,1.18)}
  const services=capacity?Math.min(1,amenities/(capacity*.4)):0,employment=capacity?Math.min(1,jobs/(capacity*.35)):0;
  const occupancy=.8+.12*services+.08*employment,population=Math.floor(capacity*occupancy*(opts.mode==='growth'?1.2:1));
  const income=Math.max(0,Math.round(baseIncome*(.7+.2*employment+.1*services)*(opts.mode==='growth'?.85:1)));
  return {population,income,capacity,jobs,amenities,occupied,types:types.size,satisfaction:Math.round(occupancy*100)};
 }
 // A single point unit across population/income objectives and both economy modes.
 function score(state,opts={}){const m=metrics(state,opts);return Math.min(MAX_MONEY,Math.floor(10*m.population+m.income/4+100*state.achievements.length))}
 function countType(state,type){return state.tiles.filter(t=>t?.type===type).length}
 function buildCost(state,type){const d=definitions[type];return d?Math.min(MAX_MONEY,Math.round(d.cost*100*Math.pow(1.12,countType(state,type)))):null}
 function upgradeCost(tile){return tile&&definitions[tile.type]&&tile.level<MAX_LEVEL?Math.round(definitions[tile.type].cost*100*.8*Math.pow(1.65,tile.level-1)):null}
 function unlocked(state,type,opts={}){return !!definitions[type]&&metrics(state,opts).population>=definitions[type].requires}
 function collectObjectives(state,opts={}){
  const m=metrics(state,opts),objective=options(opts).objective,awards=[];
  goals[objective].forEach((target,i)=>{const id=objective+':'+i;if(m[objective]>=target&&!state.rewards.includes(id)){state.rewards.push(id);state.coins=safeAdd(state.coins,rewards[i]);awards.push({id,reward:rewards[i],target})}});
  const earned=[['first-building',m.occupied>=1],['district',m.occupied===25],['six-specialties',m.types===6],['master-builder',state.tiles.some(t=>t?.level===MAX_LEVEL)],['population-120',m.population>=120],['income-25',m.income>=2500]];
  for(const [id,yes]of earned)if(yes&&!state.achievements.includes(id))state.achievements.push(id);
  return awards;
 }
 function nextGoal(state,opts={}){const objective=options(opts).objective,index=goals[objective].findIndex((_,i)=>!state.rewards.includes(objective+':'+i));return index<0?null:{objective,index,target:goals[objective][index],reward:rewards[index],value:metrics(state,opts)[objective]}}
 function failed(reason){return {ok:false,reason,awards:[]}}
 function build(state,index,type,opts={}){if(!integer(index,0,24)||state.tiles[index])return failed('Choose an empty lot.');if(!definitions[type])return failed('Unknown building.');if(!unlocked(state,type,opts))return failed('Requires '+definitions[type].requires+' residents.');const cost=buildCost(state,type);if(state.coins<cost)return failed('Need $'+(cost/100).toFixed(2)+'.');state.coins-=cost;state.tiles[index]={type,level:1,invested:cost};state.stats.built=safeAdd(state.stats.built,1);return {ok:true,cost,awards:collectObjectives(state,opts)}}
 function upgrade(state,index,opts={}){const tile=state.tiles[index];if(!integer(index,0,24)||!tile)return failed('Select a building.');const cost=upgradeCost(tile);if(cost===null)return failed('Maximum level 5 reached.');if(state.coins<cost)return failed('Need $'+(cost/100).toFixed(2)+'.');state.coins-=cost;tile.level++;tile.invested=safeAdd(tile.invested,cost);state.stats.upgraded=safeAdd(state.stats.upgraded,1);return {ok:true,cost,awards:collectObjectives(state,opts)}}
 function sell(state,index){if(!integer(index,0,24)||!state.tiles[index])return failed('Select a building.');const refund=Math.floor(state.tiles[index].invested*.5);state.coins=safeAdd(state.coins,refund);state.tiles[index]=null;state.stats.sold=safeAdd(state.stats.sold,1);return {ok:true,refund,awards:[]}}
 function earn(state,seconds,opts={}){const amount=metrics(state,opts).income*seconds+state.fraction,whole=Math.floor(amount);state.fraction=amount-whole;const before=state.coins;state.coins=safeAdd(state.coins,whole);const credited=state.coins-before;state.stats.earned=safeAdd(state.stats.earned,credited);return credited}
 function tick(state,dt,opts={}){if(!Number.isFinite(dt)||dt<=0)return {earned:0,awards:[]};dt=Math.min(1,dt);state.stats.playedMs=safeAdd(state.stats.playedMs,Math.round(dt*1000));const earned=earn(state,dt,opts);return {earned,awards:collectObjectives(state,opts)}}
 function accrueOffline(state,now=Date.now(),opts={}){
  if(!time(now))return {earned:0,seconds:0,clockWarning:true,awards:[]};
  // Never move the credited watermark backwards. Reopening or rolling back a clock cannot repay an interval.
  const elapsed=Math.max(0,now-state.clock.highWater),seconds=Math.min(OFFLINE_CAP,elapsed/1000),clockWarning=now<state.clock.highWater||elapsed>31*86400000;
  // Extreme future jumps are not treated as trustworthy absence; active play still earns normally.
  const allowed=elapsed>31*86400000?0:seconds,earned=earn(state,allowed,opts);
  state.clock.highWater=Math.max(state.clock.highWater,now);state.clock.last=Math.min(now,state.clock.highWater);
  return {earned,seconds:allowed,clockWarning,awards:collectObjectives(state,opts)};
 }
 function stamp(state,now=Date.now()){if(time(now)){state.clock.highWater=Math.max(state.clock.highWater,now);state.clock.last=now}return state}
 return {VERSION,MAX_LEVEL,MAX_MONEY,OFFLINE_CAP,definitions,goals,rewards,options,fresh,isValid,snapshot,restore,migrate,metrics,score,buildCost,upgradeCost,unlocked,collectObjectives,nextGoal,build,upgrade,sell,tick,accrueOffline,stamp};
});
