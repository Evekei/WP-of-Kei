/* Local geometric compatibility, not a verdict on the player's complete solution. */
(() => {
  const M=window.Metro,key=p=>p.join(','),same=(a,b)=>key(a)===key(b);
  const edge=(a,b)=>[key(a),key(b)].sort().join('|');
  const edges=route=>new Set(route.slice(1).map((p,i)=>edge(route[i],p)));
  M.pickHint=(level,routes,line)=>{
    const own=routes[line],built=edges(own),sections=level.hintSections[line];
    const missing=sections.filter(s=>s.slice(1).some((p,i)=>!built.has(edge(s[i],p))));
    const copy=s=>s.map(p=>[...p]);
    if(!missing.length)return {route:copy(level.referenceSolution[line]),conflict:null};
    const hub=new Set(level.stops.filter(s=>s.type==='transfer').map(s=>key([s.r,s.c])));
    const occupied=new Map(),otherEdges=new Set(),visited=new Set(own.map(key));
    routes.forEach((route,i)=>{if(i!==line){route.forEach(p=>{if(!hub.has(key(p)))occupied.set(key(p),i);});edges(route).forEach(e=>otherEdges.add(e));}});
    const walls=new Set(level.blocked.map(key));
    level.trains.forEach((t,i)=>{if(i!==line)walls.add(key(t.start));});
    const used=routes.reduce((n,r)=>n+r.length-1,0),tail=own.at(-1);
    const connect=section=>{
      // Reuse an already-built section prefix only where it is the route's suffix.
      const hit=section.findIndex(p=>same(p,tail));
      if(hit>=0){
        const prefix=section.slice(0,hit+1),suffix=own.slice(-prefix.length);
        if(prefix.length<=own.length&&prefix.every((p,i)=>same(p,suffix[i]))&&!section.slice(hit+1).some(p=>visited.has(key(p))))
          return {path:[...own,...section.slice(hit+1)]};
        return {conflict:{type:'self',cells:[tail]}};
      }
      const overlaps=section.filter(p=>visited.has(key(p)));
      if(overlaps.length)return {conflict:{type:'self',cells:overlaps.slice(0,3)}};
      const reserved=new Set(section.slice(1).map(key)),queue=[tail],parents=new Map([[key(tail),null]]);
      let end=null;
      for(let n=0;n<queue.length;n++){
        const p=queue[n];if(same(p,section[0])){end=p;break;}
        for(const [dr,dc] of [[-1,0],[0,1],[1,0],[0,-1]]){
          const q=[p[0]+dr,p[1]+dc],k=key(q);
          if(q.some(v=>v<0||v>=level.size)||parents.has(k)||visited.has(k)||occupied.has(k)||walls.has(k)||reserved.has(k)||otherEdges.has(edge(p,q)))continue;
          parents.set(k,p);queue.push(q);
        }
      }
      if(!end)return {conflict:{type:'access',cells:[section[0]]}};
      const connector=[];for(let p=end;p;p=parents.get(key(p)))connector.push(p);connector.reverse();
      return {path:[...own,...connector.slice(1),...section.slice(1)]};
    };
    const evaluate=section=>{
      const occupiedCells=section.filter(p=>occupied.has(key(p))||walls.has(key(p)));
      if(occupiedCells.length)return {type:'occupied',cells:occupiedCells.slice(0,3)};
      const shared=section.slice(1).findIndex((p,i)=>otherEdges.has(edge(section[i],p)));
      if(shared>=0)return {type:'occupied',cells:section.slice(shared,shared+2)};
      const attempts=[connect(section),connect([...section].reverse())];
      let budget=null;
      for(const attempt of attempts){
        if(!attempt.path)continue;
        const extra=attempt.path.length-own.length;
        if(attempt.path.length-1>level.trains[line].budget){budget||={type:'car-budget',cells:[]};continue;}
        if(used+extra>level.totalBudget){budget||={type:'total-budget',cells:[]};continue;}
        return null;
      }
      return budget||attempts[0].conflict;
    };
    let first=null;
    for(const section of missing){
      const conflict=evaluate(section);
      if(!conflict)return {route:copy(section),conflict:null};
      first||={route:copy(section),conflict};
    }
    return first;
  };
})();
