/* High-difficulty layouts selected from reproducible offline candidates. */
(() => {
  const M=window.Metro;
  const definitions=[
    {id:19,name:"把路留给对方",difficulty:5,lesson:"先决定任务归属，再给另一辆车留入口。",optimal:26,totalBudget:27,
      trains:[{"start":[7,7],"capacity":3,"budget":13},{"start":[0,0],"capacity":2,"budget":15}],
      stops:[{"r":7,"c":6,"type":"pickup","goal":"yellow","count":2},{"r":5,"c":5,"type":"end","goal":"yellow","count":1},{"r":6,"c":4,"type":"pickup","goal":"red","count":2},{"r":5,"c":3,"type":"end","goal":"red","count":1},{"r":4,"c":5,"type":"end","goal":"yellow","count":1},{"r":4,"c":6,"type":"end","goal":"red","count":1},{"r":1,"c":0,"type":"pickup","goal":"red","count":2},{"r":3,"c":0,"type":"end","goal":"red","count":1},{"r":3,"c":1,"type":"pickup","goal":"yellow","count":1},{"r":3,"c":2,"type":"end","goal":"yellow","count":1},{"r":2,"c":3,"type":"pickup","goal":"cyan","count":1},{"r":2,"c":5,"type":"end","goal":"red","count":1},{"r":5,"c":7,"type":"end","goal":"cyan","count":1}],
      paths:[[[7,7],[7,6],[5,6],[5,5],[6,5],[6,4],[5,4],[5,3],[4,3],[4,6]],[[0,0],[3,0],[3,3],[2,3],[2,7],[5,7]]]},
    {id:20,name:"错位的终点",difficulty:5,lesson:"别按距离或颜色直接分车，先算每段余客。",optimal:27,totalBudget:28,
      trains:[{"start":[0,7],"capacity":3,"budget":14},{"start":[7,7],"capacity":2,"budget":15}],
      stops:[{"r":1,"c":7,"type":"pickup","goal":"yellow","count":2},{"r":0,"c":6,"type":"end","goal":"yellow","count":1},{"r":0,"c":3,"type":"pickup","goal":"red","count":2},{"r":2,"c":3,"type":"end","goal":"red","count":1},{"r":2,"c":4,"type":"end","goal":"yellow","count":1},{"r":2,"c":6,"type":"end","goal":"red","count":1},{"r":5,"c":7,"type":"pickup","goal":"red","count":2},{"r":5,"c":6,"type":"end","goal":"red","count":1},{"r":4,"c":5,"type":"pickup","goal":"yellow","count":1},{"r":5,"c":5,"type":"end","goal":"yellow","count":1},{"r":6,"c":6,"type":"pickup","goal":"cyan","count":1},{"r":7,"c":4,"type":"end","goal":"red","count":1},{"r":6,"c":2,"type":"end","goal":"cyan","count":1}],
      paths:[[[0,7],[1,7],[1,6],[0,6],[0,3],[2,3],[2,4],[1,4],[1,5],[2,5],[2,6]],[[7,7],[5,7],[5,6],[4,6],[4,5],[6,5],[6,6],[7,6],[7,4],[6,4],[6,2]]]},
    {id:25,name:"巡站终考",difficulty:5,lesson:"检查点、余客与另一辆车的通道要一起考虑。",optimal:27,totalBudget:28,
      trains:[{"start":[0,0],"capacity":3,"budget":14},{"start":[0,7],"capacity":2,"budget":15}],
      stops:[{"r":0,"c":1,"type":"pickup","goal":"yellow","count":2},{"r":0,"c":3,"type":"end","goal":"yellow","count":1},{"r":2,"c":2,"type":"pickup","goal":"red","count":2},{"r":1,"c":2,"type":"end","goal":"red","count":1},{"r":2,"c":1,"type":"end","goal":"yellow","count":1},{"r":4,"c":1,"type":"end","goal":"red","count":1},{"r":1,"c":5,"type":"pickup","goal":"red","count":2},{"r":0,"c":5,"type":"end","goal":"red","count":1},{"r":1,"c":4,"type":"pickup","goal":"yellow","count":1},{"r":3,"c":3,"type":"end","goal":"yellow","count":1},{"r":4,"c":3,"type":"pickup","goal":"cyan","count":1},{"r":5,"c":3,"type":"end","goal":"red","count":1},{"r":6,"c":5,"type":"end","goal":"cyan","count":1},{"r":2,"c":0,"type":"check","line":0},{"r":2,"c":3,"type":"check","line":0},{"r":5,"c":4,"type":"check","line":1},{"r":3,"c":4,"type":"check","line":1}],
      paths:[[[0,0],[0,3],[2,3],[2,2],[1,2],[1,0],[2,0],[2,1],[4,1]],[[0,7],[1,7],[1,5],[0,5],[0,4],[3,4],[3,3],[5,3],[5,5],[6,5]]]},
    {id:30,name:"有人直达有人换车",difficulty:5,lesson:"先算换乘时保留与转出人数，再安排两侧的配额。",optimal:25,totalBudget:26,
      trains:[{"start":[0,0],"capacity":4,"budget":13},{"start":[7,7],"capacity":3,"budget":14}],
      stops:[{"r":1,"c":4,"type":"pickup","goal":"red","count":3},{"r":3,"c":4,"type":"pickup","goal":"yellow","count":3},{"r":4,"c":3,"type":"end","goal":"yellow","count":2},{"r":4,"c":5,"type":"end","goal":"red","count":1},{"r":5,"c":5,"type":"end","goal":"yellow","count":1},{"r":4,"c":1,"type":"end","goal":"red","count":1},{"r":5,"c":0,"type":"end","goal":"red","count":1},{"r":3,"c":3,"type":"transfer"},{"r":0,"c":2,"type":"check","line":0},{"r":5,"c":1,"type":"check","line":1}],
      paths:[[[0,0],[0,4],[1,4],[1,3],[4,3],[4,5],[5,5]],[[7,7],[4,7],[4,6],[3,6],[3,2],[4,2],[4,1],[5,1],[5,0]]]},
  ];
  for(const {id,...definition} of definitions)M.levels[id-1]=M.makeLevel(definition,id-1);
  for(const level of M.levels)level.difficulty||=level.id<6?2:level.id<11?2:level.id<14?3:level.id===15?3:2;
})();
