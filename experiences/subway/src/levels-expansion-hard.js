/* Validated forest and 10 × 10 challenge candidates. */
(() => {
  const M=window.Metro;
  const definitions=[
    {id:33,size:8,name:"狭路让行",difficulty:4,lesson:"树林之间的路要留给谁？先分好任务再落轨。",optimal:27,totalBudget:28,
      trains:[{"start":[7,0],"capacity":3,"budget":15},{"start":[7,7],"capacity":2,"budget":14}],blocked:[[2,2],[2,3],[6,5],[6,4],[6,3],[0,2],[2,4],[0,3],[3,4]],
      stops:[{"r":4,"c":0,"type":"pickup","goal":"yellow","count":2},{"r":4,"c":1,"type":"end","goal":"yellow","count":1},{"r":2,"c":1,"type":"pickup","goal":"red","count":2},{"r":2,"c":0,"type":"end","goal":"red","count":1},{"r":1,"c":3,"type":"end","goal":"yellow","count":1},{"r":1,"c":4,"type":"end","goal":"red","count":1},{"r":6,"c":7,"type":"pickup","goal":"red","count":2},{"r":6,"c":6,"type":"end","goal":"red","count":1},{"r":7,"c":6,"type":"pickup","goal":"yellow","count":1},{"r":6,"c":2,"type":"end","goal":"yellow","count":1},{"r":5,"c":2,"type":"pickup","goal":"cyan","count":1},{"r":5,"c":3,"type":"end","goal":"red","count":1},{"r":3,"c":2,"type":"end","goal":"cyan","count":1}],
      paths:[[[7,0],[7,1],[5,1],[5,0],[4,0],[4,1],[2,1],[2,0],[1,0],[1,4]],[[7,7],[6,7],[6,6],[7,6],[7,2],[5,2],[5,3],[4,3],[4,2],[3,2]]]},
    {id:35,size:8,name:"林间换乘",difficulty:5,lesson:"林间换乘：留好入口，再算保留与换车的人数。",optimal:23,totalBudget:24,
      trains:[{"start":[0,0],"capacity":4,"budget":14},{"start":[7,7],"capacity":3,"budget":11}],blocked:[[1,0],[0,2],[0,3],[4,6],[4,5],[5,0],[1,4],[4,2],[1,5]],
      stops:[{"r":1,"c":3,"type":"pickup","goal":"red","count":3},{"r":4,"c":7,"type":"pickup","goal":"yellow","count":3},{"r":2,"c":1,"type":"end","goal":"yellow","count":2},{"r":3,"c":0,"type":"end","goal":"red","count":1},{"r":4,"c":1,"type":"end","goal":"yellow","count":1},{"r":4,"c":3,"type":"end","goal":"red","count":1},{"r":5,"c":3,"type":"end","goal":"red","count":1},{"r":3,"c":3,"type":"transfer"}],
      paths:[[[0,0],[0,1],[1,1],[1,3],[3,3],[3,2],[2,2],[2,0],[4,0],[4,1]],[[7,7],[3,7],[3,3],[5,3]]]},
    {id:38,size:10,name:"远处还有人下车",difficulty:4,lesson:"换车后还有远处的下客站，三种颜色分别计算。",optimal:37,totalBudget:38,
      trains:[{"start":[0,0],"capacity":4,"budget":20},{"start":[9,9],"capacity":3,"budget":19}],blocked:[[3,0],[9,7],[2,0],[4,7],[6,4],[4,0],[5,0],[5,1],[6,0],[7,0],[6,1],[5,2]],
      stops:[{"r":3,"c":1,"type":"pickup","goal":"red","count":3},{"r":4,"c":1,"type":"pickup","goal":"cyan","count":1},{"r":5,"c":4,"type":"pickup","goal":"yellow","count":3},{"r":5,"c":8,"type":"end","goal":"yellow","count":2},{"r":4,"c":9,"type":"end","goal":"red","count":1},{"r":2,"c":9,"type":"end","goal":"yellow","count":1},{"r":3,"c":3,"type":"end","goal":"red","count":1},{"r":2,"c":2,"type":"end","goal":"cyan","count":1},{"r":0,"c":2,"type":"end","goal":"red","count":1},{"r":4,"c":4,"type":"transfer"}],
      paths:[[[0,0],[1,0],[1,1],[4,1],[4,6],[5,6],[5,8],[4,8],[4,9],[3,9],[3,8],[2,8],[2,9]],[[9,9],[7,9],[7,8],[6,8],[6,7],[7,7],[7,6],[6,6],[6,5],[5,5],[5,4],[3,4],[3,3],[2,3],[2,2],[0,2]]]},
    {id:40,size:10,name:"两条线的一张网",difficulty:5,lesson:"森林、检查站和三色配额，一起完成这张网。",optimal:33,totalBudget:34,
      trains:[{"start":[0,0],"capacity":4,"budget":15},{"start":[9,9],"capacity":3,"budget":20}],blocked:[[1,6],[2,6],[4,2],[1,8],[3,6],[1,4],[1,9],[0,4],[0,8],[2,8],[3,7],[1,3]],
      stops:[{"r":1,"c":0,"type":"pickup","goal":"red","count":2},{"r":2,"c":2,"type":"pickup","goal":"red","count":1},{"r":3,"c":2,"type":"pickup","goal":"cyan","count":1},{"r":8,"c":9,"type":"pickup","goal":"yellow","count":2},{"r":4,"c":9,"type":"pickup","goal":"yellow","count":1},{"r":5,"c":6,"type":"end","goal":"yellow","count":2},{"r":7,"c":6,"type":"end","goal":"red","count":1},{"r":8,"c":6,"type":"end","goal":"yellow","count":1},{"r":0,"c":5,"type":"end","goal":"red","count":1},{"r":0,"c":6,"type":"end","goal":"cyan","count":1},{"r":2,"c":7,"type":"end","goal":"red","count":1},{"r":4,"c":4,"type":"transfer"},{"r":2,"c":0,"type":"check","line":0},{"r":3,"c":5,"type":"check","line":1}],
      paths:[[[0,0],[2,0],[2,2],[3,2],[3,3],[4,3],[4,4],[5,4],[5,6],[8,6]],[[9,9],[4,9],[4,4],[3,4],[3,5],[0,5],[0,7],[2,7]]]},
  ];
  for(const {id,...definition} of definitions)M.levels[id-1]=M.makeLevel(definition,id-1);
})();
