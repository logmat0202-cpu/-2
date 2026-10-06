export const CELL=2,CUBE_SIZE=1.46;
const clone=x=>JSON.parse(JSON.stringify(x));
const key=(x,z)=>`${x},${z}`;
export class Puzzle {
 constructor(level){this.level=level;this.cubes=clone(level.cubes);this.initial=clone(level.cubes);this.tiles=new Map(level.floors.map(t=>[key(t.x,t.z),t]));this.flags={};this.latched={};this.history=[];this.rays=[];this.powered=new Set();this.clock=0;this.sync=0;this.pulses={a:0,b:0};this.memory=new Set();this.echo={recording:false,playing:false,time:0,playTime:0,duration:0,events:[],start:null,index:0,blocked:false};this.evaluate();}
 tile(x,z){return this.tiles.get(key(x,z));}
 floor(x,z){const t=this.tile(x,z);return t&&(!t.bridge||this.flags[t.bridge])?t:null;}
 height(x,z){return this.tile(x,z)?.y??0;}
 isWall(x,z){return (this.level.walls||[]).some(w=>w.x===x&&w.z===z&&(!w.phase||!this.flags[w.phase]))||(this.level.gates||[]).some(w=>w.x===x&&w.z===z&&!this.all(w.needs));}
 all(a){return (a||[]).every(k=>this.flags[k]);}
 canOccupy(c,x,z,ignore=[]){return !!this.floor(x,z)&&Math.abs(this.height(c.x,c.z)-this.height(x,z))<.2&&!this.isWall(x,z)&&![...(this.level.sources||[]),...(this.level.contacts||[]),...(this.level.lasers||[]),...(this.level.receivers||[])].some(n=>n.x===x&&n.z===z)&&!(this.decorations||[]).some(n=>Math.abs(x*2-n.x)<.9&&Math.abs(z*2-n.z)<.9)&&!this.cubes.some(b=>b.id!==c.id&&!ignore.includes(b.id)&&b.x===x&&b.z===z);}
 snapshot(){return clone({cubes:this.cubes,echo:this.echo,latched:this.latched,sync:this.sync,pulses:this.pulses,memory:[...this.memory]});}
 remember(){this.history.push(this.snapshot());if(this.history.length>100)this.history.shift();}
 undo(){const s=this.history.pop();if(!s)return false;Object.assign(this,s);this.memory=new Set(s.memory);this.echo.recording=false;this.echo.playing=false;this.evaluate();return true;}
 move(id,dx,dz,record=true){if(Math.abs(dx)+Math.abs(dz)!==1)return false;const c=this.cubes.find(c=>c.id===id);if(!c)return false;if(c.type==='echo'&&this.echo.playing)return false;const p=c.pair?this.cubes.find(b=>b.id===c.pair):null;
 if(!this.canOccupy(c,c.x+dx,c.z+dz,p?[p.id]:[]))return false;
 if(p&&(!this.canOccupy(p,p.x-dx,p.z-dz,[c.id])||(p.x-dx===c.x+dx&&p.z-dz===c.z+dz)||(p.x===c.x+dx&&p.z===c.z+dz)))return false;
 if(record)this.remember();c.x+=dx;c.z+=dz;if(p){p.x-=dx;p.z-=dz;}
 if(c.type==='echo'&&this.echo.recording){this.echo.events.push({t:Math.max(.25,this.echo.time),x:c.x,z:c.z});}
 this.evaluate();return true;
 }
 rotate(id){const c=this.cubes.find(c=>c.id===id);if(c?.type!=='reflector')return false;this.remember();c.rot=(c.rot+1)%4;this.evaluate();return true;}
 toggleRecord(){const e=this.echo,c=this.cubes.find(c=>c.type==='echo');if(!c)return false;
 if(e.recording){e.recording=false;e.duration=Math.max(.5,e.time);return true;}
 this.remember();Object.assign(e,{recording:true,playing:false,time:0,playTime:0,duration:0,events:[],start:{x:c.x,z:c.z},index:0,blocked:false});return true;}
 play(){const e=this.echo,c=this.cubes.find(c=>c.type==='echo');if(!c||!e.start||!e.events.length)return false;if(e.recording)this.toggleRecord();
 if(!this.canOccupy(c,e.start.x,e.start.z))return false;this.remember();c.x=e.start.x;c.z=e.start.z;Object.assign(e,{playing:true,recording:false,playTime:0,index:0,blocked:false});this.sync=0;this.pulses={a:0,b:0};this.memory.clear();this.evaluate();return true;}
 resetEcho(){const c=this.cubes.find(c=>c.type==='echo');if(!c)return;this.remember();if(this.echo.start&&this.canOccupy(c,this.echo.start.x,this.echo.start.z))Object.assign(c,this.echo.start);Object.assign(this.echo,{recording:false,playing:false,time:0,playTime:0,duration:0,events:[],start:null,index:0,blocked:false});this.sync=0;this.pulses={a:0,b:0};this.memory.clear();this.evaluate();}
 evaluate(){const f={...this.latched};for(const p of this.level.plates||[])f[p.id]=this.cubes.some(c=>c.x===p.x&&c.z===p.z);
 // Connected-component flood fill through conductor cubes and their adjacent contacts.
 this.powered=new Set();const nodes=[...(this.level.sources||[]),...this.cubes.filter(c=>c.type==='conductor'),...(this.level.contacts||[])];const queue=[...(this.level.sources||[])];for(const n of queue)this.powered.add(n.id);
 while(queue.length){const a=queue.shift();for(const b of nodes)if(!this.powered.has(b.id)&&Math.abs(a.x-b.x)+Math.abs(a.z-b.z)===1&&Math.abs(this.height(a.x,a.z)-this.height(b.x,b.z))<.1){this.powered.add(b.id);queue.push(b);}}
 for(const c of this.level.contacts||[])f[c.id]=this.powered.has(c.id);this.flags=f;
 this.rays=[];for(const r of this.level.receivers||[])f[r.id]=false;
 for(const l of this.level.lasers||[]){if(!this.all(l.needs))continue;let x=l.x,z=l.z,d=l.dir;const seen=new Set();for(let i=0;i<60;i++){const nx=x+[1,0,-1,0][d],nz=z+[0,1,0,-1][d];this.rays.push({x,z,nx,nz});x=nx;z=nz;if(!this.tile(x,z)||this.isWall(x,z))break;const rec=(this.level.receivers||[]).find(r=>r.x===x&&r.z===z);if(rec){f[rec.id]=true;break;}const c=this.cubes.find(c=>c.x===x&&c.z===z);if(c){if(c.type!=='reflector')break;d=(c.rot%2===0?[3,2,1,0]:[1,0,3,2])[d];}const k=`${x},${z},${d}`;if(seen.has(k))break;seen.add(k);}}
 for(const latch of this.level.latches||[])if(this.all(latch.needs)){this.latched[latch.id]=true;f[latch.id]=true;}
 f.pulseA=this.pulses.a>0;f.pulseB=this.pulses.b>0;f.memory=this.memory.size>=2;f.sync=!!this.latched.sync;
 this.ready=this.all(this.level.requires);return f;
 }
 tick(dt){this.clock+=dt;const e=this.echo,c=this.cubes.find(c=>c.type==='echo');if(e.recording){e.time+=dt;if(e.time>=12)this.toggleRecord();}
 if(e.playing&&c){e.playTime+=dt;while(e.index<e.events.length&&e.playTime>=e.events[e.index].t){const p=e.events[e.index];if(this.canOccupy(c,p.x,p.z)&&(!this.canReplay||this.canReplay(c,p.x,p.z))){c.x=p.x;c.z=p.z;e.index++;e.blocked=false;}else{e.blocked=true;e.playTime=Math.min(e.playTime,p.t);break;}}
 if(e.playTime>e.duration+5){if(this.canOccupy(c,e.start.x,e.start.z)&&(!this.canReplay||this.canReplay(c,e.start.x,e.start.z))){Object.assign(c,e.start);e.playTime=0;e.index=0;e.blocked=false;}else e.blocked=true;}}
 this.evaluate();const rule=this.level.echoRule;this.pulses.a=Math.max(0,this.pulses.a-dt);this.pulses.b=Math.max(0,this.pulses.b-dt);
 if(rule&&e.playing){if(this.flags[rule.a]){this.pulses.a=rule.hold;this.memory.add('a');}if(this.flags[rule.b]){this.pulses.b=rule.hold;this.memory.add('b');}}
 const s=this.level.syncRule;if(s&&!this.latched.sync){if(e.playing&&this.all(s.needs)){this.sync+=dt;if(this.sync>=s.duration){this.sync=s.duration;this.latched.sync=true;}}else this.sync=0;}
 this.evaluate();
 }
}
