/* Shared location-pin signs, projected onto the roof rather than the screen. */
(() => {
  const M=window.Metro;
  M.symbols={
    train:'M9 3H15Q19 3 19 7V15Q19 19 15 19H9Q5 19 5 15V7Q5 3 9 3ZM5 10H19M12 3V10M8 19L6 22M16 19L18 22M9.6 15A.6 .6 0 1 0 8.4 15A.6 .6 0 1 0 9.6 15M15.6 15A.6 .6 0 1 0 14.4 15A.6 .6 0 1 0 15.6 15',
    person:'M14.5 5A2.5 2.5 0 1 0 9.5 5A2.5 2.5 0 1 0 14.5 5M8 12Q8 9 12 9Q16 9 16 12V16H8ZM10 16V22M14 16V22'
  };
  M.depotMark=station=>{
    const ctx=M.ctx,unit=.026,z=M.depotHeight+1;
    const origin=M.project(station.r-12*unit,station.c-12*unit,z);
    const u=M.project(station.r-12*unit,station.c-11*unit,z),v=M.project(station.r-11*unit,station.c-12*unit,z);
    ctx.save();ctx.transform(u.x-origin.x,u.y-origin.y,v.x-origin.x,v.y-origin.y,origin.x,origin.y);
    ctx.strokeStyle='#fffdf4';ctx.lineWidth=1.7;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.stroke(new Path2D(M.symbols.train));ctx.restore();
  };
  const pin='M12 0C5.4 0 0 5.4 0 12C0 20 12 30 12 30S24 20 24 12C24 5.4 18.6 0 12 0ZM20.6 11.5A8.6 8.6 0 1 0 3.4 11.5A8.6 8.6 0 1 0 20.6 11.5Z';
  const circledX='M9 7.5L15 15.5M15 7.5L9 15.5';
  M.signSVG=mode=>`<svg viewBox="0 0 24 30" aria-hidden="true"><path d="${pin}" fill="currentColor" fill-rule="evenodd" stroke="none"/>${mode==='up'?'<text x="12" y="14.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="800" fill="currentColor" stroke="none">UP</text>':`<path d="${circledX}" stroke-width="1.7"/>`}</svg>`;
  M.stationMark=(station,count,z)=>{
    const ctx=M.ctx,label=String(Math.max(0,Math.floor(count)));
    ctx.save();
    ctx.font='700 38px "Segoe UI", "Microsoft YaHei", sans-serif';
    const numberWidth=ctx.measureText(label).width,gap=6,width=numberWidth+gap+48,height=60;
    // Local x follows the roof's column edge; local y follows its row edge.
    // The whole sign fits inside the roof footprint, including multi-digit counts.
    const unit=Math.min(.88/width,.64/height);
    const r=station.r-height*unit/2,c=station.c-width*unit/2;
    const origin=M.project(r,c,z),u=M.project(r,c+unit,z),v=M.project(r+unit,c,z);
    ctx.transform(u.x-origin.x,u.y-origin.y,v.x-origin.x,v.y-origin.y,origin.x,origin.y);
    ctx.fillStyle='#f8faf2';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(label,0,height/2+1);
    ctx.translate(numberWidth+gap,0);ctx.scale(2,2);
    ctx.fill(new Path2D(pin),'evenodd');
    if(station.type==='pickup'){
      ctx.font='800 9px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
      ctx.fillText('UP',12,14.5);
    }else{
      ctx.strokeStyle='#f8faf2';ctx.lineWidth=1.7;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.stroke(new Path2D(circledX));
    }
    ctx.restore();
  };
  M.depotCapacity=station=>{
    const ctx=M.ctx,capacity=M.level.trains[station.line||0].capacity;
    const scale=M.camera.width/M.canvas.clientWidth,point=M.project(station.r-.46,station.c-.475,M.depotHeight);
    ctx.save();ctx.font='700 17px "Segoe UI", "Microsoft YaHei", sans-serif';
    const width=16+ctx.measureText(String(capacity)).width;
    ctx.translate(point.x-width*scale/2,point.y-12*scale);ctx.scale(scale,scale);
    const color=M.colors[station.line||0];ctx.fillStyle=color;ctx.strokeStyle='#f5f7f3';ctx.lineWidth=3;
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.strokeText(String(capacity),16,0);ctx.fillText(String(capacity),16,0);
    ctx.shadowColor='#f5f7f3';ctx.shadowBlur=2;
    ctx.beginPath();ctx.arc(5,-7,2.7,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.roundRect(2,-2,6,8,2);ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(3,5);ctx.lineTo(2,9);ctx.moveTo(7,5);ctx.lineTo(8,9);ctx.stroke();
    ctx.restore();
  };
})();
