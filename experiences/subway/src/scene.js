/* Canvas orthographic primitives. All coordinates are in board cells. */
window.Metro = { colors: ['#438bab', '#529a81', '#8b7eab'], depotHeight:42, canvas: document.querySelector('#scene') };
(() => {
  const M = window.Metro;
  const ctx = M.canvas.getContext('2d');
  M.ctx = ctx;
  M.camera = { width: 780, height: 570, sx: 54, sy: 42, top: 106 };
  M.project = (r, c, z = 0) => ({ x: M.camera.width / 2 + (M.camera.offsetX||0) + (c - r) * M.camera.sx, y: M.camera.top + (c + r) * M.camera.sy - z * (M.camera.scale || 1) });
  M.unproject = (x, y) => {
    const a = (x - M.camera.width / 2 - (M.camera.offsetX||0)) / M.camera.sx;
    const b = (y - M.camera.top) / M.camera.sy;
    return [(b - a) / 2, (b + a) / 2];
  };
  M.poly = (points, fill, stroke, width = 1) => {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  };
  M.line = (points, color, width = 1) => {
    if (!points.length) return;
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  };
  M.box = (r, c, rw, cw, z, height, colors) => {
    const corners = [[r-rw/2,c-cw/2],[r-rw/2,c+cw/2],[r+rw/2,c+cw/2],[r+rw/2,c-cw/2]];
    const lo = corners.map(p => M.project(...p,z)), hi = corners.map(p => M.project(...p,z+height));
    M.poly([lo[1],lo[2],hi[2],hi[1]], colors[1]);
    M.poly([lo[2],lo[3],hi[3],hi[2]], colors[2]);
    M.poly(hi, colors[0]);
  };
  M.ellipse = (x, y, rx, ry, color) => {
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
  };
  M.person = (r,c,color,z=0,opacity=1) => {
    const point=M.project(r,c,z),scale=M.camera.scale||1;
    ctx.save();ctx.translate(point.x,point.y);ctx.scale(scale,scale);ctx.globalAlpha=opacity;
    const p={x:0,y:0};
    M.ellipse(p.x+2,p.y+1,5,2.3,'#33434b20');
    ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(p.x-3.7,p.y-12,7.4,12,3.5); ctx.fill();
    M.ellipse(p.x,p.y-15,4,4,'#f0ccb0');
    M.ellipse(p.x,p.y-17,3.7,2,'#39434a');
    M.line([{x:p.x-2,y:p.y-1},{x:p.x-2,y:p.y+2}], '#3a4850',1.8);
    M.line([{x:p.x+2,y:p.y-1},{x:p.x+2,y:p.y+2}], '#3a4850',1.8);
    ctx.restore();
  };
  M.smoothPath = path => {
    if(path.length<2) return path.map(p=>[...p]);
    const out = [[...path[0]]];
    for(let i=1;i<path.length-1;i++) {
      const a=path[i-1], b=path[i], c=path[i+1], radius=.22;
      const q=[b[0]+(a[0]-b[0])*radius,b[1]+(a[1]-b[1])*radius];
      const t=[b[0]+(c[0]-b[0])*radius,b[1]+(c[1]-b[1])*radius];
      out.push(q);
      for(let j=1;j<=8;j++) {
        const u=j/8, v=1-u;
        out.push([v*v*q[0]+2*v*u*b[0]+u*u*t[0],v*v*q[1]+2*v*u*b[1]+u*u*t[1]]);
      }
    }
    out.push([...path[path.length-1]]);
    const sampled=[];
    for(let i=1;i<out.length;i++) {
      const a=out[i-1],b=out[i],dist=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const n=Math.max(1,Math.ceil(dist/.055));
      for(let j=0;j<n;j++) sampled.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);
    }
    sampled.push(out[out.length-1]); return sampled;
  };
  M.rail = (path,color,alpha=1) => {
    if(path.length<2) return;
    const scale=M.camera.scale||1;
    ctx.save(); ctx.globalAlpha=alpha;
    const curve=M.smoothPath(path), points=curve.map(p=>M.project(...p,1));
    ctx.globalAlpha=alpha*.3;M.line(points,color,19*scale);ctx.globalAlpha=alpha;
    M.line(points,'#c6ccc6',15*scale);
    let accumulated=0;
    const sides=[[],[]];
    curve.forEach((p,i)=>{
      const a=curve[Math.max(0,i-1)], b=curve[Math.min(curve.length-1,i+1)];
      const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
      const normal=[-(b[1]-a[1])/len,(b[0]-a[0])/len];
      if(i) accumulated+=Math.hypot(p[0]-a[0],p[1]-a[1]);
      if(accumulated>.14) {
        M.line([M.project(p[0]+normal[0]*.155,p[1]+normal[1]*.155,2),M.project(p[0]-normal[0]*.155,p[1]-normal[1]*.155,2)],'#92958a',4*scale);
        accumulated=0;
      }
      [-1,1].forEach((side,j)=>sides[j].push(M.project(p[0]+normal[0]*.085*side,p[1]+normal[1]*.085*side,4)));
    });
    sides.forEach(side=>{M.line(side,'#50616a',3.2*scale);M.line(side.map(p=>({x:p.x,y:p.y-.6*scale})),'#e9edef',1.1*scale);});
    const a=path[0], end=path[path.length-1];
    M.line([M.project(a[0]-.17,a[1],1),M.project(a[0]+.17,a[1],1)],color,4*scale);
    if(!M.state.playing) {
      const p=M.project(...end,6); M.ellipse(p.x,p.y,9*scale,4*scale,color);M.ellipse(p.x,p.y,4*scale,2*scale,'#ffffff');
    }
    ctx.restore();
  };
  M.train = (r,c,dr,dc,index,load=0) => {
    const color=M.colors[index];
    const len=Math.hypot(dr,dc)||1; dr/=len;dc/=len;
    const local=(x,y,z)=>M.project(r+dr*x-dc*y,c+dc*x+dr*y,z);
    const cube=(x,y,w,d,z,h,cols)=>{
      const a=[local(x-w/2,y-d/2,z),local(x+w/2,y-d/2,z),local(x+w/2,y+d/2,z),local(x-w/2,y+d/2,z)];
      const b=[local(x-w/2,y-d/2,z+h),local(x+w/2,y-d/2,z+h),local(x+w/2,y+d/2,z+h),local(x-w/2,y+d/2,z+h)];
      const faces=[0,1,2,3].map(i=>({i,depth:(a[i].y+a[(i+1)%4].y)/2})).sort((a,b)=>a.depth-b.depth);
      faces.forEach(({i})=>M.poly([a[i],a[(i+1)%4],b[(i+1)%4],b[i]],cols[i%2+1]));
      M.poly(b,cols[0]);
    };
    const scale=M.camera.scale||1;
    const p=M.project(r,c);M.ellipse(p.x+3*scale,p.y+3*scale,21*scale,8*scale,'#263a4325');
    cube(0,0,.64,.29,5,7,['#dce6e5','#374b55','#52626b']);
    cube(0,0,.65,.32,11,16,['#f2f5f0',color,['#33748f','#3c7e6c','#6d5e8e'][index]]);
    cube(-.02,0,.54,.26,27,3,['#fbfcf7','#d7ded9','#bdccc8']);
    cube(-.09,0,.18,.18,30,2,['#c7d3d0','#b2c1be','#a8b9b5']);
    [-1,1].forEach(side=>{
      [-.18,.02,.21].forEach(x=>M.poly([local(x-.063,side*.163,16),local(x+.063,side*.163,16),local(x+.063,side*.163,23),local(x-.063,side*.163,23)],'#234a5d'));
      const gap=M.state.doors[index]?.075:0;
      M.poly([local(-.065-gap,side*.165,12),local(.065+gap,side*.165,12),local(.065+gap,side*.165,25),local(-.065-gap,side*.165,25)],M.state.doors[index]?'#1c3c49':'#dbe5df');
    });
    M.poly([local(.328,-.1,17),local(.328,.1,17),local(.328,.1,23),local(.328,-.1,23)],'#294b5b');
    [-.1,.1].forEach(y=>{const p=local(.335,y,13);M.ellipse(p.x,p.y,1.7*scale,1.4*scale,'#ffefb6');});
    for(let j=0;j<load;j++) {
      const columns=Math.min(3,load),rows=Math.ceil(load/3);
      const p=local((j%3-(columns-1)/2)*.16,(Math.floor(j/3)-(rows-1)/2)*.11,33);M.ellipse(p.x,p.y,2.2*scale,1.8*scale,'#fff9df');
    }
  };
  M.resize=()=>{
    const rect=M.canvas.getBoundingClientRect(), mobile=rect.width<550;
    const width=mobile?700:1000, height=width*rect.height/rect.width,ratio=width/rect.width;
    let upper=112*ratio;
    const lower=(mobile&&M.tutorial?.active&&M.current===0?220:rect.width<=650&&M.level?.trains.length===3?230:mobile&&M.level?.trains.length>1?160:116)*ratio;
    const size=M.size,view=M.state?.view||{zoom:1,panX:0,panY:0};
    // Reserve room for the raised depot and its capacity label in the fitted overview.
    for(let pass=0;pass<2;pass++){
      const room=height-upper-lower,fit=Math.min((width-40*ratio)/(2*size*54),room/(2*size*42));
      const top=upper+room/2-(size-1)*42*fit;
      const labelTop=Math.min(...M.level.trains.map(t=>top+(t.start[0]+t.start[1]-.935)*42*fit-M.depotHeight*fit-24*ratio));
      upper+=Math.max(0,112*ratio-labelTop);
    }
    const available=height-upper-lower;
    const scale=Math.min((width-40*ratio)/(2*size*54),available/(2*size*42))*view.zoom;
    const sy=42*scale;
    M.camera={width,height,sx:54*scale,sy,top:upper+available/2-(size-1)*sy+view.panY*ratio,offsetX:view.panX*ratio,scale,mobile};
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const pixelWidth=Math.round(rect.width*dpr),pixelHeight=Math.round(rect.height*dpr);
    if(M.canvas.width!==pixelWidth||M.canvas.height!==pixelHeight){M.canvas.width=pixelWidth;M.canvas.height=pixelHeight;}
    ctx.setTransform(M.canvas.width/M.camera.width,0,0,M.canvas.height/M.camera.height,0,0);
    M.draw?.();
    M.tutorial?.layout();
    M.layoutFailure?.();
  };
})();
