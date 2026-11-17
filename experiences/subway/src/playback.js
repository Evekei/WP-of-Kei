/* Only plays already validated event plans. */
(() => {
  const M=window.Metro;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tween=(duration,paint,token,keepDuration=false)=>new Promise(resolve=>{
    let elapsed=0,last=performance.now();
    const tick=now=>{
      if(token!==M.state.token){resolve(false);return;}
      const delta=now-last;last=now;
      const paused=M.isPaused();if(!paused)elapsed+=delta;
      const t=M.state.skip&&!paused?1:Math.min(1,elapsed/(reduced&&!keepDuration?60:duration));
      paint(t);M.draw();
      if(t<1)requestAnimationFrame(tick);else resolve(true);
    };
    requestAnimationFrame(tick);
  });
  M.resetActors=()=>{
    const s=M.state;
    s.vehicles=M.level.trains.map((train,i)=>({r:train.start[0],c:train.start[1],dr:0,dc:1,load:0}));
    s.collected=new Set();s.served={};s.walkers=[];s.transferEffects=[];s.delivered=0;s.doors=M.level.trains.map(()=>false);s.waiting=[];s.transferDone=false;
  };
  M.cancelPlayback=()=>{M.state.token++;M.state.playing=false;M.state.skip=false;M.state.transferEffects=[];M.state.cancelTransfer?.();M.state.cancelTransfer=null;};
  const passengers=async(line,event,token)=>{
    const s=M.state,v=s.vehicles[line],board=event.type==='board',g=event.group;
    if(board)s.collected.add(g.id);
    s.doors[line]=true;
    for(let i=0;i<g.count;i++){
      const exterior=[v.r+.46,v.c-.23+i*.17],door=[v.r+.35,v.c-.16];
      const from=board?exterior:door,to=board?door:exterior;
      const person={r:from[0],c:from[1],z:1,color:M.goals[g.goal],opacity:1};
      s.walkers.push(person);
      if(!await tween(350,t=>{
        const u=t*t*(3-2*t);
        person.r=from[0]+(to[0]-from[0])*u;person.c=from[1]+(to[1]-from[1])*u;
        person.opacity=board?1-t*.7:Math.sin(t*Math.PI);
      },token))return false;
      s.walkers=s.walkers.filter(p=>p!==person);v.load+=board?1:-1;
      const key=event.at.join(',');s.served[key]=(s.served[key]||0)+1;
      if(!board)s.delivered++;
      M.updateHUD();
    }
    s.doors[line]=false;M.tone(board?520:760);
    if(!s.failureReplay)await M.tutorial?.onPassenger(event,token,line);
    return token===s.token;
  };
  const transferGate=(exchange,token)=>{
    if(!exchange)return null;
    const s=M.state,pending=[],events=[],count=exchange.before.length;let arrived=0;
    const cancel=()=>{pending.forEach(resolve=>resolve(false));};s.cancelTransfer=cancel;
    const exchangePassengers=async()=>{
      M.message(M.exchangeText(exchange));s.doors=Array(count).fill(true);
      const totals=new Map();exchange.moves.forEach(move=>totals.set(move.goal,(totals.get(move.goal)||0)+move.count));
      const effects=[...totals].map(([goal,count])=>({at:exchange.at,goal,count,progress:0}));
      s.transferEffects=effects;
      const platforms=count===2?[[.62,-.4],[.62,.4]]:[[.62,-.45],[.62,.45],[.85,0]];
      const walkers=exchange.moves.flatMap(move=>Array.from({length:move.count},(_,i)=>({
        r:exchange.at[0]+platforms[move.from][0],c:exchange.at[1]+platforms[move.from][1],z:1,color:M.goals[move.goal],opacity:1,move,index:i
      })));
      s.walkers.push(...walkers);
      if(!await tween(1000,t=>{
        effects.forEach(effect=>effect.progress=t);
        const walk=Math.min(1,t/.8);
        walkers.forEach(w=>{const a=platforms[w.move.from],b=platforms[w.move.to];w.r=exchange.at[0]+a[0]+(b[0]-a[0])*walk+w.index*.07;w.c=exchange.at[1]+a[1]+(b[1]-a[1])*walk;w.opacity=Math.sin(walk*Math.PI);});
      },token,true)){cancel();return;}
      s.transferEffects=[];
      s.walkers=s.walkers.filter(w=>!walkers.includes(w));
      // Exchange loads together, without transiently adding arrivals to a still-full car.
      events.forEach((event,line)=>{s.vehicles[line].load=event.afterLoad;});
      s.doors=Array(count).fill(false);s.waiting=[];s.transferDone=true;M.updateHUD();M.tone(640);M.message('');
      if(!s.failureReplay)await M.tutorial?.onTransfer(exchange,token);
      if(token!==s.token){cancel();return;}
      pending.forEach(resolve=>resolve(true));if(s.cancelTransfer===cancel)s.cancelTransfer=null;
    };
    return (line,event)=>new Promise(resolve=>{
      if(token!==s.token){resolve(false);return;}
      pending[line]=resolve;events[line]=event;s.waiting[line]=true;arrived++;
      M.message(`${['蓝','绿','紫'][line]}车到站，等待其余列车。`);M.draw();
      if(arrived===count)exchangePassengers();
    });
  };
  const travel=async(line,events,token,gate)=>{
    for(const event of events){
      const v=M.state.vehicles[line];
      if(event.type==='move'){
        const a=[v.r,v.c],b=event.at;v.dr=b[0]-a[0];v.dc=b[1]-a[1];
        if(!await tween(210,t=>{v.r=a[0]+(b[0]-a[0])*t;v.c=a[1]+(b[1]-a[1])*t;},token))return false;
      }else if(event.type==='transfer'){
        if(!await gate(line,event))return false;
      }else if(!await passengers(line,event,token))return false;
    }
    return token===M.state.token;
  };
  M.play=async plan=>{
    M.resetActors();const s=M.state,token=++s.token;
    s.failureReplay=!!plan.diagnostic;
    s.playing=true;s.skip=false;s.hint=null;s.errorAt=null;s.hover=null;
    M.message('');M.updateHUD();
    const gate=transferGate(plan.exchange,token);
    const finished=await Promise.all(plan.timelines.map((events,i)=>travel(i,events,token,gate)));
    if(!finished.every(Boolean)||token!==s.token)return;
    s.playing=false;s.skip=false;
    if(plan.diagnostic){s.failureReplay=false;s.errorAt=plan.at;M.updateHUD();M.showFailure(plan.diagnostic);return;}
    s.success=true;M.updateHUD();M.tutorial?.onComplete();M.complete(plan);
  };
})();
