(() => {
  const M=window.Metro,$=id=>document.getElementById(id);
  const paths={
    reset:'<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>',
    settings:'<path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 2-1 3 2 3-2v-3l3-2-1-3-3-1-1-3Z"/><circle cx="11" cy="11" r="3"/>',
    undo:'<path d="m8 5-5 5 5 5M3 10h10a7 7 0 0 1 7 7v2"/>',
    hint:'<path d="M8 17c0-4-3-4-3-8a7 7 0 0 1 14 0c0 4-3 4-3 8ZM9 21h6"/>',
    play:'<path d="m8 5 11 7-11 7Z"/>',skip:'<path d="m4 5 9 7-9 7ZM19 5v14"/>',
    train:`<path d="${M.symbols.train}"/>`,person:`<path d="${M.symbols.person}"/>`,
    rail:'<path d="M7 2 5 22M17 2l2 20M7 5h10M6 10h12M6 15h12M5 20h14"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    sound:'<path d="M3 9h4l5-5v16l-5-5H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    home:'<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
    transfer:'<path d="M3 7h18l-4-4m4 4-4 4M21 17H3l4-4m-4 4 4 4"/>',
    check:'<path d="m5 12 5 5L20 6"/>',zoom:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',minus:'<path d="M5 12h14"/>',plus:'<path d="M5 12h14M12 5v14"/>',fit:'<path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5"/>'
  };
  M.icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
  M.message=(text,error=false)=>{$('message').textContent=text;$('message').classList.toggle('error',error);};
  M.modal=html=>{
    M.clearFailure?.();
    M.celebrate?.stop();
    const dialog=$('dialog');if(dialog.open)dialog.close();
    $('dialog-content').innerHTML=html;dialog.showModal();
  };
  M.isPaused=()=>$('dialog').open||!!M.tutorial?.paused;
  M.closeDialog=()=>{M.clearFailure?.();M.celebrate?.stop();if($('dialog').open)$('dialog').close();};
  M.updateHUD=()=>{
    const s=M.state;
    $('level-number').innerHTML=`${String(M.current+1).padStart(2,'0')} <small>/ ${M.levels.length}${s.trial?' · 试玩':''}</small>`;
    document.querySelector('.hud-bottom').classList.toggle('two-trains',M.level.trains.length>1);
    document.querySelector('.hud-bottom').classList.toggle('three-trains',M.level.trains.length===3);
    $('vehicles').innerHTML=M.level.trains.map((train,i)=>{
      const rails=train.budget-s.routes[i].length+1;
      return `<button class="vehicle-card ${s.selected===i?'selected':''}" style="--line-color:${M.colors[i]}" data-line="${i}" aria-pressed="${s.selected===i}" aria-label="选择${['蓝','绿','紫'][i]}色列车，最大载客 ${train.capacity} 人，轨道剩余 ${rails} 段，上限 ${train.budget} 段" ${s.playing?'disabled':''}><span class="vehicle-row">${M.icon('train')}</span><span class="vehicle-load">${M.icon('person')}<b>${train.capacity}</b></span><span class="vehicle-rails ${rails<=1?'low':''}">轨道余 <b>${rails}</b></span></button>`;
    }).join('');
    const remaining=M.level.totalBudget-s.routes.reduce((sum,route)=>sum+route.length-1,0);
    $('rail-stock').innerHTML=`${M.icon('rail')}<span><b>${remaining}</b><small>总轨道剩余数</small></span>`;
    $('rail-stock').setAttribute('aria-label',`总轨道剩余数 ${remaining} 段，总上限 ${M.level.totalBudget} 段`);
    $('rail-stock').classList.toggle('low',remaining<=2);
    $('undo').disabled=s.playing||!s.history.length;$('hint').disabled=s.playing;
    $('run').innerHTML=M.icon(s.playing?'skip':'play');
    $('run').setAttribute('aria-label',s.playing?'跳过动画':'发车');
    $('run').disabled=!!M.tutorial?.blocksRun();
    M.updateViewUI?.();
    M.draw();
    M.tutorial?.layout();
  };
  M.showGuide=()=>M.modal(`<h2>操作与标记</h2>
    <div class="guide-row">${M.icon('train')}<p><b>始发车库</b>铁路从这里出发。上方小人＋数字表示该车最大载客人数。</p></div>
    <div class="guide-row"><span class="sign-example">2${M.signSVG('up')}</span><p><b>UP 定位针：上车站</b>数字表示仍需上车的人数，例如 2 人。</p></div>
    <div class="guide-row"><span class="sign-example">2${M.signSVG('down')}</span><p><b>圈 X 定位针：下车站</b>送到同色站房，数字表示仍需下车的人数。</p></div>
    <div class="guide-row">${M.icon('transfer')}<p><b>双向箭头：换乘站</b>列车到齐后，按后续配额自动换乘，可保留部分人数。三车关两条支线在此结束，由主线继续送达。普通格仍不能相交，轨道边不能共用。</p></div>
    <div class="guide-row">${M.icon('check')}<p><b>勾：检查站</b>屋顶颜色指定必须经过的列车；多个勾不规定先后顺序。</p></div>
    <div class="guide-row">${M.icon('zoom')}<p><b>大地图查看</b>点左上放大镜进入查看，拖动平移，按钮、滚轮或双指缩放；再点放大镜返回铺轨，保留视角。</p></div>
    <div class="guide-row">${M.icon('hint')}<p><b>淡色提示与暖橙冲突</b>优先显示能接入当前规划的未完成关键段。暖橙色表示这条参考方案与现有线路或预算冲突，不代表你的整套方案无解；不同合法路线仍可通关。</p></div>
    <p class="guide-bottom">屋顶人数随上下车减少，完成后为 0。同色人数可以合并，到站只下指定人数。每站由一辆车服务，只有换乘站允许线路相交，铁轨边不能共用。总轨道与每车上限必须同时满足。点击始发车库或左下角列车切换线路；点击同行同列，或按住拖动铺轨；点击旧节点截短，一次拖动可一次撤销。</p>`);
  M.showLevels=()=>{
    const unlocked=Math.min(M.levels.length,1+M.save.stars.findIndex(value=>!value));
    const count=M.save.stars.every(Boolean)?M.levels.length:unlocked;
    M.modal(`<h2>关卡选择</h2><div class="level-options"><button data-action="review" aria-pressed="${M.review}">自由试玩 ${M.review?'开':'关'}</button><small>试玩不记录星级或解锁</small></div><div class="level-grid">${M.levels.map((level,i)=>`<button class="level-tile ${i===M.current?'current':''}" data-level="${i}" title="${level.name}" aria-label="第 ${i+1} 关 ${level.name}${M.review?' 试玩':i>=count?'，未解锁':''}" ${!M.review&&i>=count?'disabled':''}>${i+1}<span class="map-name">${level.name}</span><span class="difficulty ${level.difficulty>=4?'hard':''}">${level.difficulty===5?'极难':level.difficulty===4?'高难':level.difficulty===3?'中等':'入门'}</span><small>${'★'.repeat(M.save.stars[i]||0)||'·'}</small></button>`).join('')}</div>`);
  };
  M.showSettings=()=>M.modal(`<h2>设置</h2>
    <button class="menu-row" data-action="levels"><span>${M.icon('grid')}关卡选择</span></button>
    <label class="menu-row"><span>${M.icon('sound')}音效</span><input id="sound-toggle" type="checkbox" aria-label="音效" ${M.save.sound?'checked':''}></label>
    <button class="menu-row" data-action="guide"><span>${M.icon('hint')}操作与标记</span></button>
    <button class="menu-row" data-action="tutorials"><span>${M.icon('play')}关卡教程</span></button>
    <button class="menu-row" data-action="home"><span>${M.icon('home')}回到主页</span></button>`);
  M.showTutorials=()=>{
    const entries=[[1,{title:'基础接送与铺轨'}],...Object.entries(M.lessonDefinitions).map(([id,d])=>[Number(id),d])];
    M.modal(`<h2>关卡教程</h2>${entries.map(([id,d])=>`<button class="menu-row tutorial-entry" data-tutorial-level="${id}"><span><b>${String(id).padStart(2,'0')}</b>${d.title}</span><small>${(id===1?M.save.tutorialSeen:M.save.tutorials[id])||M.save.stars[id-1]?'已学':'重看'}</small></button>`).join('')}`);
  };
  M.complete=plan=>{
    const stars=plan.used<=M.level.optimal?3:plan.used<=M.level.optimal+2?2:1;
    if(!M.state.trial){
      M.clearDraft?.(M.current);
      M.save.stars[M.current]=Math.max(M.save.stars[M.current]||0,stars);
      M.save.current=Math.min(M.current+1,M.levels.length-1);M.persist();
    }
    M.tone(880);const last=M.current===M.levels.length-1;
    const pattern=M.level.pattern&&M.state.routes.every((route,i)=>route.length===M.level.referenceSolution[i].length&&route.every((p,j)=>p[0]===M.level.referenceSolution[i][j][0]&&p[1]===M.level.referenceSolution[i][j][1]));
    M.modal(`<div class="result"><h2>${M.state.trial?'试玩完成':last?`${M.levels.length}站，都到了`:'到站了'}</h2><div class="stars" aria-label="${stars} 星">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><p>送达 ${plan.total} 位乘客 · 使用 ${plan.used} 段铁轨</p>${pattern?`<p class="pattern-result">你把${M.level.pattern}串起来了。</p>`:''}<button class="primary" data-action="${last?'home':'next'}">${last?'回到主页':'下一关'}</button><button class="text-button" data-action="replay">再试一次</button></div>`);
    M.celebrate?.();
  };
  M.bindUI=()=>{
    for(const [id,icon] of [['reset','reset'],['settings','settings'],['undo','undo'],['hint','hint'],['run','play'],['close-dialog','close']])$(id).innerHTML=M.icon(icon);
    $('settings').onclick=M.showSettings;$('close-dialog').onclick=M.closeDialog;
    $('home-settings').innerHTML=M.icon('settings');$('home-settings').onclick=M.showSettings;
    $('home-levels').onclick=M.showLevels;
    $('start').onclick=()=>{M.review=false;M.loadLevel(M.save.current);M.audioStart();};
    $('reset').onclick=()=>M.loadLevel(M.current,M.state.trial,true);
    $('vehicles').onclick=e=>{const b=e.target.closest('[data-line]');if(b)M.selectLine(Number(b.dataset.line));};
    $('dialog').addEventListener('change',e=>{if(e.target.id==='sound-toggle'){M.save.sound=e.target.checked;M.persist();if(M.save.sound){M.audioStart();M.tone(620);}}});
    $('dialog-content').onclick=e=>{
      const button=e.target.closest('button');if(!button)return;
      if(button.dataset.tutorialLevel!==undefined){M.loadLevel(Number(button.dataset.tutorialLevel)-1,true);M.tutorial.begin(true);M.audioStart();return;}
      if(button.dataset.level!==undefined){M.loadLevel(Number(button.dataset.level),M.review);M.audioStart();return;}
      const actions={levels:M.showLevels,review:()=>{M.review=!M.review;M.showLevels();},guide:M.showGuide,tutorials:M.showTutorials,'fix-failure':()=>{M.closeDialog();M.canvas.focus({preventScroll:true});},home:M.goHome,next:()=>M.loadLevel(M.current+1,M.state.trial),replay:()=>M.loadLevel(M.current,M.state.trial,true)};
      actions[button.dataset.action]?.();
    };
  };
})();
