(() => {
  const M=window.Metro;
  const up=(r,c,goal,count)=>({r,c,type:'pickup',goal,count});
  const down=(r,c,goal,count)=>({r,c,type:'end',goal,count});
  const definitions=[
    {name:'一起上车',lesson:'同色乘客可以在不同车站上车，再一起送达。',start:[1,0],capacity:3,budget:11,optimal:8,
      stops:[up(1,2,'yellow',1),up(3,2,'yellow',2),down(3,6,'yellow',3)],waypoints:[[1,0],[1,2],[3,2],[3,6]]},
    {name:'分两站下车',lesson:'上 3 人，先下 1 人，剩下的 2 人继续坐车。',start:[6,1],capacity:3,budget:11,optimal:8,
      stops:[up(4,1,'yellow',3),down(4,4,'yellow',1),down(1,4,'yellow',2)],waypoints:[[6,1],[4,1],[4,4],[1,4]]},
    {name:'换一种分法',lesson:'上车批次和下车批次，不必一一对应。',start:[1,1],capacity:3,budget:13,optimal:10,
      stops:[up(1,3,'yellow',1),up(3,3,'yellow',2),down(3,6,'yellow',2),down(6,6,'yellow',1)],waypoints:[[1,1],[1,3],[3,3],[3,6],[6,6]]},
    {name:'边接边送',lesson:'总共 4 人，两个座位也能送完。',start:[0,1],capacity:2,budget:12,optimal:10,
      stops:[up(1,1,'yellow',2),down(1,4,'yellow',2),up(4,4,'yellow',2),down(4,7,'yellow',2)],waypoints:[[0,1],[1,1],[1,4],[4,4],[4,7]]},
    {name:'五个人三站下',lesson:'两站上 2＋3 人，三站分别下 2、2、1 人。',start:[1,0],capacity:5,budget:16,optimal:12,
      stops:[up(1,2,'yellow',2),up(1,5,'yellow',3),down(3,5,'yellow',2),down(5,5,'yellow',2),down(5,2,'yellow',1)],waypoints:[[1,0],[1,5],[5,5],[5,2]]},
    {name:'小车装得下',lesson:'五位乘客，三个座位；接下一批前先下车。',start:[0,0],capacity:3,budget:16,optimal:13,
      stops:[up(1,2,'yellow',2),down(3,2,'yellow',2),up(3,5,'yellow',3),down(5,5,'yellow',2),down(5,2,'yellow',1)],waypoints:[[0,0],[0,2],[3,2],[3,5],[5,5],[5,2]]},
    {name:'留两个人在车上',lesson:'上 3、下 1，再上 2，此时车上是 4 人。',start:[1,1],capacity:4,budget:17,optimal:13,
      stops:[up(1,3,'yellow',3),down(1,5,'yellow',1),up(4,5,'yellow',2),down(6,5,'yellow',2),down(6,1,'yellow',2)],waypoints:[[1,1],[1,5],[6,5],[6,1]]},
    {name:'两种颜色两笔账',lesson:'不同颜色分别计数，不能用红色乘客抵黄色配额。',start:[0,0],capacity:4,budget:20,optimal:16,
      stops:[up(0,2,'yellow',2),down(2,2,'yellow',2),up(2,5,'yellow',3),up(4,5,'red',1),down(6,5,'yellow',2),down(6,2,'yellow',1),down(4,2,'red',1)],waypoints:[[0,0],[0,2],[2,2],[2,5],[6,5],[6,2],[4,2]]},
    {name:'青色乘客',lesson:'青色是第三种乘客，照屋顶数字接送即可。',start:[0,0],capacity:6,budget:23,optimal:17,
      stops:[up(0,2,'yellow',2),down(2,2,'yellow',2),up(2,5,'yellow',3),up(3,5,'red',1),down(5,5,'yellow',2),down(6,5,'yellow',1),down(6,3,'red',1),up(4,3,'cyan',1),down(4,1,'cyan',1)],waypoints:[[0,0],[0,2],[2,2],[2,5],[6,5],[6,3],[4,3],[4,1]]},
    {name:'给小城一颗心',lesson:'三种颜色，四个座位，试着把这一程串起来。',start:[2,2],capacity:4,budget:27,optimal:23,pattern:'爱心',
      stops:[up(0,3,'red',2),up(0,5,'yellow',1),down(1,6,'red',1),up(3,6,'cyan',2),down(6,6,'yellow',1),down(6,1,'red',1),up(5,0,'yellow',1),down(3,0,'cyan',2),down(2,1,'yellow',1)],
      waypoints:[[2,2],[1,2],[1,3],[0,3],[0,5],[1,5],[1,6],[6,6],[6,1],[5,1],[5,0],[3,0],[3,1],[2,1]]},
    {name:'第二辆列车',lesson:'点车库或左下角列车切换；总量和每车轨道都不能超限。',optimal:8,totalBudget:11,
      trains:[{start:[0,0],capacity:2,budget:6},{start:[7,7],capacity:3,budget:6}],
      stops:[up(0,2,'red',1),down(2,2,'red',1),up(7,5,'yellow',2),down(5,5,'yellow',2)],paths:[[[0,0],[0,2],[2,2]],[[7,7],[7,5],[5,5]]]},
    {name:'各有一程',lesson:'两条线分别安排，其中一条需要分批下客。',optimal:13,totalBudget:17,
      trains:[{start:[1,0],capacity:3,budget:10},{start:[7,6],capacity:3,budget:9}],
      stops:[up(1,2,'red',3),down(3,2,'red',1),down(3,5,'red',2),up(6,6,'yellow',1),up(4,6,'yellow',2),down(4,3,'yellow',3)],paths:[[[1,0],[1,2],[3,2],[3,5]],[[7,6],[4,6],[4,3]]]},
    {name:'绕开彼此',lesson:'没有换乘站就不能相交，试着从另一侧绕过去。',optimal:13,totalBudget:16,
      trains:[{start:[3,0],capacity:2,budget:7},{start:[0,3],capacity:2,budget:10}],
      stops:[up(3,1,'red',2),down(3,5,'red',2),up(1,3,'yellow',2),down(5,6,'yellow',2)],paths:[[[3,0],[3,5]],[[0,3],[1,3],[1,6],[5,6]]]},
    {name:'把路留给对方',lesson:'两条线不能占用同一格，试着给对方留路。',optimal:17,totalBudget:21,
      trains:[{start:[0,2],capacity:2,budget:9},{start:[0,5],capacity:2,budget:12}],
      stops:[up(1,2,'red',2),down(5,4,'red',2),up(1,5,'yellow',1),up(3,5,'yellow',1),down(6,5,'yellow',1),down(6,1,'yellow',1)],paths:[[[0,2],[1,2],[1,4],[5,4]],[[0,5],[6,5],[6,1]]]},
    {name:'给小城一个微笑',lesson:'分好两条线，分别完成三种颜色的配额。',optimal:20,totalBudget:25,pattern:'笑脸',
      trains:[{start:[5,0],capacity:3,budget:16},{start:[0,0],capacity:2,budget:10}],
      stops:[up(6,0,'red',3),down(6,3,'red',1),up(5,4,'red',1),down(4,5,'red',1),down(0,6,'red',2),up(0,2,'yellow',1),down(1,2,'yellow',1),up(2,0,'cyan',1),down(2,1,'cyan',1)],
      paths:[[[5,0],[6,0],[6,3],[6,4],[5,4],[5,5],[4,5],[4,6],[0,6]],[[0,0],[0,2],[1,2],[1,0],[2,0],[2,1]]]}
  ];
  for(const definition of definitions)M.levels.push(M.makeLevel(definition,M.levels.length));
})();
