/* One concept per page. Factories read the current map; result pages read actual game events. */
(() => {
  const M=window.Metro,st=(r,c)=>({station:[r,c]}),ui=selector=>({selector});
  const at=s=>[s.r,s.c],same=(a,b)=>String(a)===String(b);
  const stops=type=>M.stops.filter(s=>s.type===type),has=(p,line=0)=>M.state.routes[line].some(q=>same(p,q));
  const car=(line,part='')=>ui(`#vehicles [data-line="${line}"]${part?' .'+part:''}`);
  const icon=name=>M.icon(name),focusEvent=({event})=>({station:event.at});
  const pin=(mode,n,goal)=>`<span class="tutorial-sign" style="color:${M.goals[goal]}">${n}${M.signSVG(mode)}</span>`;
  const people=(n,goal)=>`<span class="tutorial-people" style="color:${M.goals[goal]||M.colors[goal]}">${icon('person')}<strong>${n}</strong></span>`;
  const equation=text=>`<span class="tutorial-equation">${text}</span>`;
  const trains=lines=>lines.map(i=>`<span style="color:${M.colors[i]}">${icon('train')}</span>`).join('');
  const P=(title,text,visual,focus,more={})=>({type:'panel',title,text,visual,focus,...more});
  const A=(title,kind,done,focus,more={})=>({type:'action',title,kind,done,focus,...more});
  const W=(kind,title,text,visual,focus,test,more={})=>({type:'watch',kind,title,text,visual,focus,test,...more});
  const route=(station,title)=>A(title,'route',()=>has(at(station)),{station:at(station)},{stopAt:at(station),line:0});
  const dropPage=()=>W('passenger','这站只下指定人数',({event,load})=>`本次下 ${event.group.count} 人，车上还剩 ${load} 人。`,
    ({event,load})=>pin('down',event.group.count,event.group.goal)+'<span>→</span>'+people(load,event.group.goal),focusEvent,e=>e.type==='drop',{wide:true,button:'继续送人'});
  const hub=()=>st(...at(stops('transfer')[0]));
  const exchangeVisual=({event})=>{
    const counts=new Map();event.moves.forEach(m=>counts.set(m.goal,(counts.get(m.goal)||0)+m.count));
    return [...counts].map(([goal,n])=>people(n,goal)).join('');
  };
  const exchangePage=(title='乘客已经换车')=>W('transfer',title,'按后续配额换车，接下来继续送达。',exchangeVisual,hub,null,{wide:true,button:'继续行驶'});
  M.lessonDefinitions={
    2:{title:'转弯与撤销',create:()=>({steps:[
      P('铁路可以转弯','拖到相邻格，就能改变方向。',icon('rail'),{cell:M.level.referenceSolution[0][4]}),
      A('亲手铺出一个转弯','route',()=>{const r=M.state.routes[0];return r.some((p,i)=>i>0&&i<r.length-1&&r[i-1][0]!==r[i+1][0]&&r[i-1][1]!==r[i+1][1]);},{cell:M.level.referenceSolution[0][4]}),
      P('画错可以撤销','收回上一次点击或整次拖动。',icon('undo'),ui('#undo')),
      A('点击撤销，试着收回一次','undo',()=>true,ui('#undo')),
      P('可以重新规划了','撤回的铁轨会回到库存。',icon('rail'),ui('#rail-stock'),{button:'继续规划'})]})},
    3:{title:'颜色与接送顺序',create:()=>{const [red,yellow]=stops('pickup'),end=stops('end')[0];return {steps:[
      P('不同颜色分别送达','红色乘客去红色圈 X 站。',pin('down',end.count,'red'),st(...at(end))),
      route(red,'先接上红色乘客'),
      P('先把这一批送到','送完红色，再继续接黄色。',pin('down',end.count,'red'),st(...at(end))),route(end,'继续铺到红色圈 X 站'),
      P('下一批是黄色乘客','接送数字按各站自己的配额计算。',pin('up',yellow.count,'yellow'),st(...at(yellow)),{button:'继续规划'})]};}},
    4:{title:'容量与先卸再接',create:()=>{const up=stops('pickup')[0],end=stops('end')[0];return {steps:[
      P('车里最多坐 2 人','小人旁边的数字是容量上限。',people(2,0),car(0,'vehicle-load')),
      route(up,'先连上这批黄色乘客'),
      P('满车要先下客','先送这一批，才能接后面的乘客。',pin('down',end.count,end.goal),st(...at(end))),route(end,'先把铁路连到黄色下车站'),
      P('腾位后再接下一批','容量限制看每一段车里的人数。',equation('2 → 0 → 1'),st(...at(stops('pickup')[1])),{wide:true,button:'继续规划'})]};}},
    5:{title:'关键路段提示',create:()=>({steps:[
      P('卡住时看一段提示','提示只显示尚未连上的关键路段。',icon('hint'),ui('#hint')),
      A('点击灯泡，看一次关键路段','hint',()=>!!M.state.hint,ui('#hint')),
      P('淡色铁路是一种参考','已完成的关键段会自动跳过。',icon('rail'),()=>({cell:M.state.hint?.[1]||M.level.referenceSolution[0][1]})),
      P('暖橙色标记提示冲突','提示与当前线路冲突时，暖橙色标出位置或预算。',icon('hint'),ui('#hint'),{button:'继续规划'})]})},
    6:{title:'同色多站汇集',create:()=>{const [a,b]=stops('pickup');return {steps:[
      P('同色可以分站上车','先接这里的 1 人。',pin('up',a.count,a.goal),st(...at(a))),route(a,'先铺到第一个上车站'),
      P('这里还有 2 人','同色人数累加，共有 3 人待送。',pin('up',b.count,b.goal),st(...at(b))),route(b,'再连上第二个上车站'),
      W('passenger','同色乘客已经汇集',({load})=>`车上共有 ${load} 位黄色乘客。`,({load})=>people(load,'yellow'),focusEvent,
        e=>e.type==='board'&&M.state.collected.size===2,{button:'继续送达'})]};}},
    7:{title:'分批下车',create:()=>{const up=stops('pickup')[0],end=stops('end')[0];return {steps:[
      P('这里上车 3 人','这一批可以分到不同下车站。',pin('up',up.count,up.goal),st(...at(up))),route(up,'先连上 3 位乘客'),
      P('下车站只收指定人数','不是遇到同色站就整车清空。',pin('down',end.count,end.goal),st(...at(end)),{button:'我来规划接送'}),dropPage()]};}},
    8:{title:'上下车批次不对应',create:()=>({steps:[
      P('上车和下车批次可以不同','只要同色总人数与各站配额相符。',equation('1＋2 → 2＋1'),st(...at(stops('end')[0])),{wide:true,button:'我来试试'}),dropPage()]})},
    10:{title:'多源与多站分流',create:()=>{const [a,b]=stops('pickup'),end=stops('end')[0];return {steps:[
      P('两站汇集，三站分流','同色人数可以合起来分配。',equation('2＋3 → 2＋2＋1'),st(...at(a)),{wide:true}),
      route(a,'先连上第一批 2 人'),P('第二站再上 3 人','两批合起来共有 5 人。',pin('up',b.count,b.goal),st(...at(b))),route(b,'继续连上第二批乘客'),
      P('每个下车站有自己的配额','这里只需要下 2 人。',pin('down',end.count,end.goal),st(...at(end)),{button:'我来分站送达'}),dropPage()]};}},
    12:{title:'保留余客再接人',create:()=>({steps:[
      P('下完一部分，还会留人','后面再上车时，也要算上余客。',icon('person'),st(...at(stops('end')[0])),{button:'我来安排顺序'}),
      W('passenger','这些乘客还在车上',({load})=>`还剩 ${load} 人，要给后续上车留座位。`,({event,load})=>people(load,event.group.goal),focusEvent,
        (e,line)=>e.type==='drop'&&M.state.vehicles[line].load>0,{button:'继续行驶'})]})},
    13:{title:'不同颜色分开记账',create:()=>({steps:[
      P('不同颜色不能互相抵扣','黄色配额只能用黄色乘客完成。',people(2,'yellow')+people(1,'red'),st(...at(stops('pickup').find(s=>s.goal==='red'))),{wide:true,button:'我来安排接送'}),
      W('passenger','车内颜色分别计算','红色乘客不能抵扣黄色需求。',({event})=>people(event.inventory.yellow||0,'yellow')+people(event.inventory.red||0,'red'),focusEvent,
        e=>e.type==='board'&&e.group.goal==='red',{wide:true,button:'继续行驶'})]})},
    14:{title:'第三种乘客颜色',create:()=>{const up=stops('pickup').find(s=>s.goal==='cyan'),end=stops('end').find(s=>s.goal==='cyan');return {steps:[
      P('青色也是一种乘客','上车数字与其他颜色一样读取。',pin('up',up.count,'cyan'),st(...at(up))),
      P('青色要送到青色站','侧面的三角形也是青色标记。',pin('down',end.count,'cyan'),st(...at(end)),{button:'我来规划'}),
      W('passenger','青色乘客已经上车','按青色下车站的配额继续送达。',({event})=>people(event.group.count,'cyan'),focusEvent,e=>e.type==='board'&&e.group.goal==='cyan',{button:'继续行驶'})]};}},
    16:{title:'双车切换与双重预算',create:()=>({steps:[
      P('现在有两辆列车','点击车库或左下角车辆切换线路。',trains([0,1]),car(1),{wide:true,button:'试着切换'}),
      A('选择绿色列车','select',()=>M.state.selected===1,car(1)),
      P('每车有自己的轨道上限',`绿车最多还能铺 ${M.level.trains[1].budget} 段。`,icon('rail'),car(1,'vehicle-rails')),
      P('两车还共用总库存','两条线路的用量相加，不能超总数。',icon('rail'),ui('#rail-stock')),
      A('切回蓝色列车，再开始规划','select',()=>M.state.selected===0,car(0)),
      P('两条线路一起发车','规划好所有接送，再点击发车。',icon('play'),ui('#run'),{button:'开始规划'})]})},
    18:{title:'普通格不能相交',create:()=>({steps:[
      P('普通格不能让两线相交','没有换乘站，两车就要分开走。',icon('rail')+icon('close'),{cell:[3,3]},{wide:true}),
      P('先给另一辆车留入口','近路也可能挡住后面的接送。',trains([0,1]),st(...at(stops('pickup')[1])),{wide:true,button:'试着切换规划'}),
      A('选绿色列车，看看另一侧任务','select',()=>M.state.selected===1,car(1)),
      P('可以撤销后重新让路','两条线一起考虑，不必坚持先画的线。',icon('undo'),ui('#undo'),{button:'开始规划'})]})},
    21:{title:'勾形检查站',create:()=>{const up=stops('pickup')[0],check=stops('check')[0];return {steps:[
      P('这趟要顺路经过检查站','先接上乘客，再认识新的标记。',pin('up',up.count,up.goal),st(...at(up)),{button:'先接乘客'}),route(up,'先铺到上车站'),
      P('勾形站是检查站','铁路必须经过这个格子。',icon('check'),st(...at(check)),{button:'我来连上检查站'}),route(check,'把铁路继续铺过勾形站'),
      P('检查站不负责上下客','经过以后，还要继续送达乘客。',icon('check'),st(...at(check)),{button:'继续规划'})]};}},
    22:{title:'检查站指定车辆',create:()=>{const check=stops('check').find(s=>s.line===1);return {steps:[
      P('屋顶颜色指定检查车辆','绿色勾形站必须由绿车经过。',`<span style="color:${M.colors[1]}">${icon('check')}</span>`,st(...at(check)),{button:'选择对应列车'}),
      A('选择绿色列车','select',()=>M.state.selected===1,car(1)),
      P('别的车经过不能代替','各车经过自己的检查站，再完成接送。',icon('check'),st(...at(check)),{button:'开始规划'})]};}},
    23:{title:'多个检查站',create:()=>({steps:[
      P('两个勾都要经过','不用按固定先后顺序。',icon('check'),st(...at(stops('check')[0]))),
      P('这一枚也不能漏掉','结合接送和绕行，自己决定先后。',icon('check'),st(...at(stops('check')[1])),{button:'开始规划'})]})},
    26:{title:'两车换乘',create:()=>({steps:[
      P('双向箭头是换乘站','两条线路都要接到这里。',icon('transfer'),hub()),
      P('先到的车会等待','车辆到齐后才开始换乘。',trains([0,1]),hub(),{wide:true,button:'我来规划两条线'}),exchangePage()]})},
    27:{title:'换车后分站下客',create:()=>({steps:[
      P('换乘不等于送达','换车之后，仍要按各站人数下客。',icon('transfer'),hub(),{button:'我来安排分流'}),exchangePage(),dropPage()]})},
    28:{title:'只换一部分乘客',create:()=>({steps:[
      P('可以只让一部分人换车','本车后面还需要的人会留下。',icon('transfer'),hub(),{button:'我来安排两线'}),
      W('transfer','需要留下的人不会换车',({event})=>`本次转车 ${event.moves.reduce((n,m)=>n+m.count,0)} 人，其余继续原线。`,exchangeVisual,hub,null,{wide:true,button:'继续行驶'})]})},
    29:{title:'满载同时交换',create:()=>({steps:[
      P('满车也能互相交换','同时转出、转入，不会先加后减。',trains([0,1])+icon('transfer'),hub(),{wide:true,button:'我来规划'}),exchangePage('满载交换已经完成')]})},
    31:{title:'绕开整格障碍',create:()=>{const up=stops('pickup')[0],tree=M.level.blocked[0],p=M.level.referenceSolution[0][2];return {steps:[
      P('树木占据整个格子','铁路不能从这里穿过。',icon('close'),st(...tree)),route(up,'先连到前面的上车站'),
      P('可以从空格绕过去','绕行也要计入铁轨用量。',icon('rail'),{cell:p},{button:'试着绕一格'}),
      A('从旁边空格开始绕行','route',()=>has(p),{cell:p},{stopAt:p,line:0}),
      P('绕行后继续完成接送','把通道和铁轨余量一起考虑。',icon('rail'),ui('#rail-stock'),{button:'继续规划'})]};}},
    36:{title:'大地图查看操作',create:()=>({steps:[
      P('用放大镜进入查看','查看模式把移图和铺轨分开。',icon('zoom'),ui('#view-toggle'),{button:'我来进入查看'}),
      A('点击放大镜，进入查看模式','view',()=>M.state.inspect,ui('#view-toggle')),
      P('按住地图拖动看看','查看模式拖动不会铺轨。',icon('zoom'),{area:true},{button:'我来拖动'}),
      A('拖动地图，移动一下视角','view',()=>M.state.view.panX!==0||M.state.view.panY!==0,{area:true},{gesture:'pan'}),
      P('放大能看清更多细节','用加号、滚轮或双指放大。',icon('plus'),ui('#zoom-in'),{button:'我来放大'}),
      A('把地图放大一些','view',()=>M.state.view.zoom>1.6,ui('#zoom-in')),
      P('再点一次，返回铺轨','保留当前视角，继续铺设铁路。',icon('rail'),ui('#view-toggle'),{button:'我来返回铺轨'}),
      A('返回铺轨模式','view',()=>!M.state.inspect,ui('#view-toggle'))]})},
    41:{title:'不同车辆容量',create:()=>({steps:[
      P('两辆车的容量不同','蓝车最多载 4 人。',people(4,0),car(0,'vehicle-load')),
      P('小车只能载 2 人','任务归属不能只按距离决定。',people(2,1),car(1,'vehicle-load'),{button:'选择小车看看'}),
      A('选择绿色小车','select',()=>M.state.selected===1,car(1)),
      P('小车也有独立轨道额度','容量、用轨和让路一起考虑。',icon('rail'),car(1,'vehicle-rails'),{button:'开始规划'})]})},
    44:{title:'换乘后继续接人',create:()=>{const route=M.level.referenceSolution[0],h=stops('transfer')[0],cut=route.findIndex(p=>same(p,at(h))),up=stops('pickup').find(s=>route.slice(cut+1).some(p=>same(p,at(s))));return {steps:[
      P('换乘之后也可能继续上客','仍然需要为后面的乘客留座位。',pin('up',up.count,up.goal),st(...at(up)),{button:'我来规划'}),
      W('passenger','换后上客仍受容量限制',({load})=>`现在车上 ${load} 人，不能超过本车容量。`,({event,load})=>people(load,event.group.goal),focusEvent,
        e=>e.type==='board'&&M.state.transferDone,{button:'继续行驶'})]};}},
    45:{title:'满载交换复习',auto:false,create:()=>({steps:[
      P('满载也可以部分互换','保留自身所需人数，其余直接换车。',icon('transfer'),hub(),{button:'我来规划'}),exchangePage('转出和转入同时结算')]})},
    46:{title:'十二格大沙盘',auto:false,create:()=>({steps:[
      P('沙盘扩大为 12 × 12','接送、容量和轨道规则保持一致。',equation('12 × 12'),{area:true},{wide:true}),
      P('沿用查看模式','放大、平移后可以返回铺轨。',icon('zoom'),ui('#view-toggle'),{button:'开始规划'})]})},
    51:{title:'三车与共享铁轨',create:()=>({steps:[
      P('第三辆是紫色列车','点击车库或这里切换到紫车。',trains([2]),car(2),{button:'我来切换'}),
      A('选择紫色列车','select',()=>M.state.selected===2,car(2)),
      P('紫车也有自己的上限',`本车可铺 ${M.level.trains[2].budget} 段，不能借用别车上限。`,icon('rail'),car(2,'vehicle-rails')),
      P('三条线路共用总铁轨','三车用量相加，不能超过总数。',icon('rail'),ui('#rail-stock')),
      A('切回蓝车，开始联合规划','select',()=>M.state.selected===0,car(0))]})},
    53:{title:'三车支线汇流',create:()=>({steps:[
      P('三辆车都要到换乘站','先到的车会等待其余车辆。',trains([0,1,2]),hub(),{wide:true}),
      P('两条支线可以在这里结束','汇入主线的人继续前往下车站。',trains([0,1])+`<span>→</span>`+trains([2]),hub(),{wide:true}),
      P('主线要能装下汇入乘客','六座也要先腾出需要的空间。',people(6,2),car(2,'vehicle-load'),{button:'我来规划三条线'}),
      W('transfer','汇流人数按颜色合并','主线接到乘客，继续完成后面的接送。',exchangeVisual,hub,null,{wide:true,button:'继续行驶'})]})},
    57:{title:'六座也要先卸再接',auto:false,create:()=>({steps:[
      P('六个座位也不能超载','换乘后先卸一部分，再接新乘客。',equation('6 − 1 ＋ 1 = 6'),car(2,'vehicle-load'),{wide:true,button:'我来安排顺序'}),
      W('passenger','刚才腾出的座位用上了',({event,load})=>`本次上 ${event.group.count} 人，现在车上 ${load} 人。`,({event,load})=>people(load,event.group.goal),focusEvent,
        e=>e.type==='board'&&M.state.transferDone,{button:'继续行驶'})]})}
  };
})();
