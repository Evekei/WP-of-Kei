/* Pure route validation and event planning. No DOM, animation or audio here. */
(() => {
  const M = window.Metro;
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const edgeKey = (a, b) => [a.join(','), b.join(',')].sort().join('|');
  const failure = (message, at) => ({ ok: false, message, at });
  M.geometry = (level, routes) => {
    if(routes.length!==level.trains.length)return failure('列车线路数量不正确。');
    const edges = new Set(),cells=new Set(); let total = 0;
    for (let line = 0; line < routes.length; line++) {
      const route = routes[line], train = level.trains[line], seen = new Set();
      if (!route.length || !same(route[0], train.start)) return failure('铁路必须从车库出发。');
      total += route.length - 1;
      if (route.length - 1 > train.budget) return failure(`本车轨道超限：${route.length-1} / ${train.budget} 段。`);
      for (let i = 0; i < route.length; i++) {
        const p = route[i], key = p.join(',');
        if (p.some(n => !Number.isInteger(n) || n < 0 || n >= level.size)) return failure('不能铺到棋盘外。', p);
        if (seen.has(key)) return failure('同一辆车不能重复经过一个格子。', p);
        seen.add(key);
        if (level.blocked.some(q => same(q, p))) return failure('这里是障碍物。', p);
        if (level.trains.some((t, j) => j !== line && same(t.start, p))) return failure('这里是另一辆车的车库。', p);
        if(cells.has(key)&&!level.stops.some(s=>s.type==='transfer'&&s.r===p[0]&&s.c===p[1]))return failure('只有换乘站允许线路相交，请绕开已有线路。',p);
        cells.add(key);
        if (!i) continue;
        const a = route[i - 1];
        if (Math.abs(a[0] - p[0]) + Math.abs(a[1] - p[1]) !== 1) return failure('铁路只能连接上下左右的格子。', p);
        const edge = edgeKey(a, p);
        if (edges.has(edge)) return failure('两条线路不能共用一段铁轨。', p);
        edges.add(edge);
      }
    }
    if (total > level.totalBudget) return failure('剩余铁轨不足，试着缩短路线。');
    return { ok: true, used: total };
  };
  M.plan = (level, routes) => {
    const geometry = M.geometry(level, routes);
    if (!geometry.ok) return geometry;
    const names={yellow:'黄色',red:'红色',cyan:'青色'},balance={};
    let pickupId=0,total=0;
    const stations=level.stops.filter(s=>s.type==='pickup'||s.type==='end').map(s=>{
      if(s.type==='pickup')total+=s.count;
      balance[s.goal]=(balance[s.goal]||0)+(s.type==='pickup'?s.count:-s.count);
      return {...s,id:s.type==='pickup'?pickupId++:undefined};
    });
    if(Object.values(balance).some(n=>n!==0))return failure('关卡上下车人数不守恒。');
    for(const station of stations){
      const owners=routes.filter(route=>route.some(p=>same(p,[station.r,station.c])));
      if(!owners.length)return failure(station.type==='pickup'?'还有乘客没有接到。':'还有下车站没有连接。',[station.r,station.c]);
      if(owners.length>1)return failure('每个上下客站只由一辆车服务。',[station.r,station.c]);
    }
    for (const stop of level.stops.filter(stop => stop.type === 'check')) {
      if (!routes[stop.line || 0]?.some(p => same(p, [stop.r, stop.c]))) return failure('同色列车需要经过这座检查站。', [stop.r, stop.c]);
    }
    const hub=level.stops.find(s=>s.type==='transfer'),colors=Object.keys(balance);
    const cuts=routes.map(route=>hub?route.findIndex(p=>same(p,[hub.r,hub.c])):-1);
    if(hub&&(routes.length<2||cuts.some(i=>i<0)))return failure('所有线路都需要连接双向箭头换乘站。',[hub.r,hub.c]);
    const inventories=routes.map(()=>({})),loads=routes.map(()=>0),peaks=routes.map(()=>0),timelines=routes.map(()=>[]);
    let exchange=null;
    const tripFailure=(message,at,line,detail)=>{
      const replay=timelines.map((events,i)=>{
        if(detail.type==='transfer')return events.filter(e=>e.type!=='transfer');
        if(i===line)return [...events];
        const cut=events.findIndex(e=>e.type==='transfer');return exchange&&cut>=0?events.slice(0,cut+1):[];
      });
      return {...failure(message,at),diagnostic:{...detail,line,at,message},timelines:replay,exchange:detail.type==='transfer'?null:exchange};
    };
    const visit=(line,from,to)=>{
      const inventory=inventories[line],events=timelines[line];
      for(let index=from;index<to;index++){
        const p=routes[line][index];
        if(index)events.push({type:'move',at:p});
        const station=stations.find(s=>same([s.r,s.c],p));
        if(!station)continue;
        const board=station.type==='pickup',available=inventory[station.goal]||0;
        if(!board&&available<station.count)return tripFailure(`${names[station.goal]}乘客不足：本站需下 ${station.count} 人，车上只有 ${available} 人。`,p,line,{type:'shortage',goal:station.goal,available,required:station.count});
        if(board&&loads[line]+station.count>level.trains[line].capacity)return tripFailure('座位不够：先送一部分乘客下车，再来接这一站。',p,line,{type:'capacity',goal:station.goal,before:loads[line],boarding:station.count,capacity:level.trains[line].capacity});
        inventory[station.goal]=available+(board?station.count:-station.count);
        loads[line]+=board?station.count:-station.count;peaks[line]=Math.max(peaks[line],loads[line]);
        events.push({type:board?'board':'drop',group:station,at:p,afterLoad:loads[line],inventory:{...inventory}});
      }
      return {ok:true};
    };
    for(let line=0;line<routes.length;line++){
      const result=visit(line,0,hub?cuts[line]+1:routes[line].length);if(!result.ok)return result;
    }
    if(hub){
      const targets=routes.map((route,line)=>{
        const stock=Object.fromEntries(colors.map(color=>[color,0]));
        for(const p of route.slice(cuts[line]+1)){
          const station=stations.find(s=>same([s.r,s.c],p));
          if(station)stock[station.goal]+=(station.type==='end'?1:-1)*station.count;
        }
        return stock;
      });
      if(targets.some(stock=>Object.values(stock).some(n=>n<0)))return tripFailure('换乘后的上客多于下客，请调整接送顺序。',[hub.r,hub.c],0,{type:'transfer',reason:'配额无法平衡',incoming:0,capacity:level.trains[0].capacity});
      const moves=[];
      for(const goal of colors){
        const deltas=targets.map((stock,line)=>stock[goal]-(inventories[line][goal]||0));
        if(deltas.reduce((sum,n)=>sum+n,0)!==0)return tripFailure('换乘人数无法满足后续站点配额。',[hub.r,hub.c],0,{type:'transfer',reason:'配额无法平衡',incoming:0,capacity:level.trains[0].capacity});
        // Retain each car's own needed passengers; send surplus directly to deficits.
        // No passenger is forwarded through an intermediate car or changes twice.
        for(let from=0;from<routes.length;from++)for(let to=0;to<routes.length;to++){
          if(deltas[from]>=0||deltas[to]<=0)continue;
          const count=Math.min(-deltas[from],deltas[to]);moves.push({from,to,goal,count});
          deltas[from]+=count;deltas[to]-=count;
        }
      }
      exchange={at:[hub.r,hub.c],moves,before:inventories.map(stock=>({...stock})),after:targets.map(stock=>({...stock}))};
      // Both inventories change atomically: exchanging full cars must not create a false overload.
      for(let line=0;line<routes.length;line++){
        inventories[line]={...targets[line]};loads[line]=Object.values(targets[line]).reduce((a,b)=>a+b,0);
        peaks[line]=Math.max(peaks[line],loads[line]);
        if(loads[line]>level.trains[line].capacity)return tripFailure('换乘后座位不够，请调整乘客分配。',[hub.r,hub.c],line,{type:'transfer',reason:'换乘后超载',incoming:loads[line],capacity:level.trains[line].capacity});
        timelines[line].push({type:'transfer',at:exchange.at,afterLoad:loads[line],inventory:{...targets[line]}});
      }
      for(let line=0;line<routes.length;line++){
        const result=visit(line,cuts[line]+1,routes[line].length);if(!result.ok)return result;
      }
    }
    if(loads.some(Boolean))return failure('还有乘客留在车上，请完成所有下车配额。');
    return { ok:true,timelines,peaks,exchange,used:geometry.used,total };
  };
  M.exchangeText=exchange=>exchange?.moves.length?'换乘：'+exchange.moves.map(m=>`${['蓝','绿','紫'][m.from]}→${['蓝','绿','紫'][m.to]} ${({yellow:'黄',red:'红',cyan:'青'})[m.goal]}${m.count}人`).join('；'):'列车在换乘站交会，无需交换乘客。';
})();
