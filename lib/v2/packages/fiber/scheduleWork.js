import {renderer} from '../core/renderer';
import {reconcileDFS} from './beginWork';
import {commitDFS} from './commitWork';

const {macrotasks, effects}= renderer;

// 执行工作循环
const workLoop = deadline => {
  let shouldYield = false;
  while (macrotasks.length && !shouldYield) {
    performUnitOfWork();
    shouldYield = deadline.timeRemaining() < 1;
    if (!macrotasks.length && effects.length) {
      //执行任务
      commitDFS(effects); 
    }
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

//更新虚拟DOM与真实环境
const performUnitOfWork = () => {
  let fiber = macrotasks.shift();
  console.log(fiber)
  // reconcileDFS(fiber, deadline, 1);
  // effects.push(fiber);
}

//setState的实现
function updateComponent(fiber) {
  
  mergeUpdates(fiber, state, isForced, callback);
  
}