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
} from 'shared/ReactWorkTag';
import {
  Incomplete
} from 'shared/ReactSideEffectTags';
import {
  createWorkInProgress
} from './ReactFiber';
import {
  createInstance
} from 'reactDOM/ReactHostConfig';
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
  performSyncWorkOnRoot();
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
  renderExpirationTime = expirationTime;
}

export function unbatchedUpdates(fn, a) {
  try {
    return fn(a);
  } finally {
    
  }
}

// 传入的fiber是某个子树的叶子节点
function completeUnitOfWork(unitOfWork) {
  // 感觉不需要的样子
  // workInProgress = unitOfWork;
  do {
    const current = unitOfWork.alternate;
    const returnFiber = unitOfWork.return;
    if (!(unitOfWork.effectTag & Incomplete)) {
      // 该fiber还未处理完

      let next = completeWork(current, unitOfWork);

      if (next) {
        // 
        return next;
      }
    }
  } while(true)
}



function performUnitOfWork(unitOfWork) {
  // beginWork会返回fiber.child，不存在next意味着深度优先遍历已经遍历到某个子树的最深层叶子节点
  let next = beginWork(unitOfWork);
  if (!next) {
    next = completeUnitOfWork(unitOfWork);
  }
  return next;
}

// 这是不通过scheduler的同步任务的入口
function  performSyncWorkOnRoot() {
  if (workInProgress) {
    do {
      try {
        workLoopSync();
        break;
      } catch(e) {
        console.log('work loop sync err:', e);
      }
    } while (true)
  }
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