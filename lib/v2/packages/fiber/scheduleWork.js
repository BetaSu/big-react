import {Renderer} from '../core/createRenderer';
import {effects} from '../core/util';
import {reconcileDFS} from './beginWork';

// 小于该时间会终止工作循环的计算，给主线程UI渲染腾出时间
const ENOUGH_TIME = 1;

const macrotasks = Renderer.macrotasks;

// 为Renderer绑定执行工作循环的方法
Renderer.scheduleWork = function() {
  requestIdleCallback(performWork);
};

// 执行工作循环
const performWork = deadline => {
  workLoop(deadline);
  if (macrotasks.length) {
      requestIdleCallback(performWork);
  }
}

//更新虚拟DOM与真实环境
const workLoop = deadline => {
  let fiber = macrotasks.shift();
  if (!fiber) return;

  reconcileDFS(fiber, deadline, ENOUGH_TIME);
  updateCommitQueue(fiber);

  if (macrotasks.length && deadline.timeRemaining() > ENOUGH_TIME) {
    //收集任务
    workLoop(deadline);
  } else {
    //执行任务
    commitDFS(effects); 
  }
}

function updateCommitQueue(fiber) {
  effects.push(fiber);
}