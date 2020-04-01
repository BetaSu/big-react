// 调度器的实现
// 名词解释
// scheudle：调度，决定了work何时被执行
// work:任何需要被执行的计算，通常是一次更新的结果（例:setState）

const NoPriority = Symbol(0);
const ImmediatePriority = Symbol(1);
const UserBlockingPriority = Symbol(2);
const NormalPriority = Symbol(3);
const LowPriority = Symbol(4);
const IdlePriority = Symbol(5);

const taskQueue = [];
const syncTaskQueue = [];
let isTimeout = false;

// let currentPriorityLevel = NormalPriority;

// 达到微秒级精度，比 Date.now 精度更高
// performance.timing.navigationStart + performance.now() 约等于 Date.now()
function now() {
  return performance.now();
}

function workLoop() {
  window.requestIdleCallback(deadline => {
    // while (syncTaskQueue.length) {
    //   const curTask = syncTaskQueue.shift();
    //   curTask();
    // }
    isTimeout = deadline.timeRemaining() < 1;
    // while (!isTimeout && taskQueue.length) {
    //   const curTask = taskQueue.shift();
    //   curTask();
    // }
    workLoop();
  })
}

workLoop();

function scheduleCallback(priorityLevel, cb) {
  if (priorityLevel === ImmediatePriority) {
    syncTaskQueue.push(cb);
  } else {
    taskQueue.push(cb);
  }
}

function shouldYield() {
  return isTimeout;
}

export default {
  now,
  NoPriority,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  scheduleCallback,
  shouldYield
}