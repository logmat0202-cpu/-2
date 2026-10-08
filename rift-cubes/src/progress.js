export const STORAGE='rift-cubes-v1';
export function restoreProgress(data,count){
 const defaults={unlocked:1,completed:[],current:1,volume:.35,sensitivity:1,quality:'auto',campaignVersion:2};
 if(!data||typeof data!=='object')return defaults;
 const clamp=(n,min,max,fallback)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):fallback));
 const completed=[...new Set((Array.isArray(data.completed)?data.completed:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=count))];
 const unlocked=Math.min(count,Math.max(Math.floor(clamp(data.unlocked,1,count,1)),completed.length?Math.max(...completed)+1:1));
 const current=data.campaignVersion!==2&&completed.includes(10)&&data.current===10?Math.min(11,count):Math.floor(clamp(data.current,1,unlocked,1));
 return {...defaults,unlocked,completed,current,volume:clamp(data.volume,0,1,.35),sensitivity:clamp(data.sensitivity,.3,2.5,1),quality:['auto','high','low'].includes(data.quality)?data.quality:'auto'};
}
