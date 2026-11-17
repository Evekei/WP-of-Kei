/* 31–35 introduce forests; 36–40 use a larger 10 × 10 board. Hard slots are filled next. */
(() => {
  const M=window.Metro,up=(r,c,goal,count)=>({r,c,type:'pickup',goal,count}),down=(r,c,goal,count)=>({r,c,type:'end',goal,count}),check=(r,c,line=0)=>({r,c,type:'check',line});
  const definitions=[
    {name:'树下绕个弯',difficulty:2,lesson:'树木占据整格，铁路需要绕开。',start:[7,1],capacity:2,budget:16,optimal:13,
      blocked:[[5,1],[5,2],[5,3],[5,4]],stops:[up(6,1,'yellow',2),down(4,5,'yellow',1),up(2,5,'yellow',1),down(1,2,'yellow',2)],
      waypoints:[[7,1],[6,1],[6,5],[1,5],[1,2]]},
    {name:'绕路也要算人数',difficulty:3,lesson:'穿过林间缺口之前，先留出下一批乘客的座位。',start:[0,0],capacity:3,budget:17,optimal:14,
      blocked:[[1,3],[1,4],[1,5],[1,6],[3,0],[3,1],[3,2],[3,3],[3,4]],
      stops:[up(0,2,'yellow',2),down(2,2,'yellow',1),up(2,5,'red',2),down(5,5,'red',1),down(6,5,'yellow',1),down(6,2,'red',1)],waypoints:[[0,0],[0,2],[2,2],[2,5],[6,5],[6,2]]},
    null,
    {name:'林口先后手',difficulty:3,lesson:'蓝车留客接红，绿车先卸再接；给彼此留下林口。',optimal:25,totalBudget:27,
      trains:[{start:[0,0],capacity:3,budget:15},{start:[7,7],capacity:2,budget:14}],blocked:[[3,0],[3,1],[3,2],[3,3],[4,0],[4,1],[2,6],[0,5]],
      stops:[up(0,2,'yellow',2),down(2,2,'yellow',1),check(2,4),up(4,3,'red',2),down(5,2,'red',1),down(6,2,'yellow',1),down(6,3,'red',1),up(7,5,'cyan',2),down(5,5,'cyan',1),check(5,6,1),up(3,5,'yellow',1),down(1,6,'cyan',1),down(0,6,'yellow',1)],
      paths:[[[0,0],[0,2],[2,2],[2,4],[4,4],[4,2],[6,2],[6,3]],[[7,7],[7,5],[5,5],[5,6],[3,6],[3,5],[1,5],[1,6],[0,6]]]},
    null,
    {name:'更大的街区',difficulty:2,size:10,lesson:'沙盘扩大了。点放大镜可拖动、缩放查看，再点一次继续铺轨。',start:[0,0],capacity:3,budget:28,optimal:24,
      stops:[up(0,3,'yellow',2),down(3,3,'yellow',1),up(3,7,'red',1),down(6,7,'yellow',1),down(6,3,'red',1),up(8,3,'yellow',1),down(8,8,'yellow',1)],
      waypoints:[[0,0],[0,3],[3,3],[3,7],[6,7],[6,3],[8,3],[8,8]]},
    {name:'多一片城区',difficulty:3,size:10,lesson:'三种颜色分区接送，先给另一条线留好入口。',optimal:30,totalBudget:34,
      trains:[{start:[0,0],capacity:3,budget:18},{start:[9,9],capacity:2,budget:18}],blocked:[[4,4],[4,5],[6,3],[6,4],[6,5]],
      stops:[up(0,3,'yellow',2),down(3,3,'yellow',1),up(3,6,'red',1),down(5,6,'yellow',1),down(5,2,'red',1),up(9,6,'cyan',2),down(7,6,'cyan',1),up(7,8,'yellow',1),down(2,8,'cyan',1),down(2,5,'yellow',1)],
      paths:[[[0,0],[0,3],[3,3],[3,6],[5,6],[5,2]],[[9,9],[9,6],[7,6],[7,8],[2,8],[2,5]]]},
    null,
    {name:'绕城检查',difficulty:3,size:10,lesson:'先分好两条巡查线，再考虑余客和树林绕行。',optimal:30,totalBudget:33,
      trains:[{start:[0,1],capacity:3,budget:18},{start:[9,8],capacity:3,budget:17}],blocked:[[2,2],[2,3],[4,3],[4,4],[6,5],[6,7]],
      stops:[up(0,4,'red',2),check(3,4),down(3,1,'red',1),up(5,1,'yellow',1),down(5,4,'red',1),down(7,4,'yellow',1),up(7,8,'cyan',2),check(7,6,1),down(4,6,'cyan',1),up(4,8,'red',1),down(1,8,'cyan',1),down(1,6,'red',1)],
      paths:[[[0,1],[0,4],[3,4],[3,1],[5,1],[5,4],[7,4]],[[9,8],[7,8],[7,6],[4,6],[4,8],[1,8],[1,6]]]},
    null
  ];
  for(const definition of definitions)M.levels.push(definition?M.makeLevel(definition,M.levels.length):null);
})();
