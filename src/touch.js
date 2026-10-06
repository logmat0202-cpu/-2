// Pointer IDs stay independent: movement, camera and actions work simultaneously.
export function stickVector(dx, dy, radius, deadZone = .17) {
  const distance = Math.hypot(dx, dy);
  if (!distance || distance / radius <= deadZone) return {x: 0, z: 0};
  const strength = (Math.min(1, distance / radius) - deadZone) / (1 - deadZone);
  return {x: dx / distance * strength, z: dy / distance * strength};
}
export class TouchControls {
  constructor({canvas, stick, knob, active, onLook, onZoom, onAction, onMode, onReset}) {
    Object.assign(this, {canvas, stick, knob, active, onLook, onZoom, onAction, onMode, onReset});
    this.enabled = matchMedia('(pointer: coarse)').matches;
    this.movement = {x: 0, z: 0};
    this.stickPointer = null;
    this.lookPointers = new Map();
    this.pinchDistance = null;
    this.actionPointers = new Map();
    document.body.classList.toggle('touch-mode', this.enabled);
    document.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' && !this.enabled) {
        this.enabled = true;
        document.body.classList.add('touch-mode');
        this.onMode?.();
      }
    }, true);
    stick.addEventListener('pointerdown', e => {
      if (!this.active() || this.stickPointer !== null) return;
      e.preventDefault();
      this.stickPointer = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      this.origin = stick.getBoundingClientRect();
      this.radius = this.origin.width * .32;
      this.moveStick(e);
      stick.classList.add('engaged');
    });
    stick.addEventListener('pointermove', e => {if(e.pointerId === this.stickPointer) this.moveStick(e);});
    const endStick = e => {if(e.pointerId === this.stickPointer) this.resetStick();};
    for (const event of ['pointerup','pointercancel','lostpointercapture']) stick.addEventListener(event, endStick);
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' || !this.active()) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      this.lookPointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
      this.pinchDistance = this.getPinchDistance();
    });
    canvas.addEventListener('pointermove', e => {
      const previous = this.lookPointers.get(e.pointerId);
      if (!previous || !this.active()) return;
      e.preventDefault();
      this.lookPointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (this.lookPointers.size >= 2) {
        const distance = this.getPinchDistance();
        if (this.pinchDistance !== null) this.onZoom((this.pinchDistance - distance) * .035);
        this.pinchDistance = distance;
      } else this.onLook(e.clientX - previous.x, e.clientY - previous.y);
    });
    const endLook = e => {this.lookPointers.delete(e.pointerId);this.pinchDistance = this.getPinchDistance();};
    for (const event of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(event,endLook);
    document.querySelectorAll('[data-touch-action]').forEach(button => {
      button.addEventListener('pointerdown', e => {
        if (!this.active() || button.disabled) return;
        e.preventDefault();
        this.actionPointers.set(e.pointerId, button);
        button.setPointerCapture(e.pointerId);
        button.classList.add('pressed');
        this.onAction(button.dataset.touchAction);
      });
      const release = e => {this.actionPointers.delete(e.pointerId);button.classList.remove('pressed');};
      for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,release);
      // Keyboard and assistive-technology activation have no pointerdown.
      button.addEventListener('click', e => {if(e.detail === 0 && this.active() && !button.disabled)this.onAction(button.dataset.touchAction);});
    });
    window.addEventListener('blur', () => this.reset());
    window.addEventListener('resize', () => this.reset());
    window.addEventListener('orientationchange', () => this.reset());
    document.addEventListener('visibilitychange', () => {if(document.hidden)this.reset();});
    window.addEventListener('pagehide', () => this.reset());
    // Prevent browser page zoom on the play surface; keep menu text zoom accessible.
    canvas.addEventListener('gesturestart', e => e.preventDefault());
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }
  moveStick(e) {
    if (!this.active()) {this.resetStick();return;}
    const dx = e.clientX - this.origin.left - this.origin.width / 2;
    const dy = e.clientY - this.origin.top - this.origin.height / 2;
    this.movement = stickVector(dx,dy,this.radius);
    const length = Math.hypot(dx,dy), scale = length ? Math.min(1,this.radius/length) : 0;
    this.knob.style.transform = `translate(${dx*scale}px, ${dy*scale}px)`;
  }
  getPinchDistance() {
    if(this.lookPointers.size < 2)return null;
    const [a,b] = this.lookPointers.values();return Math.hypot(a.x-b.x,a.y-b.y);
  }
  resetStick() {
    const id=this.stickPointer;this.stickPointer=null;
    this.movement={x:0,z:0};this.knob.style.transform='translate(0,0)';this.stick.classList.remove('engaged');
    if(id!==null&&this.stick.hasPointerCapture(id))this.stick.releasePointerCapture(id);
  }
  reset() {
    this.resetStick();
    for(const id of this.lookPointers.keys())if(this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);
    this.lookPointers.clear();this.pinchDistance=null;
    for(const [id,button] of this.actionPointers){button.classList.remove('pressed');if(button.hasPointerCapture(id))button.releasePointerCapture(id);}
    this.actionPointers.clear();this.onReset?.();
  }
}
