(() => {
  const M=window.Metro;
  const up=(r,c,goal,count)=>({r,c,type:'pickup',goal,count});
  const down=(r,c,goal,count)=>({r,c,type:'end',goal,count});
  const check=(r,c,line=0)=>({r,c,type:'check',line});
  const hub=()=>({r:3,c:3,type:'transfer'});
  const definitions=[
    {name:'顺路打个勾',difficulty:2,lesson:'同色勾形站是检查站，这辆车必须经过它。',start:[6,0],capacity:2,budget:10,optimal:8,
      stops:[up(4,0,'yellow',2),check(4,3),down(1,3,'yellow',2)],waypoints:[[6,0],[4,0],[4,3],[1,3]]},
    {name:'各自的检查点',difficulty:3,lesson:'蓝勾只检查蓝车，绿勾只检查绿车。',optimal:18,totalBudget:20,
      trains:[{start:[0,0],capacity:2,budget:10},{start:[7,7],capacity:2,budget:12}],
      stops:[up(0,2,'red',2),check(2,2),down(4,2,'red',1),down(4,4,'red',1),up(7,5,'yellow',2),check(5,5,1),down(5,6,'yellow',1),down(2,4,'yellow',1)],
      paths:[[[0,0],[0,2],[4,2],[4,4]],[[7,7],[7,5],[5,5],[5,6],[2,6],[2,4]]]},
    {name:'两枚印章',difficulty:3,lesson:'两个检查站都要经过，但没有规定先后顺序。',start:[0,0],capacity:3,budget:16,optimal:14,
      stops:[up(0,2,'yellow',2),check(2,2),down(4,2,'yellow',1),up(4,4,'red',1),check(2,4),down(0,4,'yellow',1),down(0,6,'red',1)],
      waypoints:[[0,0],[0,2],[4,2],[4,4],[0,4],[0,6]]},
    {name:'绕一点省一点',difficulty:3,lesson:'把检查点、余客和另一辆车的入口一起考虑。',optimal:26,totalBudget:28,
      trains:[{start:[0,0],capacity:2,budget:15},{start:[0,7],capacity:2,budget:15}],
      stops:[up(0,3,'yellow',2),check(2,3),down(2,1,'yellow',1),up(4,1,'red',1),down(4,3,'yellow',1),down(6,3,'red',1),up(2,7,'cyan',2),check(4,7,1),down(4,5,'cyan',1),up(6,5,'yellow',1),down(7,5,'cyan',1),down(7,1,'yellow',1)],
      paths:[[[0,0],[0,3],[2,3],[2,1],[4,1],[4,3],[6,3]],[[0,7],[4,7],[4,5],[7,5],[7,1]]]},
    {name:'巡站终考',difficulty:5,lesson:'先为另一辆车留入口，再安排检查与卸客。',optimal:27,totalBudget:28,
      trains:[{start:[0,0],capacity:2,budget:12},{start:[7,7],capacity:3,budget:18}],
      stops:[up(0,2,'red',2),down(2,2,'red',1),up(2,4,'yellow',1),check(4,4),down(4,2,'yellow',1),down(3,2,'red',1),up(7,5,'yellow',2),check(5,5,1),up(5,1,'red',1),down(1,1,'yellow',1),down(1,0,'red',1),down(4,0,'yellow',1)],
      paths:[[[0,0],[0,2],[2,2],[2,4],[4,4],[4,2],[3,2]],[[7,7],[7,5],[5,5],[5,1],[1,1],[1,0],[4,0]]]},
    {name:'换一辆车',difficulty:2,lesson:'两车到齐后换乘；画好线路，会预览交换人数。',optimal:11,totalBudget:12,
      trains:[{start:[0,1],capacity:2,budget:6},{start:[6,3],capacity:2,budget:7}],
      stops:[up(2,1,'yellow',2),hub(),down(3,6,'yellow',2)],paths:[[[0,1],[3,1],[3,3]],[[6,3],[3,3],[3,6]]]},
    {name:'换车后分站下',difficulty:3,lesson:'三位同色乘客一起换车，再按 1、2 人分站下。',optimal:16,totalBudget:17,
      trains:[{start:[0,0],capacity:3,budget:7},{start:[7,3],capacity:3,budget:11}],
      stops:[up(0,2,'yellow',1),up(2,2,'yellow',2),hub(),down(3,6,'yellow',1),down(6,6,'yellow',2)],
      paths:[[[0,0],[0,2],[3,2],[3,3]],[[7,3],[3,3],[3,6],[6,6]]]},
    {name:'只换一部分',difficulty:3,lesson:'四人上车，本车留三人，只把一人交给另一车。',optimal:17,totalBudget:18,
      trains:[{start:[0,0],capacity:4,budget:11},{start:[7,3],capacity:2,budget:8}],
      stops:[up(0,2,'yellow',4),hub(),down(3,5,'yellow',2),down(1,5,'yellow',1),down(3,0,'yellow',1)],
      paths:[[[0,0],[0,3],[3,3],[3,5],[1,5]],[[7,3],[3,3],[3,0]]]},
    {name:'你来我往',difficulty:3,lesson:'满车也能互换；同时下车、换入，不会假性超载。',optimal:17,totalBudget:18,
      trains:[{start:[0,0],capacity:2,budget:8},{start:[7,6],capacity:2,budget:11}],
      stops:[up(0,3,'red',2),up(7,3,'yellow',2),hub(),down(3,4,'yellow',2),down(3,0,'red',2)],
      paths:[[[0,0],[0,3],[3,3],[3,4]],[[7,6],[7,3],[3,3],[3,0]]]},
    {name:'有人直达有人换车',difficulty:5,lesson:'三名红客留一换二，三名黄客换车；先算好座位。',optimal:24,totalBudget:25,
      trains:[{start:[0,0],capacity:4,budget:13},{start:[7,7],capacity:3,budget:13}],
      stops:[up(0,3,'red',3),check(2,3),hub(),down(3,5,'yellow',2),check(2,5),down(1,5,'red',1),down(1,7,'yellow',1),up(7,3,'yellow',3),check(6,3,1),down(3,1,'red',1),down(5,1,'red',1)],
      paths:[[[0,0],[0,3],[3,3],[3,5],[1,5],[1,7]],[[7,7],[7,3],[3,3],[3,1],[5,1]]]}
  ];
  for(const definition of definitions)M.levels.push(M.makeLevel(definition,M.levels.length));
})();
