export class Sound{
 constructor(volume=.35){this.volume=volume;this.ctx=null;this.last=0;this.muted=false;}
 start(){if(this.ctx){this.ctx.resume();return;}const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=this.volume*.12;this.master.connect(this.ctx.destination);this.bed=this.ctx.createGain();this.bed.gain.value=.28;this.bed.connect(this.master);for(const freq of [130.81,196,261.63,329.63]){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.value=.1;o.connect(g);g.connect(this.bed);o.start();}this.timer=setInterval(()=>{if(this.ctx.state==='running')this.note([523.25,659.25,783.99,987.77][Math.floor(Math.random()*4)],2.4,.11);},3400);}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:v*.12,this.ctx.currentTime,.2);}
 toggle(){this.muted=!this.muted;this.setVolume(this.volume);return this.muted;}
 note(freq,duration=.25,volume=.5){if(!this.ctx||this.muted)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.035);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start();o.stop(t+duration+.1);}
 move(){this.note(196,.18,.35);setTimeout(()=>this.note(293.66,.25,.25),70);}
 success(){[523.25,659.25,783.99,1046.5].forEach((n,i)=>setTimeout(()=>this.note(n,1.2,.8),i*150));}
}
