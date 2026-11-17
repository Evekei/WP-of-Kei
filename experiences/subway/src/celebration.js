/* A short, paper-colored firework finale, independent of paused game playback. */
(() => {
  const M=window.Metro,dialog=document.getElementById('dialog');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  canvas.className='celebration';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;dialog.prepend(canvas);
  const colors=['#438bab','#529a81','#d6ac52','#8b7eab','#ce8173'];
  let frame=0,timer=0,voices=[];
  const stop=()=>{cancelAnimationFrame(frame);clearTimeout(timer);voices.forEach(cancel=>cancel());voices=[];frame=0;timer=0;canvas.hidden=true;};
  const sound=(phase,color)=>{const cancel=M.fireworkSound?.(phase,color);if(cancel)voices.push(cancel);};
  const celebrate=M.celebrate=()=>{
    stop();canvas.hidden=false;
    const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const card=dialog.getBoundingClientRect(),small=w<550,radius=small?52:92;
    const top=Math.max(radius+12,card.top-28),bottom=Math.min(h-radius-12,card.bottom+32);
    const bursts=[
      {x:small?w*.23:card.left-34,y:top,delay:0,color:0},
      {x:small?w*.77:card.right+34,y:top-20,delay:300,color:2},
      {x:small?w*.2:card.left-55,y:bottom,delay:650,color:1},
      {x:small?w*.8:card.right+55,y:bottom,delay:950,color:3},
      {x:w*.5,y:Math.max(60,top-58),delay:1250,color:2}
    ];
    const paint=(burst,p,still=false)=>{
      const expansion=1-Math.pow(1-p,3),r=radius*expansion;
      ctx.strokeStyle=colors[burst.color];ctx.fillStyle=colors[burst.color];ctx.lineCap='round';
      ctx.globalAlpha=still?.65:Math.min(1,p*10)*Math.pow(1-p,.65);
      // Rounded rays and tiny diamonds echo the railway model's simple geometry.
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6+burst.color*.27,fall=still?0:p*p*24;
        const x=burst.x+Math.cos(a)*r,y=burst.y+Math.sin(a)*r+fall;
        const tail=still?7:4+9*(1-p);ctx.lineWidth=small?2:2.6;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(a)*tail,y-Math.sin(a)*tail);ctx.stroke();
        if(i%3===0){ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+3,y);ctx.lineTo(x,y+3);ctx.lineTo(x-3,y);ctx.closePath();ctx.fill();}
        else if(i%3===1){ctx.beginPath();ctx.arc(burst.x+Math.cos(a+.12)*r*.67,burst.y+Math.sin(a+.12)*r*.67+fall,1.8,0,Math.PI*2);ctx.fill();}
      }
    };
    const clearCard=()=>{ctx.globalAlpha=1;ctx.clearRect(card.left-8,card.top-8,card.width+16,card.height+16);};
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      sound('burst',2);
      bursts.slice(0,2).forEach(b=>paint(b,.52,true));clearCard();timer=setTimeout(stop,1000);return;
    }
    const start=performance.now();
    const tick=now=>{
      const elapsed=now-start;if(elapsed>3100||!dialog.open){stop();return;}
      ctx.clearRect(0,0,w,h);
      for(const b of bursts){
        if(!b.rising&&elapsed>=Math.max(0,b.delay-180)){b.rising=true;if(elapsed-b.delay<150)sound('rise',b.color);}
        if(!b.burst&&elapsed>=b.delay+90){b.burst=true;if(elapsed-b.delay<300)sound('burst',b.color);}
        const p=(elapsed-b.delay)/1500;if(p>=0&&p<1)paint(b,p);
      }
      clearCard();frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
  };
  celebrate.stop=stop;dialog.addEventListener('close',stop);
})();
