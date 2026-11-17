/* A single warm-amber conflict cue; no text, automatic edits or solution verdict. */
(() => {
  const M=window.Metro,overlay=document.createElement('div');
  overlay.className='hint-advice';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');document.body.append(overlay);
  let previousTarget=null;
  M.drawHintAdvice=()=>{
    const conflict=M.state.hint&&M.state.hintConflict;
    const selector=conflict?.type==='car-budget'?`#vehicles [data-line="${M.state.selected}"] .vehicle-rails`:conflict?.type==='total-budget'?'#rail-stock':null;
    const target=selector?document.querySelector(selector):null;
    if(previousTarget!==target){previousTarget?.classList.remove('hint-budget');target?.classList.add('hint-budget');previousTarget=target;}
    const cells=conflict?.cells||[];overlay.hidden=!cells.length;
    if(!cells.length)return;
    const rect=M.canvas.getBoundingClientRect(),ratio=rect.width/M.camera.width;
    const points=cells.map(([r,c])=>[[-.43,-.43],[-.43,.43],[.43,.43],[.43,-.43]].map(([dr,dc])=>{
      const p=M.project(r+dr,c+dc,5);return `${rect.left+p.x*ratio},${rect.top+p.y*ratio}`;
    }).join(' '));
    const svg=`<svg viewBox="0 0 ${rect.width} ${rect.height}"><g class="hint-pulse">${points.map(p=>`<polygon points="${p}"/>`).join('')}</g></svg>`;
    if(overlay.innerHTML!==svg)overlay.innerHTML=svg;
  };
})();
