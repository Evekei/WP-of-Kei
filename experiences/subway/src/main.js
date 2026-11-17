(() => {
  const M=window.Metro,$=id=>document.getElementById(id);
  M.current=0;
  M.review=false;
  M.save={stars:Array(M.levels.length).fill(0),sound:true,current:0,revision:2,tutorialSeen:false,tutorials:{},drafts:{}};
  try{
    const stored=JSON.parse(localStorage.getItem('last-metro-five'));
    if(stored){
      if(stored.drafts&&typeof stored.drafts==='object'&&!Array.isArray(stored.drafts))M.save.drafts=stored.drafts;
      M.save.stars=M.save.stars.map((_,i)=>Math.max(0,Math.min(3,Number(stored.stars?.[i])||0)));
      if(stored.revision!==2){M.save.stars[18]=0;M.save.stars[19]=0;}
      M.save.sound=stored.sound!==false;
      M.save.tutorialSeen=stored.tutorialSeen===true||M.save.stars[0]>0;
      for(const [id,seen] of Object.entries(stored.tutorials||{}))if(Number(id)>=2&&Number(id)<=M.levels.length&&seen===true)M.save.tutorials[id]=true;
      const first=M.save.stars.findIndex(stars=>!stars),unlocked=first<0?M.levels.length-1:first;
      const extended=stored.stars?.length<M.levels.length&&first===stored.stars.length;
      M.save.current=extended?first:Math.max(0,Math.min(unlocked,Number(stored.current)||0));
    }
  }catch{}
  M.persist=()=>{try{localStorage.setItem('last-metro-five',JSON.stringify(M.save));}catch{}};
  let audio;
  M.audioStart=()=>{
    if(!M.save.sound)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    audio||=new Audio();audio.resume().catch(()=>{});
  };
  M.tone=frequency=>{
    if(!audio||!M.save.sound)return;
    const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
    oscillator.type='sine';oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(now);oscillator.stop(now+.13);
  };
  M.fireworkSound=(phase,color=0)=>{
    if(!audio||!M.save.sound||audio.state!=='running')return;
    const now=audio.currentTime,rise=phase==='rise',duration=rise?.18:.42;
    const gain=audio.createGain(),filter=audio.createBiquadFilter();let source;
    if(rise){
      source=audio.createOscillator();source.type='sine';
      source.frequency.setValueAtTime(420+color*35,now);source.frequency.exponentialRampToValueAtTime(1100+color*60,now+duration);
    }else{
      source=audio.createBufferSource();const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      source.buffer=buffer;
    }
    filter.type='lowpass';filter.frequency.setValueAtTime(rise?1800:2200,now);filter.frequency.exponentialRampToValueAtTime(rise?1800:380,now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(rise?.012:.085,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    source.connect(filter);filter.connect(gain);gain.connect(audio.destination);
    let ended=false;source.onended=()=>{ended=true;source.disconnect();filter.disconnect();gain.disconnect();};
    source.start(now);source.stop(now+duration);
    return ()=>{if(ended)return;gain.gain.cancelScheduledValues(audio.currentTime);gain.gain.setTargetAtTime(.0001,audio.currentTime,.005);source.stop(audio.currentTime+.025);};
  };
  M.state={token:0,playing:false,selected:0,routes:[],history:[],vehicles:[],collected:new Set(),walkers:[],doors:[]};
  M.loadLevel=(index,trial=false,fresh=false)=>{
    if(M.level){M.saveDraft?.();M.flushDraft?.();}
    if(fresh&&!trial)M.clearDraft?.(index);
    M.homeScene?.stop();
    M.tutorial?.stop();
    M.cancelPlayback();M.closeDialog();M.current=index;M.level=M.levels[index];M.size=M.level.size;
    let groupId=0;
    M.stops=M.level.stops.map(stop=>({...stop,...(stop.type==='pickup'?{groupId:groupId++}:{})}));
    M.obstacles=M.level.blocked.map(([r,c])=>({r,c,type:'tree'}));
    Object.assign(M.state,{routes:M.level.trains.map(train=>[[...train.start]]),selected:0,history:[],hint:null,hover:null,errorAt:null,success:false,failureReplay:false,trial,inspect:false,view:{zoom:1,panX:0,panY:0}});
    const restored=!fresh&&M.restoreDraft?.();
    M.resetActors();document.body.classList.remove('at-home');
    if(!trial){M.save.current=index;M.persist();}M.resize();M.updateHUD();M.message('');
    if(!restored)M.tutorial?.onLoad();
  };
  M.goHome=()=>{
    M.state.hint=null;M.drawHintAdvice?.();
    M.saveDraft?.();M.flushDraft?.();
    M.tutorial?.stop();
    M.cancelPlayback();M.closeDialog();M.review=false;document.body.classList.add('at-home');
    $('start').textContent='继续旅程';
    M.homeScene?.start();
  };
  const copy=routes=>routes.map(route=>route.map(p=>[...p]));
  M.selectLine=line=>{
    if(M.state.playing)return;
    M.state.selected=line;M.state.hint=null;M.state.errorAt=null;M.message('');M.updateHUD();
    M.tutorial?.afterSelect();
    M.saveDraft?.();
  };
  M.addTrack=(r,c,record=true)=>{
    const s=M.state;if(s.playing||M.tutorial?.blocksTrack())return false;
    s.hint=null;s.errorAt=null;
    const route=s.routes[s.selected],tail=route.at(-1);
    const old=route.findIndex(p=>p[0]===r&&p[1]===c),candidate=copy(s.routes);
    if(old>=0){if(old===route.length-1)return true;candidate[s.selected]=route.slice(0,old+1);}
    else{
      if(r!==tail[0]&&c!==tail[1]){M.message('请点击与末端同行或同列的格子。',true);return false;}
      const dr=Math.sign(r-tail[0]),dc=Math.sign(c-tail[1]),distance=Math.abs(r-tail[0])+Math.abs(c-tail[1]);
      for(let i=1;i<=distance;i++)candidate[s.selected].push([tail[0]+dr*i,tail[1]+dc*i]);
    }
    M.tutorial?.clipRoute(candidate);
    const result=M.geometry(M.level,candidate);
    if(!result.ok){M.message(result.message,true);s.errorAt=result.at;M.draw();return false;}
    if(record)s.history.push(copy(s.routes));s.routes=candidate;s.success=false;M.resetActors();
    const preview=M.level.stops.some(stop=>stop.type==='transfer')?M.plan(M.level,s.routes):null;
    M.message(preview?.ok?M.exchangeText(preview.exchange):'');M.updateHUD();M.tone(360);
    M.tutorial?.afterRoute();
    M.saveDraft?.();
    return true;
  };
  M.bindUI();
  $('undo').onclick=()=>{
    const s=M.state;if(s.playing||!s.history.length)return;
    s.routes=s.history.pop();s.hint=null;s.errorAt=null;s.success=false;M.resetActors();M.message('');M.updateHUD();
    M.tutorial?.afterRoute();
    M.tutorial?.afterUndo();
    M.saveDraft?.();
  };
  $('hint').onclick=()=>{
    const s=M.state;if(s.playing)return;
    const advice=M.pickHint?.(M.level,s.routes,s.selected);
    s.hint=advice?advice.route:M.routeHint(M.level,s.routes,s.selected);s.hintConflict=advice?.conflict||null;s.errorAt=null;
    M.message('');M.draw();
    M.tutorial?.afterHint();
  };
  $('run').onclick=()=>{
    if(M.tutorial?.blocksRun())return;
    if(M.state.playing){M.state.skip=true;return;}
    const result=M.plan(M.level,M.state.routes);
    if(!result.ok){
      M.state.errorAt=result.at;
      if(result.diagnostic){M.tutorial?.stop();M.audioStart();M.play(result);}
      else if(M.showFailure)M.showFailure({type:'missing',at:result.at,message:result.message});
      else{M.message(result.message,true);M.draw();}return;
    }
    M.tutorial?.onRun();M.audioStart();M.play(result);
  };
  M.loadLevel(M.save.current);M.goHome();new ResizeObserver(M.resize).observe(M.canvas);
})();
