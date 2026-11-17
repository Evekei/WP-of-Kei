/* Pointer gestures use the cells crossed by the actual drag, including sparse events. */
(() => {
  const M=window.Metro,canvas=M.canvas;
  let gesture=null;
  const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
  const inside=p=>p.every(n=>n>=0&&n<M.size);
  const position=e=>{
    const rect=canvas.getBoundingClientRect();
    return M.unproject((e.clientX-rect.left)/rect.width*M.camera.width,(e.clientY-rect.top)/rect.height*M.camera.height);
  };
  // Inverse projection turns a depot's projected solid into two intervals sharing a height offset.
  const depotAt=p=>M.level.trains.findIndex(train=>{
    const dr=p[0]-train.start[0],dc=p[1]-train.start[1],height=M.depotHeight*M.camera.scale/(2*M.camera.sy);
    return Math.max(0,-.5-dr,-.5-dc)<=Math.min(height,.5-dr,.5-dc);
  });
  M.dragCells=(from,to)=>{
    const cell=from.map(Math.round),end=to.map(Math.round),delta=to.map((v,i)=>v-from[i]),out=[];
    const step=delta.map(Math.sign);
    while(!same(cell,end)){
      const crossing=cell.map((v,i)=>step[i]?(v+step[i]*.5-from[i])/delta[i]:Infinity);
      const axis=crossing[0]<=crossing[1]?0:1;
      cell[axis]+=step[axis];out.push([...cell]);
    }
    return out;
  };
  const append=p=>{
    const current=gesture;
    const before=M.state.history.length;
    const ok=M.addTrack(...p,!current.recorded);
    if(M.state.history.length>before)current.recorded=true;
    if(!ok||M.isPaused())current.stopped=true;
  };
  const move=e=>{
    if(M.state.playing||M.state.inspect||M.isPaused())return;
    const p=position(e),cell=p.map(Math.round);
    M.state.hover=inside(cell)?cell:null;
    if(gesture&&e.pointerId===gesture.id&&!gesture.stopped){
      if(gesture.depot>=0){
        if(depotAt(p)===gesture.depot){M.draw();return;}
        gesture.depot=-1;
      }
      for(const crossed of M.dragCells(gesture.previous,p)){
        if(!inside(crossed)){gesture.stopped=true;break;}
        append(crossed);if(!gesture||gesture.stopped)break;
      }
      if(gesture)gesture.previous=p;
    }
    M.draw();
  };
  canvas.addEventListener('pointerdown',e=>{
    if(M.state.playing||M.state.inspect||M.isPaused()||document.body.classList.contains('at-home')||gesture||e.button!==0||e.isPrimary===false)return;
    const p=position(e),cell=p.map(Math.round),depot=depotAt(p);
    if(depot<0&&!inside(cell))return;
    e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
    gesture={id:e.pointerId,previous:depot>=0?[...M.level.trains[depot].start]:p,depot,recorded:false,stopped:false};
    if(depot>=0)M.selectLine(depot);else append(cell);
  });
  canvas.addEventListener('pointermove',move);
  canvas.addEventListener('pointerleave',()=>{M.state.hover=null;if(!M.state.playing)M.draw();});
  const finish=e=>{
    if(!gesture||e.pointerId!==gesture.id)return;
    if(e.type==='pointerup')move(e);
    gesture=null;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  };
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,finish);
  M.stopDrawing=()=>{
    const id=gesture?.id;gesture=null;
    if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  };
  canvas.addEventListener('keydown',e=>{
    if(M.state.playing||M.state.inspect||M.isPaused())return;
    const directions={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    if(directions[e.key]){
      e.preventDefault();const p=M.state.hover||M.state.routes[M.state.selected].at(-1);
      M.state.hover=p.map((v,i)=>Math.max(0,Math.min(M.size-1,v+directions[e.key][i])));M.draw();
    }
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();if(!M.state.hover)return;
      const line=M.level.trains.findIndex(t=>same(t.start,M.state.hover));
      if(line>=0)M.selectLine(line);else M.addTrack(...M.state.hover);
    }
  });
})();
