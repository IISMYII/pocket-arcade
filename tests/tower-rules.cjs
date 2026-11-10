'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../logic/tower.js');
const {strategy,run}=require('./tower-balance.cjs');
const snapshot=s=>M.snapshot(s);
function seededEncounter(){const s=M.create({difficulty:'medium',level:1});M.build(s,'projectile',0,2);M.build(s,'projectile',1,2);M.build(s,'projectile',1,4);M.launch(s);const type=M.roster(1)[0],max=M.enemyHealth(type,1,'medium',1);s.enemies=[{id:1001,type,wave:1,d:0,hp:.01,max,slow:0}];s.spawned=1;s.spawnClock=1;return s}
function completeCurrent(s){let ticks=0;while(s.active&&ticks++<20000)M.step(s,.05);assert.ok(ticks<20000,'wave terminates')}
function numericState(s){const c=snapshot(s);delete c.accumulator;for(const e of c.enemies)for(const k of ['d','hp','slow'])e[k]=Math.round(e[k]*1e7)/1e7;for(const t of c.towers)t.cool=Math.round(t.cool*1e7)/1e7;c.spawnClock=Math.round(c.spawnClock*1e7)/1e7;return c}

test('formula examples: suggested tier multipliers and explicit double rounding',()=>{
 assert.equal(M.killValue('basic',1,'medium'),10);
 assert.equal(M.killValue('fast',1,'medium'),12);
 assert.equal(M.killValue('armored',3,'medium'),20);
 assert.equal(M.killValue('armored',3,'easy'),16);
 assert.equal(M.killValue('armored',3,'hard'),26);
 assert.equal(M.killValue('boss',4,'medium'),68);
 assert.equal(M.killValue('boss',4,'hard'),88);
 assert.equal(M.waveValue(3,12,'medium'),155);
 assert.equal(M.waveValue(3,12,'easy'),124);
 assert.equal(M.waveValue(3,12,'hard'),202);
});
test('enemy health scales by wave, difficulty and map',()=>{
 assert.equal(M.enemyHealth('basic',1,'medium',1),40);
 assert.equal(M.enemyHealth('basic',2,'medium',1),40*1.16);
 assert.equal(M.enemyHealth('boss',4,'hard',3),1000*1.48*1.32*1.2);
 assert.ok(M.enemyHealth('elite',8,'easy',1)<M.enemyHealth('elite',8,'hard',1));
});
test('three distinct paths are contiguous, non-self-intersecting, bounded and have usable grass',()=>{
 const seen=new Set();for(let level=1;level<=3;level++){const s=M.create({level}),m=M.map(s);assert.ok(!seen.has(JSON.stringify(m.path)));seen.add(JSON.stringify(m.path));assert.equal(new Set(m.path.map(p=>p.join(','))).size,m.path.length);m.path.forEach((p,i)=>{assert.ok(p.every(n=>n>=0&&n<8));if(i)assert.equal(Math.abs(p[0]-m.path[i-1][0])+Math.abs(p[1]-m.path[i-1][1]),1)});let buildable=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(M.canBuild(s,x,y))buildable++;assert.ok(buildable>=35)}
});
test('six towers and six enemies have meaningful different roles',()=>{
 assert.equal(Object.keys(M.TOWERS).length,6);assert.equal(Object.keys(M.ENEMIES).length,6);
 assert.ok(M.TOWERS.rapid.interval<M.TOWERS.projectile.interval);assert.ok(M.TOWERS.longrange.range>M.TOWERS.projectile.range);assert.ok(M.TOWERS.heavy.damage>M.TOWERS.projectile.damage);assert.ok(M.TOWERS.splash.splash>0);assert.ok(M.TOWERS.slow.slow<1);assert.ok(M.ENEMIES.fast.speed>M.ENEMIES.basic.speed);assert.ok(M.ENEMIES.armored.armor>M.ENEMIES.basic.armor);assert.ok(M.ENEMIES.boss.hp>M.ENEMIES.elite.hp);
});
test('armor, piercing, rapid fire and slowing affect actual combat',()=>{
 const bolt={type:'projectile',level:1},prism={type:'longrange',level:1};assert.equal(M.damageValue(bolt,'armored'),13*(1-.55));assert.equal(M.damageValue(prism,'armored'),32*(1-.55*(1-.65)));assert.ok(M.damageValue(prism,'armored')/32>M.damageValue(bolt,'armored')/13);
 function encounter(type){const s=M.create({difficulty:'easy'});M.build(s,type,1,2);M.launch(s);s.spawnClock=1;s.spawned=1;s.enemies=[{id:1001,type:'boss',wave:1,d:1,hp:10000,max:10000,slow:0}];let shots=0;for(let i=0;i<120;i++)shots+=M.step(s,1/120).filter(e=>e.type==='shot').length;return{s,shots}}
 const rapid=encounter('rapid'),slow=encounter('slow'),boltFight=encounter('projectile');assert.ok(rapid.shots>boltFight.shots);assert.ok(slow.s.enemies[0].slow>0);assert.ok(slow.s.enemies[0].d<boltFight.s.enemies[0].d);
});
test('build refuses path, water, duplicate, invalid type and insufficient funds atomically',()=>{
 const s=M.create(),original=s.gold;assert.equal(M.build(s,'projectile',0,3).ok,false);assert.equal(M.build(s,'projectile',0,0).ok,false);assert.equal(M.build(s,'bogus',3,3).ok,false);assert.equal(s.gold,original);assert.ok(M.build(s,'projectile',1,2).ok);const after=s.gold;assert.equal(M.build(s,'projectile',1,2).ok,false);assert.equal(s.gold,after);while(s.gold>=M.TOWERS.heavy.cost){const spot=[[2,2],[3,2],[4,2]].find(([x,y])=>M.canBuild(s,x,y));if(!spot)break;M.build(s,'heavy',...spot)}const poor=s.gold;assert.equal(M.build(s,'heavy',6,2).ok,false);assert.equal(s.gold,poor);assert.ok(M.validate(s));
});
test('upgrade costs, damage and cooldown scale, max level and selling cannot mint currency',()=>{
 const s=M.create({difficulty:'easy'}),built=M.build(s,'projectile',1,2).tower;assert.equal(M.upgradeCost(built),56);assert.ok(M.upgrade(s,built.id).ok);assert.equal(built.level,2);assert.equal(M.stats(built).damage,13*1.7);assert.ok(M.stats(built).interval<M.TOWERS.projectile.interval);assert.equal(M.upgradeCost(built),77);assert.ok(M.upgrade(s,built.id).ok);assert.equal(M.upgradeCost(built),null);const before=s.gold;assert.equal(M.upgrade(s,built.id).ok,false);assert.equal(s.gold,before);const invested=built.invested;const sale=M.sell(s,built.id);assert.equal(sale.refund,Math.floor(invested*.6));assert.equal(M.sell(s,built.id).ok,false);assert.ok(s.gold<M.DIFFICULTY.easy.gold);assert.ok(M.validate(s));
 for(let i=0;i<20;i++){const t=M.build(s,'projectile',1,2);if(!t.ok)break;M.sell(s,t.tower.id)}assert.ok(s.gold<=M.DIFFICULTY.easy.gold);assert.ok(M.validate(s));
});
test('one defeated enemy yields exactly one integer kill score/reward across simultaneous towers',()=>{
 const s=seededEncounter(),before=s.gold,events=M.step(s,.02),kills=events.filter(e=>e.type==='kill');assert.equal(kills.length,1);const kind=M.roster(1)[0];assert.equal(s.points,M.killValue(kind,1,'medium'));assert.equal(s.gold,before+M.ENEMIES[kind].gold);assert.equal(s.kills,1);const points=s.points;for(let i=0;i<10;i++)M.step(s,.01);assert.equal(s.points,points);assert.equal(s.kills,1);assert.ok(M.validate(s));
});
test('killed/escaped entities are excluded from future targeting and projectile rewards',()=>{
 const s=seededEncounter();M.step(s,.02);assert.equal(s.enemies.length,0);assert.equal(s.resolved.length,1);const after=snapshot(s);const restored=M.restore(after,s.options);assert.ok(M.validate(restored));for(let i=0;i<10;i++)M.step(restored,.01);assert.equal(restored.kills,1);assert.equal(restored.points,after.points);
});
test('wave rosters progressively introduce types and bosses exactly every fourth wave',()=>{
 assert.ok(!M.roster(1).includes('armored'));assert.ok(M.roster(3).includes('armored'));assert.ok(M.roster(5).includes('strong'));assert.ok(M.roster(8).includes('elite'));for(let w=1;w<=12;w++)assert.equal(M.roster(w).filter(v=>v==='boss').length,w%4===0?1:0);
});
test('launch and wave-completion bonus are idempotent before and after reload',()=>{
 const s=M.create();strategy(s);assert.equal(M.launch(s),true);assert.equal(M.launch(s),false);completeCurrent(s);const p=s.points,g=s.gold,w=s.wavePoints;assert.equal(s.completedWave,1);for(let i=0;i<100;i++)M.step(s,.05);assert.equal(s.points,p);assert.equal(s.gold,g);assert.equal(s.wavePoints,w);const copy=M.restore(snapshot(s),s.options);assert.ok(M.validate(copy));M.step(copy,1);assert.equal(copy.points,p);assert.equal(copy.gold,g);assert.equal(copy.ledger.length,1);assert.ok(M.launch(copy));assert.equal(M.launch(copy),false);
});
test('mid-wave reload preserves every reward exactly and resumes deterministic play',()=>{
 const s=M.create({difficulty:'hard',level:2});strategy(s);M.launch(s);for(let i=0;i<150;i++)M.step(s,.02);assert.ok(M.validate(s));const restored=M.restore(snapshot(s),s.options);for(let i=0;i<1000;i++){M.step(s,.02);M.step(restored,.02)}assert.deepEqual(snapshot(s),snapshot(restored));assert.ok(M.validate(restored));
});
test('fixed-step simulation agrees at 30, 60 and 120 display frame rates',()=>{
 const results=[30,60,120].map(fps=>{const s=M.create({difficulty:'medium'});strategy(s);M.launch(s);for(let i=0;i<fps*8;i++)M.step(s,1/fps);return numericState(s)});assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
});
test('corrupted score, enemy health, ledger, duplicate IDs and currency are rejected',()=>{
 const s=M.create();strategy(s);M.launch(s);for(let i=0;i<50;i++)M.step(s,.02);const good=snapshot(s);assert.ok(M.validate(good));for(const mutate of [x=>x.points++,x=>x.gold++,x=>x.enemies[0].max++,x=>x.enemies.push({...x.enemies[0]}),x=>x.towers.push({...x.towers[0]}),x=>x.health++,x=>x.refunds+=100,x=>x.accumulator=Infinity]){const bad=snapshot(good);mutate(bad);assert.equal(M.validate(bad),null)}
 completeCurrent(s);for(const mutate of [x=>x.ledger[0].bonus++,x=>x.completedWave++,x=>x.ledger[0].health--,x=>x.ledger[0].kills.basic++]){const bad=snapshot(s);mutate(bad);assert.equal(M.validate(bad),null)}
});
test('invalid dt has no simulation effect and defeat is terminal without completion reward',()=>{
 const s=M.create({difficulty:'hard'});const before=snapshot(s);M.step(s,NaN);M.step(s,-1);M.step(s,3);assert.deepEqual(snapshot(s),before);while(s.status!=='lost'){assert.ok(M.launch(s));completeCurrent(s)}const terminal=snapshot(s);assert.equal(s.health,0);assert.ok(M.validate(s));assert.equal(M.launch(s),false);M.step(s,2);assert.deepEqual(numericState(s),numericState(terminal));
});
test('valid V2 tower/gold migration preserves assets and old records without inventing score',()=>{
 const old={towers:[{x:1,y:2,cool:.1},{x:3,y:4,cool:0}],coins:417,lives:7,wave:9,enemies:[],spawns:0,going:false};const migrated=M.migrate(old,{difficulty:'medium',level:1});assert.ok(M.validate(migrated));assert.equal(migrated.gold,417);assert.equal(migrated.towers.length,2);assert.equal(migrated.points,0);assert.equal(migrated.wave,0);assert.equal(migrated.migration.legacyWave,9);assert.equal(old.coins,417);assert.equal(M.migrate({...old,coins:-1},{}),null);
});
test('V2 migration relocates blocked lots and redeems excess towers without losing their value',()=>{
 const old={towers:[],coins:125,lives:10,wave:5,enemies:[],spawns:0,going:false};for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(!M.MAPS[0].path.some(p=>p[0]===x&&p[1]===y))old.towers.push({x,y,cool:0});const s=M.migrate(old,{difficulty:'medium',level:1});assert.ok(M.validate(s));assert.equal(s.towers.length+s.migration.redeemed,old.towers.length);assert.equal(s.gold,125+s.migration.redeemed*M.TOWERS.projectile.cost);assert.ok(s.migration.relocated>0);assert.equal(M.migrate({...old,towers:[old.towers[0],old.towers[0]]},{}),null);
});
test('all three campaigns are winnable at every difficulty with a legal mixed-tower strategy',()=>{
 for(const difficulty of ['easy','medium','hard'])for(let level=1;level<=3;level++){const s=run(level,difficulty);assert.equal(s.status,'won',difficulty+' map '+level);assert.equal(s.completedWave,12);assert.equal(s.ledger.length,12);assert.ok(s.points>0&&Number.isInteger(s.points));assert.ok(M.validate(s));assert.ok(M.stars(s)>=1);assert.equal(M.launch(s),false)}
});
