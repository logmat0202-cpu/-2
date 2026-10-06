import * as THREE from 'three';
import {CUBE_SIZE} from './model.js';
export class Player{
 constructor(model,world){this.model=model;this.world=world;this.pos=new THREE.Vector3(model.level.spawn[0]*2,model.height(...model.level.spawn),model.level.spawn[1]*2);this.velY=0;this.grounded=false;this.facing=0;this.moving=false;this.safe=this.pos.clone();this.held=null;this.drag=null;this.cooldown=0;this.radius=.3;this.height=1.68;this.yaw=.3;this.pitch=.62;this.distance=10;this.falls=0;this.jumpQueued=false;this.releaseAfterDrag=false;this.onMessage=()=>{};}
 solids(ignore=[]){const m=this.model,a=[];for(const t of m.level.floors)if(!t.bridge||m.flags[t.bridge])a.push({x:t.x*2,z:t.z*2,w:1,d:1,b:t.y-.58,t:t.y,floor:true});
 for(const w of m.level.walls||[])if(!w.phase||!m.flags[w.phase])a.push({x:w.x*2,z:w.z*2,w:.96,d:.96,b:m.height(w.x,w.z),t:m.height(w.x,w.z)+w.h});
 for(const w of m.level.gates||[])if(!m.all(w.needs))a.push({x:w.x*2,z:w.z*2,w:.94,d:.2,b:m.height(w.x,w.z),t:m.height(w.x,w.z)+3});
 for(const n of [...(m.level.sources||[]),...(m.level.contacts||[]),...(m.level.lasers||[]),...(m.level.receivers||[])])a.push({x:n.x*2,z:n.z*2,w:.35,d:.35,b:m.height(n.x,n.z),t:m.height(n.x,n.z)+1.15});for(const n of m.decorations||[])a.push({x:n.x,z:n.z,w:.13,d:.13,b:n.y,t:n.y+1.3});
 for(const c of m.cubes)if(!ignore.includes(c.id))a.push({x:c.x*2,z:c.z*2,w:CUBE_SIZE/2,d:CUBE_SIZE/2,b:m.height(c.x,c.z),t:m.height(c.x,c.z)+CUBE_SIZE,cube:c.id});
 for(const l of this.world.liftMeshes)a.push({x:l.lift.x*2,z:l.lift.z*2,w:.95,d:.95,b:l.height-.12,t:l.height+.12,lift:true});return a;}
 overlap(x,z,s,r=this.radius){const dx=Math.max(Math.abs(x-s.x)-s.w,0),dz=Math.max(Math.abs(z-s.z)-s.d,0);return dx*dx+dz*dz<r*r;}
 blocked(x,y,z,solids){return solids.some(s=>y<s.t-.06&&y+this.height>s.b+.08&&this.overlap(x,z,s));}
 nearest(){const near=this.model.cubes.filter(c=>Math.hypot(c.x*2-this.pos.x,c.z*2-this.pos.z)<2.8&&Math.abs(this.pos.y-this.model.height(c.x,c.z))<.9);near.sort((a,b)=>Math.hypot(a.x*2-this.pos.x,a.z*2-this.pos.z)-Math.hypot(b.x*2-this.pos.x,b.z*2-this.pos.z));return near.find(c=>{const solids=this.solids([c.id]);const target=new THREE.Vector3(c.x*2,this.pos.y,c.z*2),dir=target.clone().sub(this.pos);for(let i=.15;i<.85;i+=.15)if(this.blocked(this.pos.x+dir.x*i,this.pos.y,this.pos.z+dir.z*i,solids))return false;return true;});}
 grab(){if(this.drag){this.releaseAfterDrag=true;return;}if(this.held){this.held=null;return;}const c=this.nearest();if(c){if(c.type==='echo'&&this.model.echo.playing){this.onMessage('Эхо движется само. Нажмите C для сброса записи.');return;}this.held=c.id;this.onMessage(c.type==='reflector'?'Q — повернуть зеркало. E — отпустить.':'WASD — перемещать куб. E — отпустить.');}else this.onMessage('Подойдите ближе к кубу.');}
 queueJump(){if(!this.held)this.jumpQueued=true;}
 release(){if(this.drag)this.pos.copy(this.drag.to);this.held=null;this.drag=null;this.releaseAfterDrag=false;}
 update(dt,keys,analog={x:0,z:0}){this.cooldown=Math.max(0,this.cooldown-dt);let vx=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+analog.x,vz=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)+analog.z;const len=Math.hypot(vx,vz);if(len>1){vx/=len;vz/=len;}const dx=vx*Math.cos(this.yaw)+vz*Math.sin(this.yaw),dz=-vx*Math.sin(this.yaw)+vz*Math.cos(this.yaw);this.moving=!!len;
 if(this.drag){this.drag.time+=dt;const t=Math.min(1,this.drag.time/.23);const ease=t*t*(3-2*t);this.pos.lerpVectors(this.drag.from,this.drag.to,ease);if(t>=1){this.drag=null;if(this.releaseAfterDrag){this.held=null;this.releaseAfterDrag=false;}}return;}
 if(this.held){const c=this.model.cubes.find(c=>c.id===this.held);if(!c){this.held=null;return;}if(len>.25&&this.cooldown<=0){const mx=Math.abs(dx)>Math.abs(dz)?Math.sign(dx):0,mz=mx?0:Math.sign(dz);const target=this.pos.clone().add(new THREE.Vector3(mx*2,0,mz*2));let allowed=true;const ignore=[c.id];if(c.pair)ignore.push(c.pair);const solids=this.solids(ignore);for(let i=1;i<=12;i++)if(this.blocked(this.pos.x+mx*2*i/12,this.pos.y,this.pos.z+mz*2*i/12,solids)){allowed=false;break;}
 const nextFloor=this.model.floor(Math.round(target.x/2),Math.round(target.z/2));if(!nextFloor||Math.abs(nextFloor.y-this.pos.y)>.35)allowed=false;
 if(c.pair){const p=this.model.cubes.find(x=>x.id===c.pair);for(let i=1;i<=12;i++){const s={x:p.x*2-mx*2*i/12,z:p.z*2-mz*2*i/12,w:CUBE_SIZE/2,d:CUBE_SIZE/2};if(this.overlap(this.pos.x+mx*2*i/12,this.pos.z+mz*2*i/12,s))allowed=false;}}
 if(allowed&&this.model.move(c.id,mx,mz)){this.drag={from:this.pos.clone(),to:target,time:0};this.cooldown=.42;this.facing=Math.atan2(-dx,-dz);this.onMove?.();}else{this.cooldown=.3;this.onMessage('Путь закрыт. Отпустите куб и зайдите с другой стороны.');}}
 return;}
 const solids=this.solids();const speed=4.7;for(let step=0;step<2;step++){const sub=dt/2;const nx=this.pos.x+dx*speed*sub,nz=this.pos.z+dz*speed*sub;if(!this.blocked(nx,this.pos.y,this.pos.z,solids))this.pos.x=nx;if(!this.blocked(this.pos.x,this.pos.y,nz,solids))this.pos.z=nz;
 if(this.jumpQueued&&this.grounded){this.velY=8.5;this.grounded=false;this.onJump?.();}this.jumpQueued=false;
 const old=this.pos.y;this.velY-=21*sub;this.pos.y+=this.velY*sub;this.grounded=false;
 for(const s of solids){if(!this.overlap(this.pos.x,this.pos.z,s,.22))continue;if(this.velY<=0&&old>=s.t-.13&&this.pos.y<=s.t){this.pos.y=s.t;this.velY=0;this.grounded=true;}else if(this.velY>0&&old+this.height<=s.b+.05&&this.pos.y+this.height>=s.b){this.pos.y=s.b-this.height;this.velY=0;}}
 // A rising lift carries the robot even between discrete gravity steps.
 for(const s of solids)if(s.lift&&this.overlap(this.pos.x,this.pos.z,s,.1)&&Math.abs(this.pos.y-s.t)<.16&&this.velY<=0){this.pos.y=s.t;this.velY=0;this.grounded=true;}
 }
 if(len){const angle=Math.atan2(-dx,-dz);this.facing+=Math.atan2(Math.sin(angle-this.facing),Math.cos(angle-this.facing));}
 const tile=this.model.floor(Math.round(this.pos.x/2),Math.round(this.pos.z/2));if(this.grounded&&tile&&!tile.bridge&&Math.abs(this.pos.y-tile.y)<.06&&!this.blocked(this.pos.x,this.pos.y,this.pos.z,solids))this.safe.copy(this.pos);
 if(this.pos.y< -10){this.pos.copy(this.safe);if(this.blocked(this.pos.x,this.pos.y,this.pos.z,solids)){this.pos.set(this.model.level.spawn[0]*2,this.model.height(...this.model.level.spawn),this.model.level.spawn[1]*2);}this.velY=0;this.falls++;this.onMessage('Робот вернулся на безопасное место. Кубы на месте.');}
 }
 camera(dt){const target=this.pos.clone().add(new THREE.Vector3(0,1.25,0)),offset=new THREE.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch));let dist=this.distance;const ray=new THREE.Ray(target,offset);for(const s of this.solids()){const b=new THREE.Box3(new THREE.Vector3(s.x-s.w-.12,s.b-.08,s.z-s.d-.12),new THREE.Vector3(s.x+s.w+.12,s.t+.1,s.z+s.d+.12));const hit=ray.intersectBox(b,new THREE.Vector3());if(hit){const d=target.distanceTo(hit)-.2;if(d>.7)dist=Math.min(dist,d);}}
 const desired=target.clone().addScaledVector(offset,Math.max(1.25,dist));this.world.camera.position.lerp(desired,1-Math.exp(-dt*12));this.world.camera.lookAt(target);}
}
