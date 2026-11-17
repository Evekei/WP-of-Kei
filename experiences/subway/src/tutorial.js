/* The first trip is the lesson: each popup waits for an actual player action. */
(() => {
  const M=window.Metro,$=id=>document.getElementById(id);
  const dialog=$('tutorial-dialog'),task=$('tutorial-task'),overlay=$('tutorial-overlay');
  const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
  const T=M.tutorial={active:false,paused:false,step:null};
  let release=null;
  const markSeen=()=>{M.save.tutorialSeen=true;M.persist();};
  const used=()=>M.state.routes[0].length-1;
  const sign=(type,count=1)=>`<span class="tutorial-sign">${count} ${M.signSVG(type)}</span>`;
  const panels=()=>({
    intro:{number:1,title:'铁路从这里开始',visual:M.icon('train'),focus:'depot',
      text:'车辆标记就是始发站。',button:'下一步',next:'pickupIntro'},
    pickupIntro:{number:2,title:'到 UP 站接人',visual:sign('up'),focus:'pickup',
      text:'UP 接人，数字 1 表示上车 1 人。',button:'我来铺轨',next:'pickup'},
    dropIntro:{number:3,title:'到同色圈 X 站送人',visual:sign('down'),focus:'end',
      text:'圈 X 送人，数字 1 表示送达 1 人。',button:'下一步',next:'carRails'},
    carRails:{number:4,title:'这辆车还能铺多少？',visual:`${M.icon('rail')}<strong>${M.level.trains[0].budget-used()}</strong>`,focus:'carRails',
      text:`本车还可以铺 ${M.level.trains[0].budget-used()} 段铁轨。`,button:'下一步',next:'totalRails'},
    totalRails:{number:5,title:'所有车辆共用的铁轨',visual:`${M.icon('rail')}<strong>${M.level.totalBudget-used()}</strong>`,focus:'totalRails',
      text:'这是总余量。本车和总余量都要够用。',button:'继续铺轨',next:'drop'},
    readyIntro:{number:6,title:'连好了，点这里发车',visual:M.icon('play'),focus:'run',
      text:'接送站已连通，轮到你发车了。',button:'我来发车',next:'ready'},
    boarded:{number:7,title:'乘客接完，数字归零',visual:`<span class="tutorial-count-change">1 <span>→</span></span>${sign('up',0)}`,focus:'pickup',
      text:'上车站变成 0，表示这里已接完。',button:'下一步',next:'capacity'},
    capacity:{number:8,title:'小人旁边是最大人数',visual:`${M.icon('person')}<strong>${M.level.trains[0].capacity}</strong>`,focus:'capacity',
      text:`这辆车最多载 ${M.level.trains[0].capacity} 人，不能超载。`,button:'继续行驶',next:'travel'},
    arrived:{number:9,title:'送到了，数字归零',visual:sign('down',0),focus:'end',
      text:'下车站变成 0，表示这里已送达。',button:'完成第一程',next:null}
  });
  T.stop=()=>{
    M.lessonTutorial?.stop();
    T.active=false;T.paused=false;T.step=null;
    if(dialog.open)dialog.close();task.hidden=true;overlay.hidden=true;
    document.body.classList.remove('in-tutorial');
    const resolve=release;release=null;resolve?.();
  };
  const finish=()=>{markSeen();T.stop();M.resize();M.updateHUD();M.canvas.focus({preventScroll:true});};
  T.begin=(force=false)=>{
    if(M.current!==0)return M.lessonTutorial?.begin(force);
    if(M.current!==0||(!force&&(M.state.trial||M.save.tutorialSeen)))return;
    T.stop();M.closeDialog();T.active=true;document.body.classList.add('in-tutorial');
    M.message('');T.show('intro');M.resize();
  };
  T.onLoad=()=>queueMicrotask(()=>{
    if(!document.body.classList.contains('at-home'))T.begin();
  });
  T.show=step=>{
    T.step=step;const allPanels=panels(),panel=allPanels[step];T.paused=!!panel;
    dialog.dataset.focus=['carRails','totalRails','capacity'].includes(step)?'hud':'board';
    M.stopDrawing?.();if(dialog.open)dialog.close();
    task.hidden=!!panel;
    if(panel){
      T.renderPanel(panel,Object.keys(allPanels).length,'第一程');
    }else{
      const label=step==='pickup'?'从蓝色始发站，铺到红色 UP 站':step==='drop'?'从铁路末端，铺到红色圈 X 站':'点击右下角，让列车出发';
      task.hidden=step==='travel';
      task.innerHTML=`<b>${label}</b><p>${step==='ready'?'铁路已连通，轮到你发车了。':'按住拖动，或点击同一行、同一列的格子。'}</p><button data-tutorial="skip">跳过教学</button>`;
      M.canvas.focus({preventScroll:true});
    }
    M.updateHUD();
  };
  T.renderPanel=(panel,total,label)=>{
    dialog.dataset.wide=String(!!panel.wide);
    $('tutorial-content').innerHTML=`<span class="tutorial-progress">${label} · ${panel.number}/${total}</span><div class="tutorial-visual" aria-hidden="true">${panel.visual}</div><h2 id="tutorial-title">${panel.title}</h2><p>${panel.text}</p><button class="primary" data-tutorial="continue">${panel.button||'下一步'}</button><button class="text-button" data-tutorial="skip">跳过教学</button>`;
    if(!dialog.open)dialog.showModal();
  };
  const act=e=>{
    const action=e.target.closest('[data-tutorial]')?.dataset.tutorial;
    if(M.lessonTutorial?.running){M.lessonTutorial.action(action);return;}
    if(action==='skip'){finish();return;}
    if(action!=='continue')return;
    const next=panels()[T.step]?.next;
    if(!next){finish();return;}
    T.show(next);
    if(!T.paused){const resolve=release;release=null;resolve?.();}
  };
  $('tutorial-content').addEventListener('click',act);task.addEventListener('click',act);
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(M.lessonTutorial?.running)M.lessonTutorial.action('skip');else finish();});
  T.blocksTrack=()=>M.lessonTutorial?.running?T.paused:T.active&&!['pickup','drop'].includes(T.step);
  T.blocksRun=()=>M.lessonTutorial?.running?T.paused:T.active&&T.step!=='ready';
  T.clipRoute=routes=>{
    if(M.lessonTutorial?.running){M.lessonTutorial.clipRoute(routes);return;}
    if(!T.active)return;
    const target=T.step==='pickup'?[1,3]:[1,6],i=routes[0].findIndex(p=>same(p,target));
    if(i>=0)routes[0]=routes[0].slice(0,i+1);
  };
  T.afterRoute=()=>{
    if(M.lessonTutorial?.running){M.lessonTutorial.check('route');return;}
    if(!T.active||T.paused)return;
    const route=M.state.routes[0],hasPickup=route.some(p=>same(p,[1,3])),hasDrop=route.some(p=>same(p,[1,6]));
    if(T.step==='pickup'&&hasPickup)T.show('dropIntro');
    else if(T.step==='drop'&&hasDrop)T.show('readyIntro');
    else if(!hasPickup&&T.step!=='pickup')T.show('pickup');
    else if(!hasDrop&&T.step==='ready')T.show('drop');
    else T.layout();
  };
  T.afterSelect=()=>M.lessonTutorial?.check('select');
  T.afterUndo=()=>M.lessonTutorial?.check('undo');
  T.afterView=()=>M.lessonTutorial?.check('view');
  T.afterHint=()=>M.lessonTutorial?.check('hint');
  T.onTransfer=(event,token)=>M.lessonTutorial?.event('transfer',event,token);
  T.onComplete=()=>M.lessonTutorial?.complete();
  T.onRun=()=>{if(M.lessonTutorial?.running){M.lessonTutorial.onRun();return;}if(T.active)T.show('travel');};
  T.onPassenger=(event,token,line)=>{
    if(M.lessonTutorial?.running)return M.lessonTutorial.event('passenger',event,token,line);
    if(!T.active||T.step!=='travel'||token!==M.state.token)return;
    return new Promise(resolve=>{release=resolve;T.show(event.type==='board'?'boarded':'arrived');});
  };
  T.layout=()=>{
    if(!T.active||!M.camera)return;
    const rect=M.canvas.getBoundingClientRect(),ratio=rect.width/M.camera.width;
    const project=(r,c,z=0)=>{const p=M.project(r,c,z);return {x:rect.left+p.x*ratio,y:rect.top+p.y*ratio};};
    const station=(r,c,z)=>{const p=project(r,c,z);return {x:p.x-35,y:p.y-27,width:70,height:65};};
    const element=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {x:b.left-7,y:b.top-7,width:b.width+14,height:b.height+14};};
    let holes=[],path=null;
    const focus=panels()[T.step]?.focus;
    if(focus==='depot')holes=[station(1,1,24)];
    if(focus==='pickup')holes=[station(1,3,16)];
    if(focus==='end'||T.step==='drop')holes=[station(1,6,20)];
    if(focus==='carRails')holes=[element('#vehicles .vehicle-rails')];
    if(focus==='totalRails')holes=[element('#rail-stock')];
    if(focus==='capacity')holes=[element('#vehicles .vehicle-load')];
    if(focus==='run'||T.step==='ready')holes=[element('#run')];
    if(['pickup','drop'].includes(T.step)){
      const a=project(...M.state.routes[0].at(-1)),b=project(1,T.step==='pickup'?3:6);
      path=`M${a.x} ${a.y}L${b.x} ${b.y}`;
      holes.push({x:Math.min(a.x,b.x)-22,y:Math.min(a.y,b.y)-28,width:Math.abs(b.x-a.x)+44,height:Math.abs(b.y-a.y)+56});
    }
    if(M.lessonTutorial?.running)({holes,path}=M.lessonTutorial.layout({rect,project,station,element}));
    overlay.hidden=T.step==='travel';
    if(M.lessonTutorial?.running&&M.lessonTutorial.silent)overlay.hidden=true;
    const cutouts=holes.map(b=>`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="14" fill="black"/>`).join('');
    const rings=holes.slice(0,2).map(b=>`<rect class="tutorial-ring" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="14"/>`).join('');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(M.lessonTutorial?.running)M.lessonTutorial.place(holes,rect);
    let pointer='';
    if(T.paused&&holes.length){
      const b=holes[0],card=dialog.getBoundingClientRect();let a,end,horizontal=false;
      if(b.x>card.right){a={x:card.right,y:card.top+card.height/2};end={x:b.x+4,y:b.y+b.height/2};horizontal=true;}
      else if(b.x+b.width<card.left){a={x:card.left,y:card.top+card.height/2};end={x:b.x+b.width-4,y:b.y+b.height/2};horizontal=true;}
      else if(b.y>card.bottom){a={x:card.left+card.width/2,y:card.bottom};end={x:b.x+b.width/2,y:b.y+4};}
      else{a={x:card.left+card.width/2,y:card.top};end={x:b.x+b.width/2,y:b.y+b.height-4};}
      const mid=horizontal?(a.x+end.x)/2:(a.y+end.y)/2;
      const curve=horizontal?`C${mid} ${a.y} ${mid} ${end.y} ${end.x} ${end.y}`:`C${a.x} ${mid} ${end.x} ${mid} ${end.x} ${end.y}`;
      pointer=`<path class="tutorial-pointer" d="M${a.x} ${a.y}${curve}" marker-end="url(#tutorial-arrow)"/>`;
    }
    const motion=path?`<path d="${path}" stroke="#438bab" stroke-width="3" stroke-dasharray="5 6"/><g class="tutorial-hand" ${reduced?`transform="translate(${holes.at(-1).x+22} ${holes.at(-1).y+28})"`:''}><path d="M0 0V-10Q0-15 4-15Q8-15 8-10V-3Q13-7 16-2L21 7Q23 11 19 16H6L-3 7Q-6 2-2 1Z" fill="white" stroke="#304954" stroke-width="2"/>${reduced?'':`<animateMotion dur="2.3s" repeatCount="indefinite" path="${path}"/>`}</g>`:'';
    // Keep a running gesture animation alive while HUD/canvas repaint.
    const svg=`<svg viewBox="0 0 ${rect.width} ${rect.height}"><defs><marker id="tutorial-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#438bab"/></marker><mask id="tutorial-light"><rect width="100%" height="100%" fill="white"/>${cutouts}</mask></defs><rect width="100%" height="100%" fill="#233d49" opacity="${T.paused?.28:.09}" mask="url(#tutorial-light)"/>${rings}${pointer}${motion}</svg>`;
    if(overlay.innerHTML!==svg)overlay.innerHTML=svg;
  };
})();
