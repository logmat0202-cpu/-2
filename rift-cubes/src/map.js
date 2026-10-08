import {TYPES} from './levels.js';
// Pause-map is generated from the live puzzle, including phase and cube changes.
export function drawMap(canvas,model,player){
 const ctx=canvas.getContext('2d'),tiles=model.level.floors;
 const minX=Math.min(...tiles.map(t=>t.x)),maxX=Math.max(...tiles.map(t=>t.x)),minZ=Math.min(...tiles.map(t=>t.z)),maxZ=Math.max(...tiles.map(t=>t.z));
 const cell=Math.min(26,460/(maxX-minX+3),420/(maxZ-minZ+3)),margin=cell*1.1;
 canvas.width=Math.ceil((maxX-minX+1)*cell+margin*2);canvas.height=Math.ceil((maxZ-minZ+1)*cell+margin*2);
 const at=(x,z)=>[margin+(x-minX+.5)*cell,margin+(z-minZ+.5)*cell];
 ctx.fillStyle='#153b40';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(const t of tiles){const[x,z]=at(t.x,t.z);ctx.globalAlpha=model.floor(t.x,t.z)?1:.22;ctx.fillStyle=t.bridge?'#77ddc1':t.y>0?'#cec38e':'#607f76';ctx.fillRect(x-cell*.46,z-cell*.46,cell*.92,cell*.92);}ctx.globalAlpha=1;
 for(const a of [...(model.level.walls||[]),...(model.level.gates||[])]){const[x,z]=at(a.x,a.z);ctx.globalAlpha=model.isWall(a.x,a.z)?1:.2;ctx.fillStyle=a.phase?'#64d6d0':'#253e41';ctx.fillRect(x-cell*.44,z-cell*.44,cell*.88,cell*.88);}ctx.globalAlpha=1;
 const dot=(x,z,r,color)=>{const[a,b]=at(x,z);ctx.beginPath();ctx.arc(a,b,cell*r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
 for(const plate of model.level.plates||[]){const[x,z]=at(plate.x,plate.z);ctx.strokeStyle=model.flags[plate.id]?'#fff1b8':'#'+(plate.color??(plate.phase?0x57e2d7:0xf1be74)).toString(16).padStart(6,'0');ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,z,cell*.35,0,Math.PI*2);ctx.stroke();}
 for(const cube of model.cubes){const[x,z]=at(cube.x,cube.z);ctx.fillStyle='#'+(cube.tint??TYPES[cube.type].color).toString(16).padStart(6,'0');ctx.fillRect(x-cell*.26,z-cell*.26,cell*.52,cell*.52);}
 for(const kind of ['sources','contacts','lasers','receivers'])for(const node of model.level[kind]||[])dot(node.x,node.z,.18,kind==='lasers'||kind==='receivers'?'#ffe2a4':'#91ffe1');
 ctx.strokeStyle='#ffdb88';ctx.lineWidth=1.5;for(const ray of model.rays){ctx.beginPath();ctx.moveTo(...at(ray.x,ray.z));ctx.lineTo(...at(ray.nx,ray.nz));ctx.stroke();}
 dot(...model.level.portal,.3,model.ready?'#baffde':'#809db9');dot(player.pos.x/2,player.pos.z/2,.25,'#ffffff');
 ctx.fillStyle='#d7ebd9';ctx.font=`${Math.max(9,cell*.45)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 for(let x=minX;x<=maxX;x++)if(x%2===0){const[a]=at(x,minZ);ctx.fillText(x,a,margin*.35);}
 for(let z=minZ;z<=maxZ;z++)if(z%2===0){const[,b]=at(minX,z);ctx.fillText(z,margin*.35,b);}
}
