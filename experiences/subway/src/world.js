/* Closed station models. Roofs show passenger counts and walking pictograms. */
(() => {
  const M = window.Metro, ctx = M.ctx;
  const cell = (r,c,fill,stroke='#d6dfd7',width=.55) => M.poly([
    M.project(r-.49,c-.49),M.project(r-.49,c+.49),
    M.project(r+.49,c+.49),M.project(r+.49,c-.49)
  ],fill,stroke,width);
  const roofLine = (s,points,z,color='#fffdf4',width=3) => M.line(
    points.map(([r,c])=>M.project(s.r+r,s.c+c,z)),color,width*M.camera.scale);
  const facadeGoal=s=>{
    const r=s.r+(s.type==='pickup'?.335:.4),c=s.c+.21;
    const points=s.goal==='red'?Array.from({length:24},(_,i)=>{
      const angle=i/24*Math.PI*2;return M.project(r,c+Math.cos(angle)*.065,10+Math.sin(angle)*3.6);
    }):s.goal==='yellow'?[[c-.065,6.4],[c+.065,6.4],[c+.065,13.6],[c-.065,13.6]].map(([col,z])=>M.project(r,col,z)):
      [[c-.075,6.4],[c+.075,6.4],[c,14]].map(([col,z])=>M.project(r,col,z));
    M.poly(points,'#48616b');
  };
  const clipStationSilhouettes=()=>{
    for(const station of [...M.stops,...(M.obstacles||[])]){
      const [rw,cw,height]=station.type==='tree'?[.7,.7,55]:station.type==='transfer'?[1.08,1.08,31]:station.type==='pickup'?[.73,.94,24]:station.type==='depot'?[1,1,M.depotHeight]:station.type==='check'?[.9,.9,24]:[.89,.88,30];
      const points=[];
      for(const r of [-rw/2,rw/2])for(const c of [-cw/2,cw/2])for(const z of [0,height])points.push(M.project(station.r+r,station.c+c,z));
      points.sort((a,b)=>a.x-b.x||a.y-b.y);
      const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
      const lower=[],upper=[];
      for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
      for(const p of [...points].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
      const hull=[...lower.slice(0,-1),...upper.slice(0,-1)];
      ctx.beginPath();ctx.rect(0,0,M.camera.width,M.camera.height);
      hull.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
      ctx.clip('evenodd');
    }
  };
  M.ground=()=>{
    const {width,height,scale}=M.camera,center=(M.size-1)/2;
    ctx.clearRect(0,0,width,height);
    const shadow=M.project(center+.1,center+.1,-25);
    ctx.save();ctx.filter='blur(9px)';
    M.ellipse(shadow.x,shadow.y,M.size*48*scale,M.size*32*scale,'#4358640e');ctx.restore();
    M.box(center,center,M.size+.12,M.size+.12,-15,13,['#edf0eb','#c5cfca','#d6ddd6']);
    M.box(center,center,M.size+.12,M.size+.12,-2,2,['#f6f7f1','#e6ebe5','#f0f2ec']);
    for(let r=0;r<M.size;r++)for(let c=0;c<M.size;c++)cell(r,c,(r+c)%2?'#e9eee6':'#edf1e9');
    for(const [r,c] of M.level.blocked)cell(r,c,'#e0e7d8');
    M.drawSceneryGround?.();
  };
  const tree=(r,c)=>{
    M.box(r,c,.14,.14,0,12,['#b7a184','#96836b','#a08c70']);
    const crown=(width,z,height)=>{
      const base=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([dr,dc])=>M.project(r+dr*width,c+dc*width,z));
      const peak=M.project(r,c,z+height);
      M.poly([base[1],base[2],peak],'#7e9d7c');M.poly([base[2],base[3],peak],'#92ab88');
      M.poly([base[0],base[1],peak],'#a5b89a');
    };
    crown(.34,10,26);crown(.23,22,33);
  };
  M.station=s=>{
    const {r,c,type}=s,color=M.goals[s.goal]||M.colors[s.line||0];
    if(type==='tree'){tree(r,c);}
    else if(type==='pickup') {
      M.box(r,c,.66,.88,0,20,['#e9e8dc','#bfcac4','#d7ddd2']);
      M.box(r,c,.73,.94,20,4,[color,color,color]);
      M.box(r+.335,c-.16,.012,.18,0,14,['#71949c','#71949c','#71949c']);
      M.stationMark(s,s.count-(M.state.served[`${r},${c}`]||0),25);
      facadeGoal(s);
      if(!M.state.collected.has(s.groupId)) {
        for(let i=0;i<s.count;i++)M.person(r+.43,c-.23+i*.17,color,1);
      }
    } else if(type==='end') {
      M.box(r,c,.79,.78,0,25,['#e8e9df','#c2cdc7','#d6ddd0']);
      M.box(r,c,.89,.88,25,5,[color,color,color]);
      M.box(r+.4,c,.012,.2,0,17,['#648690','#648690','#648690']);
      M.stationMark(s,s.count-(M.state.served[`${r},${c}`]||0),31);
      facadeGoal(s);
    } else if(type==='depot') {
      const blue=M.colors[s.line||0];
      M.box(r,c,1,1,0,7,['#e6e7db','#b3c0b7','#cbd5c9']);
      M.box(r,c,.83,.86,7,M.depotHeight-13,['#dee7e3','#95afb1','#b5c8c1']);
      M.box(r,c,.92,.95,M.depotHeight-6,6,[blue,blue,blue]);
      M.box(r+.42,c,.012,.4,0,28,['#345765','#345765','#345765']);
      M.depotMark(s);
    } else if(type==='transfer') {
      // The solid floor, walls and roof fully conceal the tracks within this cell.
      M.box(r,c,1.02,1.02,0,26,['#e5e9df','#afc0b8','#c6d3c8']);
      const roof=M.state.waiting?.some(Boolean)?'#c7b47e':M.state.transferDone?'#8eafa0':'#a6bdb8';
      M.box(r,c,1.08,1.08,26,5,[roof,'#8aa7a1','#94b0a7']);
      roofLine(s,[[-.2,-.22],[-.2,.22],[-.3,.1],[-.2,.22],[-.1,.1]],32);
      roofLine(s,[[.2,.22],[.2,-.22],[.1,-.1],[.2,-.22],[.3,-.1]],32);
    } else if(type==='check') {
      M.box(r,c,.83,.83,0,20,['#e5e9df','#afc0b8','#c6d3c8']);
      M.box(r,c,.9,.9,20,4,[color,color,color]);
      roofLine(s,[[-.12,-.17],[.08,-.03],[-.12,.23]],25,'#fffdf4',5);
    }
  };
  M.draw=()=>{
    if(!M.state)return;
    M.ground();
    if(M.state.hover&&!M.state.playing)cell(...M.state.hover,'#dce6df',M.colors[M.state.selected],1.2);
    if(M.state.errorAt)cell(...M.state.errorAt,'#ecd2c7','#c37667',2);
    if(M.state.hint)M.rail(M.state.hint,M.colors[M.state.selected],.4);
    M.state.routes.forEach((route,i)=>M.rail(route,M.colors[i],M.state.playing||M.state.success||i===M.state.selected?1:.65));
    [...M.stops,...(M.obstacles||[])].sort((a,b)=>(a.r+a.c)-(b.r+b.c)).forEach(M.station);
    const actors=[];
    M.state.vehicles.forEach((v,i)=>{
      const inside=M.stops.some(s=>Math.abs(s.r-v.r)<.49&&Math.abs(s.c-v.c)<.49);
      if(!inside)actors.push({depth:v.r+v.c,paint:()=>{
        ctx.save();clipStationSilhouettes();M.train(v.r,v.c,v.dr,v.dc,i,v.load);ctx.restore();
      }});
    });
    M.state.walkers.forEach(w=>actors.push({depth:w.r+w.c,paint:()=>M.person(w.r,w.c,w.color,w.z,w.opacity)}));
    actors.sort((a,b)=>a.depth-b.depth).forEach(actor=>actor.paint());
    M.stops.filter(s=>s.type==='depot').forEach(M.depotCapacity);
    M.drawTransferEffects();
    M.drawHintAdvice?.();
  };
})();
