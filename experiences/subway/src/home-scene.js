/* An ambient model railway. Drawing shares the game's models, never its progress. */
(() => {
  const M=window.Metro,ctx=M.ctx,body=document.body;
  const route=[[3,1],[1,1],[1,5],[5,5],[5,1],[3,1]],path=M.smoothPath(route),lengths=[0];
  path.slice(1).forEach((p,i)=>lengths.push(lengths[i]+Math.hypot(p[0]-path[i][0],p[1]-path[i][1])));
  const total=lengths.at(-1),nearest=(r,c)=>path.reduce((best,p,i)=>Math.hypot(p[0]-r,p[1]-c)<Math.hypot(path[best][0]-r,path[best][1]-c)?i:best,0);
  const a=lengths[nearest(1,3)],b=lengths[nearest(5,3)],between=b-a;
  let frame=0,last=0,time=0,active=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const station=(r,c)=>{
    M.box(r,c,1.05,1.7,0,6,['#e5e6da','#b9c7be','#d0d9ce']);
    M.box(r,c,.65,1.2,6,20,['#e4eae3','#9db7b6','#bccfc6']);
    M.box(r,c,.84,1.5,26,4,['#529a81','#3f7f70','#478a76']);
    M.box(r+.33,c,.02,.3,6,14,['#385c65','#385c65','#385c65']);
    M.line([M.project(r+.49,c-.7,7),M.project(r+.49,c+.7,7)],'#e3bb64',2*M.camera.scale);
  };
  const house=(r,c,height,roof)=>{
    M.box(r,c,.9,.95,0,height,['#e1e5de','#b6c6c0','#cdd7cd']);
    M.box(r,c,1,1.05,height,4,[roof,roof,roof]);
    for(const z of [12,28,44].filter(z=>z<height-5))for(const col of [-.23,.19])
      M.box(r+.455,c+col,.012,.18,z,7,['#70909a','#70909a','#70909a']);
    M.box(r,c,.28,.32,height+4,5,['#e5e9e1','#bac9c0','#ced8cd']);
  };
  const tree=(r,c)=>M.station({r,c,type:'tree'});
  const draw=()=>{
    if(!active)return;
    const rect=M.canvas.getBoundingClientRect(),w=rect.width,h=rect.height,compact=w<760&&!(w>=600&&h<540);
    const scale=Math.min(compact?(w-8)/720:w*.7/720,compact?Math.max(80,h-265)/570:h*.9/570);
    const centerX=compact?w*.5:w*.67,centerY=compact?(120+h-145)/2:h*.52;
    const previous={camera:M.camera,state:M.state};
    const cycle=time%20,dwell=cycle<2||cycle>=10&&cycle<12;
    const distance=(a+(cycle<2?0:cycle<10?(cycle-2)/8*between:cycle<12?between:between+(cycle-12)/8*(total-between)))%total;
    let i=1;while(i<lengths.length-1&&lengths[i]<distance)i++;
    const u=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]||1),p=path[i-1],q=path[i];
    const r=p[0]+(q[0]-p[0])*u,c=p[1]+(q[1]-p[1])*u;
    ctx.save();
    try{
      M.camera={width:w,height:h,scale,sx:54*scale,sy:42*scale,top:centerY-6*42*scale,offsetX:centerX-w/2};
      M.state={playing:true,doors:[dwell]};
      ctx.setTransform(M.canvas.width/w,0,0,M.canvas.height/h,0,0);ctx.clearRect(0,0,w,h);
      const shadow=M.project(3.2,3.2,-20);M.ellipse(shadow.x,shadow.y,355*scale,237*scale,'#47616a0a');
      M.box(3,3,6.65,6.65,-14,12,['#e8eee5','#c1cec6','#d3ddd2']);
      M.box(3,3,6.65,6.65,-2,2,['#edf1e9','#d4ded2','#e1e8dd']);
      M.box(3,3,2.8,2.8,0,1,['#e0e8dc','#e0e8dc','#e0e8dc']);
      M.line([M.project(2,2),M.project(4.1,2),M.project(4.1,4)],'#f6f6ec',10*scale);
      M.rail(route,M.colors[0]);
      const actors=[
        {depth:3,paint:()=>station(.22,3)},
        {depth:9,paint:()=>station(5.8,3)},
        {depth:5.2,paint:()=>house(2.7,2.5,58,'#8ba9af')},
        {depth:7.3,paint:()=>house(3.6,3.7,34,'#c7907d')},
        {depth:6,paint:()=>tree(2,4)},
        {depth:5.3,paint:()=>tree(3.6,1.7)},
        {depth:9.7,paint:()=>tree(5.9,3.8)},
        {depth:r+c,paint:()=>M.train(r,c,q[0]-p[0],q[1]-p[1],0)}
      ];
      // Two tiny passengers walk between the platform and the open train door.
      if(dwell){
        const first=cycle<2,phase=first?cycle:cycle-10,walk=Math.min(1,Math.max(0,(phase-.25)/1.2));
        for(let n=0;n<2;n++){
          const row=first?.5+walk*.4:5.1+walk*.45,col=3-.2+n*.24;
          actors.push({depth:row+col,paint:()=>M.person(row,col,n?'#ce8173':'#d6ac52',6,Math.min(1,(2-phase)*3))});
        }
      }else if(cycle>12)for(let n=0;n<2;n++)actors.push({depth:3.5,paint:()=>M.person(.6,2.8+n*.24,n?'#ce8173':'#d6ac52',6)});
      actors.sort((x,y)=>x.depth-y.depth).forEach(actor=>actor.paint());
    }finally{M.camera=previous.camera;M.state=previous.state;ctx.restore();}
  };
  const tick=now=>{
    if(!active)return;const delta=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(!document.hidden&&!document.getElementById('dialog').open)time+=delta;
    if(!document.hidden)draw();frame=requestAnimationFrame(tick);
  };
  const stop=()=>{active=false;cancelAnimationFrame(frame);frame=0;last=0;};
  const start=()=>{stop();active=true;draw();if(!reduced.matches)frame=requestAnimationFrame(tick);};
  M.homeScene={start,stop};
  new ResizeObserver(()=>{if(active)draw();}).observe(M.canvas);
  reduced.addEventListener('change',()=>{if(active)start();});
  if(body.classList.contains('at-home'))start();
})();
