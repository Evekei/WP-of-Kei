/* Inspect mode separates map gestures from drawing a railway. */
(() => {
  const M=window.Metro,canvas=M.canvas,$=id=>document.getElementById(id),pointers=new Map();
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const apply=()=>{
    const view=M.state.view,rect=canvas.getBoundingClientRect();
    view.zoom=clamp(view.zoom,1,2.4);
    if(view.zoom===1){view.panX=0;view.panY=0;}
    view.panX=clamp(view.panX,-rect.width*view.zoom/2,rect.width*view.zoom/2);
    view.panY=clamp(view.panY,-rect.height*view.zoom/2,rect.height*view.zoom/2);
    M.resize();
    M.tutorial?.afterView();
  };
  M.updateViewUI=()=>{
    const large=M.level.size>=10,inspect=large&&M.state.inspect;
    $('view-toggle').hidden=!large;$('view-tools').hidden=!inspect;
    $('view-toggle').setAttribute('aria-pressed',String(inspect));
    $('view-toggle').setAttribute('aria-label',inspect?'返回铺轨':'缩放查看地图');
    $('zoom-out').disabled=M.state.view.zoom<=1;$('zoom-in').disabled=M.state.view.zoom>=2.4;
  };
  const zoom=delta=>{M.state.view.zoom+=delta;apply();M.updateViewUI();};
  $('view-toggle').innerHTML=M.icon('zoom');$('zoom-out').innerHTML=M.icon('minus');$('zoom-in').innerHTML=M.icon('plus');$('view-fit').innerHTML=M.icon('fit');
  $('view-toggle').onclick=()=>{
    M.state.inspect=!M.state.inspect;M.state.hover=null;pointers.clear();M.message('');
    if(M.state.inspect&&M.state.view.zoom===1)M.state.view.zoom=1.6;
    apply();M.updateViewUI();
  };
  $('zoom-out').onclick=()=>zoom(-.25);$('zoom-in').onclick=()=>zoom(.25);
  $('view-fit').onclick=()=>{Object.assign(M.state.view,{zoom:1,panX:0,panY:0});apply();M.updateViewUI();};
  const position=e=>[e.clientX,e.clientY],center=points=>[(points[0][0]+points[1][0])/2,(points[0][1]+points[1][1])/2];
  canvas.addEventListener('pointerdown',e=>{
    if(!M.state.inspect||M.isPaused())return;
    e.preventDefault();e.stopImmediatePropagation();pointers.set(e.pointerId,position(e));canvas.setPointerCapture(e.pointerId);
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(!M.state.inspect)return;
    e.preventDefault();e.stopImmediatePropagation();if(!pointers.has(e.pointerId))return;
    const before=[...pointers.values()],old=pointers.get(e.pointerId),next=position(e),view=M.state.view;
    pointers.set(e.pointerId,next);const after=[...pointers.values()];
    if(before.length>=2){
      const oldDistance=Math.hypot(before[1][0]-before[0][0],before[1][1]-before[0][1]);
      const newDistance=Math.hypot(after[1][0]-after[0][0],after[1][1]-after[0][1]);
      if(oldDistance>1)view.zoom*=newDistance/oldDistance;
      const a=center(before),b=center(after);view.panX+=b[0]-a[0];view.panY+=b[1]-a[1];
    }else{view.panX+=next[0]-old[0];view.panY+=next[1]-old[1];}
    apply();M.updateViewUI();
  },true);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{
    if(!pointers.has(e.pointerId))return;
    e.stopImmediatePropagation();pointers.delete(e.pointerId);
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  },true);
  canvas.addEventListener('wheel',e=>{
    if(!M.state.inspect||M.isPaused())return;
    e.preventDefault();zoom(e.deltaY>0?-.15:.15);
  },{passive:false});
  M.updateViewUI();
})();
