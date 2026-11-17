/* Early lessons use the same empty 8 × 8 board. Larger boards remain data-driven. */
(() => {
  const M = window.Metro;
  const expand = points => {
    const route = [[...points[0]]];
    for (const target of points.slice(1)) {
      const previous = route.at(-1);
      const dr = Math.sign(target[0] - previous[0]), dc = Math.sign(target[1] - previous[1]);
      const length = Math.abs(target[0] - previous[0]) + Math.abs(target[1] - previous[1]);
      for (let i = 1; i <= length; i++) route.push([previous[0] + dr * i, previous[1] + dc * i]);
    }
    return route;
  };
  const pickup = (r, c, goal, count) => ({ r, c, type: 'pickup', goal, count });
  const end = (r, c, goal, count) => ({ r, c, type: 'end', goal, count });
  M.goals = { red: '#ce796b', yellow: '#d6ab49', cyan: '#609fa5' };
  const definitions = [
    {
      name: '第一程', lesson: 'UP 标志上车，圈 X 标志下车。',
      start: [1, 1], capacity: 2, budget: 7, optimal: 5,
      stops: [pickup(1, 3, 'red', 1), end(1, 6, 'red', 1)], waypoints: [[1, 1], [1, 6]]
    },
    {
      name: '转个弯', lesson: '点击同行或同列的格子，铁路可以转弯。',
      start: [6, 1], capacity: 2, budget: 10, optimal: 7,
      stops: [pickup(4, 1, 'yellow', 2), end(2, 4, 'yellow', 2)], waypoints: [[6, 1], [2, 1], [2, 4]]
    },
    {
      name: '先送再接', lesson: '先把红色乘客送到，再接黄色乘客。',
      start: [1, 1], capacity: 2, budget: 12, optimal: 9,
      stops: [pickup(1, 3, 'red', 2), end(3, 3, 'red', 2), pickup(5, 3, 'yellow', 2), end(5, 6, 'yellow', 2)],
      waypoints: [[1, 1], [1, 3], [5, 3], [5, 6]]
    },
    {
      name: '空出座位', lesson: '车上只有两个座位，接客顺序很重要。',
      start: [6, 1], capacity: 2, budget: 16, optimal: 13,
      stops: [pickup(4, 1, 'yellow', 2), end(2, 1, 'yellow', 2), pickup(4, 4, 'red', 1), end(1, 5, 'red', 1)],
      waypoints: [[6, 1], [2, 1], [2, 3], [4, 3], [4, 4], [1, 4], [1, 5]]
    },
    {
      name: '刚刚好的铁路', lesson: '接送全部乘客，试着少用几段铁路。',
      start: [0, 0], capacity: 2, budget: 16, optimal: 14,
      stops: [pickup(0, 3, 'red', 1), end(2, 3, 'red', 1), pickup(5, 2, 'yellow', 2), end(6, 6, 'yellow', 2)],
      waypoints: [[0, 0], [0, 3], [2, 3], [5, 3], [5, 2], [6, 2], [6, 6]]
    }
  ];
  M.expandRoute=expand;
  M.makeLevel=(definition,index)=>{
    const { start, capacity, budget, waypoints, ...rest } = definition;
    const trains=definition.trains||[{start,capacity,budget}];
    return {...rest,id:index+1,size:definition.size||8,blocked:definition.blocked||[],totalBudget:definition.totalBudget||trains.reduce((sum,t)=>sum+t.budget,0),trains,
      stops:[...trains.map((train,line)=>({r:train.start[0],c:train.start[1],type:'depot',line})),...rest.stops],
      referenceSolution:(definition.paths||[waypoints]).map(expand)};
  };
  M.levels=definitions.map(M.makeLevel);
})();
