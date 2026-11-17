/* Only planning data is persisted; animation actors and trial progress stay transient. */
(() => {
  const M=window.Metro;let timer;
  const signature=l=>JSON.stringify([l.size,l.trains,l.stops,l.blocked,l.totalBudget]);
  M.flushDraft=()=>{clearTimeout(timer);M.persist();};
  M.clearDraft=index=>{delete M.save.drafts[index];};
  M.saveDraft=()=>{
    const s=M.state;if(s.trial||s.success)return;
    if(s.routes.some(route=>route.length>1))M.save.drafts[M.current]={signature:signature(M.level),routes:s.routes.map(r=>r.map(p=>[...p])),selected:s.selected};
    else M.clearDraft(M.current);
    clearTimeout(timer);timer=setTimeout(()=>M.persist(),150);
  };
  M.restoreDraft=()=>{
    const d=M.save.drafts[M.current];if(!d||M.state.trial)return false;
    const valid=d.signature===signature(M.level)&&Array.isArray(d.routes)&&d.routes.length===M.level.trains.length&&
      d.routes.every(route=>Array.isArray(route)&&route.length>0&&route.length<=M.size*M.size&&route.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)))&&M.geometry(M.level,d.routes).ok;
    if(!valid){M.clearDraft(M.current);M.persist();return false;}
    M.state.routes=d.routes.map(r=>r.map(p=>[...p]));M.state.selected=Number.isInteger(d.selected)&&d.selected>=0&&d.selected<d.routes.length?d.selected:0;
    return true;
  };
  window.addEventListener('pagehide',()=>{M.saveDraft();M.flushDraft();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){M.saveDraft();M.flushDraft();}});
})();
