// 工作循环相关内容

import {
  NoWork,
  msToExpirationTime
} from './ReactFiberExpirationTime';
import {
  completeWork
} from './ReactFiberCompleteWork';
import {
  HostRoot,
  HostComponent
} from 'shared/ReactWorkTags';
import {
  Incomplete
} from 'shared/ReactSideEffectTags';
import {
  createWorkInProgress
} from './ReactFiber';
import {
  createInstance
} from 'reactDOM/ReactHostConfig';
import {
  commitMutationEffects,
  commitBeforeMutationEffects
} from './ReactFiberCommitWork';
import beginWork from './ReactFiberBeginWork';
import Scheduler from 'scheduler';

let initialTimeMs = Scheduler.now();
// let isUnbatchingUpdates = false;
// 是否是批量update ex：同一个事件中触发多次update只会commit一次
// let isBatchingUpdates = false;

// 当前render的过期时间
// 该过期时间并不仅仅是某一个update的过期时间，
// 在同一个事件中触发的多次updaet应该共用同一个过期时间
// 在一小段时间（10ms）内触发的update也应该共用同一个过期时间
let currentEventTime = NoWork;
// 当前正在work的fiber
let workInProgress;

export function requestCurrentTimeForUpdate() {
  if (currentEventTime !== NoWork) {
    return currentEventTime;
  }
  currentEventTime = msToExpirationTime(Scheduler.now());
  return currentEventTime;
}

export function getCurrentTime() {
  return msToExpirationTime(Scheduler.now());
}

export function computeExpirationForFiber(currentTime, fiber) {
  
}

// 将fiber的ept一直同步到root
// 检查是否中断
// 区分当前任务使同步还是异步
export function scheduleUpdateOnFiber(fiber, expirationTime) {
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  prepareFreshStack(root, expirationTime);
  performSyncWorkOnRoot(root);
}

function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  // root.finishedExpirationTime = NoWork;

  // 有未完成的任务时需要中断
  if (workInProgress !== null) {
    // let interruptedWork = workInProgress.return;
    // while (interruptedWork !== null) {
    //   unwindInterruptedWork(interruptedWork);
    //   interruptedWork = interruptedWork.return;
    // }
  }
  workInProgress = createWorkInProgress(root.current, null);
  // renderExpirationTime = expirationTime;
}

export function unbatchedUpdates(fn, a) {
  try {
    return fn(a);
  } finally {
    
  }
}

// 传入的fiber是某个子树的叶子节点
function completeUnitOfWork(unitOfWork) {
  workInProgress = unitOfWork;
  do {
    const current = workInProgress.alternate;
    const returnFiber = workInProgress.return;
    // if (!(workInProgress.effectTag & Incomplete)) {
    if (true) {
      // 该fiber未抛出错误

      let next = completeWork(current, workInProgress);

      if (next) {
        return next;
      }

      if (returnFiber) {
      // if (returnFiber && !(returnFiber.effectTag & Incomplete)) {
        // 将完成的fiber的 effect list append到父级fiber上
        // 这样一级级递归上去后，根节点会有一条本次update所有有effect的fiber的list
        // 在执行DOM操作时只需要遍历这条链表而不需要再递归一遍整个fiber树就能执行effect对应DOM操作
        if (!returnFiber.firstEffect) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect) {
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }
        const effectTag = workInProgress.effectTag;
        if (effectTag) {
          // 如果当前fiber上存在effect，把他附在父fiber effect list的最后
          if (returnFiber.lastEffect) {
            // 父fiber list 已有effect
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
        }
      }

      const sibling = workInProgress.sibling;
      if (sibling) {
        // 当前父fiber下处理完workInProgress，再去处理他的兄弟节点
        return sibling;
      }
      // 兄弟节点也处理完后，向上一级继续处理
      workInProgress = returnFiber;
    }
  } while(true)

  return null;
}



// commit阶段的入口，包括子阶段：
// before mutation阶段：遍历effect list，执行 DOM操作前触发的钩子
// mutation阶段：遍历effect list，执行effect
function commitRoot(root) {
  // TODO 根据scheduler优先级执行
  const finishedWork = root.finishedWork;
  if (!finishedWork) {
    return null;
  }
  root.finishedWork = null;

  let firstEffect;
  if (root.effectTag) {
    // 由于根节点的effect list不含有自身的effect，所以当根节点本身存在effect时需要将其append 入 effect list
    if (finishedWork.lastEffect) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // 根节点本身没有effect
    firstEffect = finishedWork.firstEffect;
  }

  let nextEffect;

  if (firstEffect) {
    // before mutation阶段
    nextEffect = firstEffect;    
    do {
      try {
        commitBeforeMutationEffects(nextEffect);
      } catch(e) {
        console.warn('commit before error', e);
        nextEffect = nextEffect.nextEffect;
      }
    } while(nextEffect)

    // mutation阶段
    nextEffect = firstEffect;
    do {
      try {
        commitMutationEffects(root, nextEffect);
      } catch(e) {
        console.warn('commit mutaion error', e);
        nextEffect = nextEffect.nextEffect;
      }
    } while(nextEffect)
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  // beginWork会返回fiber.child，不存在next意味着深度优先遍历已经遍历到某个子树的最深层叶子节点
  let next = beginWork(current, unitOfWork);
  if (!next) {
    next = completeUnitOfWork(unitOfWork);
  }
  return next;
}

// 这是不通过scheduler的同步任务的入口
function  performSyncWorkOnRoot(root) {
  if (workInProgress) {
    do {
      workLoopSync();
      break;
      // try {
      //   workLoopSync();
      //   break;
      // } catch(e) {
      //   console.log('work loop sync err:', e);
      // }
    } while (true)
  }
  root.finishedWork = root.current.alternate;
  // render阶段结束，进入commit阶段
  commitRoot(root);
  return null;
}

// 当前只实现了从fiber向上直到root
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
  // if (fiber.expirationTime < expirationTime) {
  //   fiber.expirationTime = expirationTime;
  // }
  // const alternate = fiber.alternate;
  // if (alternate && alternate.expirationTime < expirationTime) {
  //   alternate.expirationTime = expirationTime;
  // }
  let node = fiber.return;
  let root;
  if (!node && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
    while (node) {
      if (!node.return && node.tag === HostRoot) {
        root = node.stateNode;
        break;
      }
      node = node.return;
    }
  }
  return root;
}

// 对于已经过期的任务，不需要考虑任务是否需要中断
function workLoopSync() {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

// 执行任务直到调度器让我们暂定
function workLoopConcurrent() {
  while (workInProgress && !Scheduler.shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}