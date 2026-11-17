/* Readable, transient passenger counts float above the closed transfer building. */
(() => {
  const M=window.Metro,ctx=M.ctx;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  M.drawTransferEffects=()=>{
    const effects=M.state.transferEffects||[],scale=M.camera.width/M.canvas.clientWidth;
    effects.forEach((effect,i)=>{
      const t=effect.progress,point=M.project(...effect.at,48);
      const x=point.x+(i-(effects.length-1)/2)*54*scale;
      const y=point.y-((reduced?0:30*t)+(i%2)*8)*scale;
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
      ctx.globalAlpha=Math.min(1,t/.12)*Math.pow(1-t,.65);
      ctx.fillStyle=M.goals[effect.goal];ctx.strokeStyle='#f5f7f3';ctx.lineWidth=3.5;
      ctx.font='700 22px "Segoe UI", "Microsoft YaHei", sans-serif';ctx.textBaseline='middle';
      ctx.strokeText(String(effect.count),3,-2);ctx.fillText(String(effect.count),3,-2);
      ctx.shadowColor='#f5f7f3';ctx.shadowBlur=3;
      ctx.beginPath();ctx.arc(-8,-9,3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(-11,-4,6,9,2);ctx.fill();
      ctx.strokeStyle=M.goals[effect.goal];ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-10,4);ctx.lineTo(-11,8);ctx.moveTo(-6,4);ctx.lineTo(-5,8);ctx.stroke();
      ctx.restore();
    });
  };
})();
