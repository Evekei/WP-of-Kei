/* Show the failed station and the actual contradiction, then return to the same plan. */
(() => {
  const M=window.Metro,dialog=document.getElementById('dialog');
  const overlay=document.createElement('div');overlay.className='failure-focus';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');document.body.append(overlay);
  let current=null;
  const person=(n,color)=>`<span style="color:${color}">${M.icon('person')}<b>${n}</b></span>`;
  M.clearFailure=()=>{
    if(!current)return;current=null;overlay.hidden=true;dialog.dataset.kind='';
    for(const prop of ['left','right','top','bottom'])dialog.style.removeProperty(prop);
    M.resetActors();M.updateHUD();
  };
  const layout=()=>{
    if(!current||!dialog.open)return;
    const rect=M.canvas.getBoundingClientRect(),ratio=rect.width/M.camera.width;
    const point=current.at?M.project(...current.at,24):null;
    const target=point?{x:rect.left+point.x*ratio,y:rect.top+point.y*ratio}:null;
    const compact=rect.width<=650;
    dialog.style.left=compact?'16px':'32px';dialog.style.right=compact?'16px':'auto';
    dialog.style.top=compact?'auto':'112px';dialog.style.bottom=compact?'16px':'auto';
    let box=dialog.getBoundingClientRect();
    if(target){
      if(compact&&target.y>box.top-45){dialog.style.top='78px';dialog.style.bottom='auto';}
      else if(!compact&&target.x<box.right+45&&target.y<box.bottom+45){dialog.style.left='auto';dialog.style.right='32px';}
      box=dialog.getBoundingClientRect();
      const x=Math.max(18,Math.min(rect.width-18,target.x)),y=Math.max(80,Math.min(rect.height-30,target.y));
      const startX=box.left+box.width/2,startY=y<box.top?box.top:box.bottom;
      overlay.innerHTML=`<svg viewBox="0 0 ${rect.width} ${rect.height}"><circle cx="${x}" cy="${y}" r="38" fill="none" stroke="#ba6758" stroke-width="2"/><path d="M${startX} ${startY}L${x} ${y+(y<box.top?38:-38)}" stroke="#ba6758" stroke-width="1.5" fill="none"/></svg>`;
      overlay.hidden=false;
    }
  };
  M.showFailure=d=>{
    const color=M.goals[d.goal]||M.colors[d.line||0];let title='这里还需要调整',visual=M.icon('rail'),text=d.message;
    if(d.type==='capacity'){
      title='这一站坐不下了';visual=person(d.before,M.colors[d.line])+`<i>＋</i>`+person(d.boarding,color)+`<i>＞</i>`+person(d.capacity,M.colors[d.line]);
      text='车内人数＋本站上车人数，超过容量。';
    }else if(d.type==='shortage'){
      title='同色乘客还不够';visual=person(d.available,color)+`<i>＜</i><span style="color:${color}"><b>${d.required}</b>${M.signSVG('down')}</span>`;
      text='左边是车内同色人数，右边是本站下车配额。';
    }else if(d.type==='transfer'){
      title=d.reason;visual=d.incoming>d.capacity?person(d.incoming,M.colors[d.line])+`<i>＞</i>`+person(d.capacity,M.colors[d.line]):M.icon('transfer');
    }
    M.modal(`<div class="failure-content"><div class="failure-visual" aria-hidden="true">${visual}</div><h2>${title}</h2><p>${text}</p><button class="primary" data-action="fix-failure">返回修改</button></div>`);
    current=d;dialog.dataset.kind='failure';
    if(Number.isInteger(d.line))M.state.selected=d.line;
    M.saveDraft?.();
    M.state.errorAt=d.at;M.message('');M.updateHUD();
    if(d.at){
      const p=M.project(...d.at),rect=M.canvas.getBoundingClientRect(),k=rect.width/M.camera.width;
      if(p.x*k<45||p.x*k>rect.width-45||p.y*k<95||p.y*k>rect.height-120){M.state.view={zoom:1,panX:0,panY:0};M.resize();}
    }
    layout();M.tone(240);
  };
  dialog.addEventListener('cancel',()=>M.clearFailure());
  M.layoutFailure=layout;
})();
