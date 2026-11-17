/* Low ground art in audited empty areas. Every decorative tile remains buildable. */
(() => {
  const M=window.Metro;
  M.sceneryPatches={
    9:{bounds:[2,7,0,3],theme:'meadow'},17:{bounds:[5,7,0,5],theme:'meadow'},
    40:{bounds:[5,9,0,5],theme:'garden'},49:{bounds:[4,11,0,6],theme:'garden'},
    50:{bounds:[0,8,8,11],theme:'garden'},52:{bounds:[0,5,3,11],theme:'plaza'},
    54:{bounds:[0,5,3,9],theme:'garden'}
  };
  M.drawSceneryGround=()=>{
    const patch=M.sceneryPatches[M.level.id];if(!patch)return;
    const [r0,r1,c0,c1]=patch.bounds,scale=M.camera.scale,plaza=patch.theme==='plaza';
    const forbidden=new Set([...M.level.blocked,...M.level.referenceSolution.flat()].map(String));
    const midR=Math.floor((r0+r1)/2),midC=Math.floor((c0+c1)/2);
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
      if(forbidden.has(String([r,c]))||M.stops.some(s=>Math.max(Math.abs(s.r-r),Math.abs(s.c-c))<=1))continue;
      const corners=[[-.48,-.48],[-.48,.48],[.48,.48],[.48,-.48]].map(([dr,dc])=>M.project(r+dr,c+dc,.25));
      M.poly(corners,plaza?(r+c)%2?'#dedfd3':'#e7e7db':(r+c)%2?'#d5e3cc':'#dfe9d6','#d5e0d0',.5*scale);
      if(r===midR)M.box(r,c,.28,.96,.4,.6,['#f1f0e4','#e1e4d8','#e7e9de']);
      if(c===midC)M.box(r,c,.96,.28,.4,.6,['#f1f0e4','#e1e4d8','#e7e9de']);
      if((r+c)%4===1&&r!==midR&&c!==midC){
        M.box(r,c,.66,.7,.4,1.5,['#adc49e','#a6bc98','#b2c8a6']);
        for(const [dr,dc,color]of [[-.12,-.12,'#bea364'],[.12,.12,'#bd8c78'],[-.12,.12,'#d4c789']]){
          const p=M.project(r+dr,c+dc,2);M.ellipse(p.x,p.y,3.4*scale,2.1*scale,color);
        }
      }else if((r+c)%3===0&&r!==midR&&c!==midC){
        M.line([M.project(r-.09,c-.08,1),M.project(r+.08,c+.02,1)],'#b5c8aa',1.2*scale);
        const p=M.project(r-.1,c+.1,1);M.ellipse(p.x,p.y,1.4*scale,.8*scale,'#c9d4b3');
      }
    }
  };
})();
