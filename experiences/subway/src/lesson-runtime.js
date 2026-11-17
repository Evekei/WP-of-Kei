/* Later lessons share the first lesson's popup, spotlight and animation renderer. */
(() => {
  const M=window.Metro,T=M.tutorial,$=id=>document.getElementById(id);
  const L=M.lessonTutorial={running:false,silent:false};let lesson=null,index=0,release=null,context={},observed=false;
  const dialog=$('tutorial-dialog'),task=$('tutorial-task');
  const current=()=>lesson?.steps[index];
  const value=v=>typeof v==='function'?v(context):v;
  L.stop=()=>{
    L.running=false;L.silent=false;lesson=null;observed=false;
    const resume=release;release=null;resume?.();
    dialog.dataset.lesson='';task.dataset.lesson='';
    for(const name of ['top','bottom','left','right'])dialog.style?.removeProperty(name);
    for(const name of ['top','bottom','left','right'])task.style?.removeProperty(name);
  };
  const finish=()=>{
    const id=M.current+1;M.save.tutorials[id]=true;M.persist();
    T.stop();M.resize();M.updateHUD();M.canvas.focus({preventScroll:true});
  };
  L.begin=force=>{
    const id=M.current+1,definition=M.lessonDefinitions[id];
    if(!definition||!force&&(M.state.trial||definition.auto===false||M.save.tutorials[id]||M.save.stars[id-1]))return;
    T.stop();M.closeDialog();lesson=definition.create();index=0;context={};observed=false;
    L.running=true;T.active=true;document.body.classList.add('in-tutorial');M.message('');L.show();
  };
  L.show=()=>{
    const page=current();if(!page){finish();return;}
    M.stopDrawing?.();if(dialog.open)dialog.close();
    observed=false;T.step=`lesson:${M.current+1}:${index}`;
    T.paused=page.type==='panel';L.silent=page.type==='watch';
    task.hidden=page.type!=='action';dialog.dataset.lesson='later';task.dataset.lesson='later';
    if(page.type==='panel')render(page);
    if(page.type==='action'){
      task.innerHTML=`<b>${page.title}</b><p>${page.text||'按图示试一次，完成后继续。'}</p><button data-tutorial="skip">跳过教学</button>`;
      M.canvas.focus({preventScroll:true});
      if(page.kind!=='undo')queueMicrotask(()=>L.check(page.kind));
    }
    M.updateHUD();
  };
  const render=page=>{
    const panel={title:value(page.title),text:value(page.text),visual:value(page.visual),button:page.button||'下一步',wide:page.wide,
      number:lesson.steps.slice(0,index+1).filter(p=>p.type!=='action').length};
    const focus=value(page.focus);dialog.dataset.focus=focus?.selector?'hud':'board';
    T.renderPanel(panel,lesson.steps.filter(p=>p.type!=='action').length,`第${M.current+1}关`);
  };
  const next=()=>{
    index++;L.show();
    if(!T.paused){const resume=release;release=null;resume?.();}
  };
  L.action=action=>{
    if(!L.running)return;
    if(action==='skip'){finish();return;}
    if(action==='continue'&&(current()?.type==='panel'||observed))next();
  };
  L.check=kind=>{
    if(!L.running||T.paused)return;
    const page=current();
    if(page.type==='action'&&page.kind===kind&&page.done())next();
    else if(page.type==='action')T.layout();
  };
  L.clipRoute=routes=>{
    const page=current();if(page?.type!=='action'||!page.stopAt)return;
    const line=page.line??M.state.selected,route=routes[line],p=page.stopAt;
    const hit=route.findIndex(q=>q[0]===p[0]&&q[1]===p[1]);if(hit>=0)routes[line]=route.slice(0,hit+1);
  };
  L.onRun=()=>{L.check('run');if(L.running&&current().type==='watch'){L.silent=true;task.hidden=true;T.layout();}};
  L.event=(kind,event,token,line)=>{
    const page=current();
    if(!L.running||observed||T.paused||page?.type!=='watch'||page.kind!==kind||token!==M.state.token||page.test&&!page.test(event,line))return;
    context={event,line,load:line===undefined?0:M.state.vehicles[line].load};observed=true;T.paused=true;L.silent=false;
    M.stopDrawing?.();task.hidden=true;render(page);M.updateHUD();
    return new Promise(resolve=>{release=resolve;});
  };
  L.complete=()=>{if(L.running)finish();};
  L.layout=({rect,project,station,element})=>{
    const page=current();if(!page||L.silent)return {holes:[],path:null};
    const focus=value(page.focus),holes=[];let path=null;
    if(focus?.selector)holes.push(element(focus.selector));
    if(focus?.station){const p=focus.station,s=[...M.stops,...M.obstacles].find(s=>s.r===p[0]&&s.c===p[1]);holes.push(station(...p,s?.type==='depot'?24:s?.type==='end'?20:s?.type==='tree'?28:16));}
    if(focus?.cell){const p=project(...focus.cell);holes.push({x:p.x-24,y:p.y-24,width:48,height:48});}
    if(focus?.area)holes.push({x:rect.width*.3,y:rect.height*.3,width:rect.width*.4,height:rect.height*.22});
    if(page.type==='action'){
      if(page.kind==='route'){
        const route=M.state.routes[page.line??M.state.selected],ref=M.level.referenceSolution[page.line??M.state.selected];
        if(route.every((p,i)=>ref[i]&&String(p)===String(ref[i]))){
          const limit=page.stopAt?ref.findIndex(p=>String(p)===String(page.stopAt))+1:ref.length;
          const points=ref.slice(route.length-1,Math.min(route.length+2,limit)).map(p=>project(...p));
          if(points.length>1)path=points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join('');
        }
      }else if(page.gesture==='pan')path=`M${rect.width*.4} ${rect.height*.4}L${rect.width*.6} ${rect.height*.43}`;
      else if(holes[0]){const b=holes[0];path=`M${b.x+b.width/2} ${b.y+b.height/2}L${b.x+b.width/2} ${b.y+b.height/2+4}`;}
    }
    return {holes,path};
  };
  L.place=(holes,rect)=>{
    if(!holes.length)return;
    const box=holes[0],panel=T.paused?dialog:task;
    if(rect.width>650)for(const name of ['top','bottom','left','right'])panel.style.removeProperty(name);
    const b=panel.getBoundingClientRect();
    if(rect.width<=650){
      panel.style.left='16px';panel.style.right='16px';
      const low=M.level.trains.length===3?190:122;
      const bottom=T.paused?16:low,top=78;
      const overlap=y=>Math.max(0,Math.min(y+b.height,box.y+box.height)-Math.max(y,box.y));
      const bottomTop=rect.height-bottom-b.height;
      const useTop=overlap(top)<overlap(bottomTop);
      panel.style.top=useTop?`${top}px`:'auto';panel.style.bottom=useTop?'auto':`${bottom}px`;
    }else if(T.paused){
      const overlapsY=box.y<b.bottom+12&&box.y+box.height>b.top-12;
      const moveRight=overlapsY&&box.x<32+b.width+12&&box.x+box.width>20;
      dialog.style.left=moveRight?'auto':'32px';dialog.style.right=moveRight?'32px':'auto';
    }
  };
})();
