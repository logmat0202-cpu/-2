// Use Player collision boxes, jump velocity / gravity, and activated lift travel.
export function flatReachable(p){
 const solids=p.solids(),m=p.model,y=p.pos.y,queue=[[Math.round(p.pos.x*2),Math.round(p.pos.z*2)]],seen=new Map(),key=(x,z)=>x+','+z;seen.set(key(...queue[0]),queue[0]);
 for(let head=0;head<queue.length;head++){const[x,z]=queue[head];for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,k=key(a,b);if(seen.has(k))continue;const t=m.floor(Math.round(a/4),Math.round(b/4));if(!t||Math.abs(t.y-y)>.1||p.blocked(a/2,y,b/2,solids))continue;seen.set(k,[a,b]);queue.push([a,b]);}}
 return [...seen.values()].map(([x,z])=>[x/2,z/2,y]);
}
export function navigation(p){
 const solids=p.solids(),m=p.model,lifts=(m.level.lifts||[]).filter(l=>m.all(l.needs));
 const virtual=lifts.flatMap(l=>[.12,l.to+.12].map(y=>({x:l.x*2,z:l.z*2,w:.95,d:.95,b:y-.22,t:y,lift:true})));
 const supportCache=new Map(),jumpCache=new Map(),surfaces=[...solids.filter(s=>s.floor||s.cube||s.t-s.b<=1.3),...virtual];
 const support=(x,z)=>{const k=x+','+z;if(supportCache.has(k))return supportCache.get(k);const heights=[...new Set(surfaces.filter(s=>p.overlap(x,z,s,.19)).map(s=>s.t))].filter(y=>!p.blocked(x,y,z,solids));supportCache.set(k,heights);return heights;};
 const key=(x,z,y)=>x+','+z+','+y.toFixed(2),queue=[[Math.round(p.pos.x*2)/2,Math.round(p.pos.z*2)/2,p.pos.y]],seen=new Map([[key(...[p.pos.x,p.pos.z,p.pos.y]),queue[0]]]);
 function jump(from,to){const k=key(...from)+'>'+key(...to);if(jumpCache.has(k))return jumpCache.get(k);const[x,z,y]=from,[xx,zz,yy]=to,dy=yy-y,dist=Math.hypot(xx-x,zz-z),disc=8.5*8.5-42*dy;if(disc<0)return false;const duration=(8.5+Math.sqrt(disc))/21;if(dist>4.7*duration)return false;
  let valid=false;for(const lead of[0,.12,.22,.28]){if(duration<=lead||dist/(duration-lead)>4.7)continue;let clear=true;for(let t=0;t<=duration;t+=1/60){const f=Math.max(0,Math.min(1,(t-lead)/(duration-lead))),h=y+8.5*t-10.5*t*t;if(p.blocked(x+(xx-x)*f,h,z+(zz-z)*f,solids)){clear=false;break;}}if(clear){valid=true;break;}}jumpCache.set(k,valid);return valid;
 }
 const add=point=>{const k=key(...point);if(!seen.has(k)){seen.set(k,point);queue.push(point);}};
 for(let head=0;head<queue.length;head++){
  const from=queue[head],[x,z,y]=from;
  for(const[dx,dz]of[[.5,0],[-.5,0],[0,.5],[0,-.5]])for(const yy of support(x+dx,z+dz)){if(Math.abs(yy-y)<.08){if(!p.blocked(x+dx/2,y,z+dz/2,solids))add([x+dx,z+dz,yy]);}else if(yy<y&&y-yy<3.5&&!p.blocked(x+dx,y,z+dz,solids))add([x+dx,z+dz,yy]);}
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])for(const yy of support(x+dx,z+dz)){if(Math.abs(yy-y)<.08||yy-y>1.7||y-yy>3.5)continue;const next=[x+dx,z+dz,yy];if(!seen.has(key(...next))&&jump(from,next))add(next);}
  for(const lift of lifts)if(Math.abs(x-lift.x*2)<.55&&Math.abs(z-lift.z*2)<.55&&Math.abs(y-.12)<.1){const yy=lift.to+.12;if(!p.blocked(x,yy,z,solids))add([x,z,yy]);}
 }
 return [...seen.values()];
}
