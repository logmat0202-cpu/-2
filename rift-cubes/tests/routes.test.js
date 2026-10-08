import test from 'node:test';import assert from 'node:assert/strict';import {Puzzle} from '../src/model.js';import {Player} from '../src/player.js';import {levels} from '../src/levels.js';import {flatReachable,navigation} from './navigation.js';
const wait=(m,s)=>{for(let i=0;i<s*60;i++)m.tick(1/60);};
function grip(p,c,a,route){const m=p.model,s=p.solids([c.id,...(c.pair?[c.pair]:[])]);return route.find(([x,z,y])=>{
 if(Math.abs(y-m.height(c.x,c.z))>.1)return false;const d=Math.hypot(x-c.x*2,z-c.z*2);if(d>2.65||d<1.05)return false;
 for(let i=0;i<=12;i++){const xx=x+a.dx*2*i/12,zz=z+a.dz*2*i/12;if(p.blocked(xx,y,zz,s))return false;const tile=m.floor(Math.round(xx/2),Math.round(zz/2));if(!tile||Math.abs(tile.y-y)>.1)return false;if(c.pair){const pair=m.cubes.find(b=>b.id===c.pair);if(p.overlap(xx,zz,{x:pair.x*2-a.dx*2*i/12,z:pair.z*2-a.dz*2*i/12,w:.73,d:.73}))return false;}}
 return true;
});}
for(const level of levels)test(`${level.id}: reachable grips and physical route to portal`,()=>{
 const m=new Puzzle(level),p=new Player(m,{liftMeshes:[]});
 for(const a of level.solution){
  if(a.walk){const route=navigation(p),[x,z,y]=a.walk,point=route.find(([xx,zz,yy])=>Math.hypot(xx-x*2,zz-z*2)<1&&Math.abs(yy-y)<.2);assert.ok(point,'must physically reach the upper workshop');p.pos.set(point[0],point[2],point[1]);}
  if(a.id)for(let n=0;n<a.n;n++){wait(m,.5);const c=m.cubes.find(c=>c.id===a.id);let at=grip(p,c,a,flatReachable(p));if(!at)at=grip(p,c,a,navigation(p));assert.ok(at,`no reachable grip for ${c.id} at (${c.x},${c.z}), move ${a.dx},${a.dz}, robot ${p.pos.toArray()}`);p.release();p.pos.set(at[0],at[2],at[1]);p.yaw=0;p.held=c.id;p.cooldown=0;const expected=[c.x+a.dx,c.z+a.dz];p.update(1/120,new Set(),{x:a.dx,z:a.dz});assert.deepEqual([c.x,c.z],expected,'actual Player drag must execute the move');for(let i=0;i<31;i++)p.update(1/120,new Set());assert.ok(!p.drag);p.release();}
  if(a.rotate)assert.ok(m.rotate(a.rotate));if(a.record!==undefined)m.toggleRecord();if(a.play)assert.ok(m.play());if(a.wait)wait(m,a.wait);m.evaluate();
 }
 assert.ok(m.ready);const y=m.height(...level.portal),near=route=>route.some(([x,z,yy])=>Math.hypot(x-level.portal[0]*2,z-level.portal[1]*2)<1&&Math.abs(yy-y)<.2);assert.ok(near(flatReachable(p))||near(navigation(p)), 'portal must have a walk / cube-jump / lift route');
});
