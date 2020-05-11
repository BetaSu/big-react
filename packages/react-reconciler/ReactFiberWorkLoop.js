// 工作循环相关内容
import {
  NoWork,
  Sync,
  Idle,
  msToExpirationTime,
  computeUserBlockingExpiration,
  computeAsyncExpiration,
  expirationTimeToMs,
  inferPriorityFromExpirationTime
} from './ReactFiberExpirationTime';
import {
  completeWork
} from './ReactFiberCompleteWork';
import {
  HostRoot,
  HostComponent
} from 'shared/ReactWorkTags';
import {
  createWorkInProgress
} from './ReactFiber';
import {
  createInstance
} from 'reactDOM/ReactHostConfig';
import {
  commitMutationEffects,
  commitBeforeMutationEffects,
  flushPassiveEffects,
  globalVariables as ReactFiberCommitWorkGlobalVariables
} from './ReactFiberCommitWork';
import beginWork from './ReactFiberBeginWork';

import * as Scheduler from 'scheduler';

let initialTimeMs = Scheduler.now();
// let isUnbatchingUpdates = false;
// 是否是批量update ex：同一个事件中触发多次update只会commit一次
// let isBatchingUpdates = false;

// 正在进行render阶段的任务的renderExpirationTime
let renderExpirationTime = null;
// 当前正在work的fiber
let workInProgress = null;
// 当前正在render阶段的root
// 在prepareFreshStack中会被赋值，在commitRoot中会被重置
let workInProgressRoot = null;

// React执行上下文标识
export const NoContext = /*                    */ 0b000000;
export const RenderContext = /*                */ 0b010000;
export const CommitContext = /*                */ 0b100000;

// 描述我们在React执行上下文的位置
// CommitContext 会在 commitRoot 有 effect时标记
let executionContext = NoContext;

export function getCurrentExecutionContext() {
  return executionContext;
}
export function setCurrentExecutionContext(context) {
  executionContext |= context;
}

// expirationTime的计算需要在当前时间的基础上根据优先级计算
// 然而，如果同一个事件中产生多个update，那他们的当前时间应该是一样的
let currentEventTime = NoWork;
export function requestCurrentTimeForUpdate() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // 当前处于 在react work 中（render 或 commit），返回真实时间
    return msToExpirationTime(Scheduler.now());
  }
  // 我们没有处在react的work流程中（render 或 commit）
  // 当前可能处于事件产生的schedule阶段，比如 onClick回调造成的update（虽然我们还没实现onClick）。或者 useEffect dispatchAction造成的update
  // currentEventTime在performConcurrentWorkOnRoot中会被重置
  // 在此之前，从产生update到performConcurrentWorkOnRoot之间这段时间（也就是schedule阶段）
  // 或者任务由于时间不够被中断后又从中断恢复了
  // 如果同一个事件产生了多个update，（比如 useState调用2次），那么他们会共用一个当前时间。
  if (currentEventTime !== NoWork) {
    // 短时间多次调用requestCurrentTimeForUpdate会走这个逻辑
    // 代表这是同一个浏览器事件触发的多次update
    // 我们将他们统一处理
    return currentEventTime;
  }
  // 这是react被scheduler中断后产生的第一个update，计算一个时间
  currentEventTime = msToExpirationTime(Scheduler.now());
  return currentEventTime;
}

export function getCurrentTime() {
  return msToExpirationTime(Scheduler.now());
}

export function computeExpirationForFiber(currentTime, fiber) {
  // 不同事件触发的update会产生不同priority
  // 不同priority使fiber获得不同的expirationTime
  const priorityLevel = Scheduler.getCurrentPriorityLevel();
  
  if ((executionContext & RenderContext) !== NoContext) {
    // 如果正处于render阶段，返回本次render的expirationTime
    return renderExpirationTime;
  }

  let expirationTime;
  // 根据Scheduler priority计算过期时间
  // 对这几种priority的解释见 Scheduler模块下的runWithPriority
  switch (priorityLevel) {
    case Scheduler.ImmediatePriority:
      expirationTime = Sync;
      break;
    case Scheduler.UserBlockingPriority:
      // TODO: Rename this to computeUserBlockingExpiration
      expirationTime = computeUserBlockingExpiration(currentTime);
      break;
    case Scheduler.NormalPriority:
    case Scheduler.LowPriority: 
      expirationTime = computeAsyncExpiration(currentTime);
      break;
    case Scheduler.IdlePriority:
      expirationTime = Idle;
      break;
    default:
      break;
  }

  if (workInProgressRoot && expirationTime === renderExpirationTime) {
    // 我们正在render中，这时产生了update 但是 executionContext 不是 RenderContext 存疑？？
    console.warn('render的同时产生了update');
  }

  return expirationTime;
}

// 从当前fiber递归上去到root，再从root开始work
// TODO 检查是否中断
// 我们只处理异步任务，所以不需要通过expirationTime检查是否是异步
export function scheduleUpdateOnFiber(fiber, expirationTime) {
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);

  if (!root) {
    return;
  }

  ensureRootIsScheduled(root);
}

// 将root加入schedule，root上每次只能存在一个scheduled的任务
// 每次创建update后都会调用这个函数，需要考虑如下情况：
// 1. root上有过期任务，需要以ImmediatePriority立刻调度该任务
// 2. root上已有schedule但还未到时间执行的任务，比较新旧任务expirationTime和优先级处理
// 3. root上还没有已有schedule的任务，则开始该任务的render阶段
function ensureRootIsScheduled(root) {
  const lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime !== NoWork) {
    // 有过期任务未执行，立即schedule他
    root.callbackExpirationTime = Sync;
    root.callbackPriority = Scheduler.ImmediatePriority;
    // 在 performSyncWorkOnRoot、performConcurrentWorkOnRoot、commitRoot 都有调用 flushPassiveEffects
    // flushPassiveEffects 内部会做2件事：
    // 1. commit passive effect （即useEffect产生的effect）
    // 2. 执行过期了的同步任务（Scheduler.scheduleSyncCallback的目的就是注册过期同步任务）
    // 其中在 performSyncWorkOnRoot、performConcurrentWorkOnRoot中由于还未开始render，不存在effect，所以目的是在render开始前执行过期同步任务
    root.callbackNode = Scheduler.scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    return;
  }

  // 寻找root本次更新的expirationTime
  const expirationTime = getNextRootExpirationTimeToWorkOn(root);
  const existingCallbackNode = root.callbackNode;
  if (expirationTime === NoWork) {
    // 重置root callbackNode
    if (existingCallbackNode) {
      root.callbackNode = null;
      root.callbackExpirationTime = NoWork;
      root.callbackPriority = Scheduler.NoPriority;
    }
    return;
  }

  // 从当前时间和expirationTime推断任务优先级
  const currentTime = requestCurrentTimeForUpdate();
  const priorityLevel = inferPriorityFromExpirationTime(currentTime, expirationTime);

  if (existingCallbackNode) {
    // 该root上已存在schedule的root
    const existingCallbackNodePriority = root.callbackPriority;
    const existingCallbackExpirationTime = root.callbackExpirationTime;
    if (existingCallbackExpirationTime === expirationTime && existingCallbackNodePriority >= priorityLevel) {
      // 该root已经存在的任务expirationTime和新udpate产生的expirationTime一致
      // 这代表他们可能是同一个事件触发产生的update
      // 且已经存在的任务优先级更高，则可以取消这次update的render
      return;
    }
    // 否则代表新udpate产生的优先级更高，取消之前的schedule，重新开始一次新的
    Scheduler.cancelCallback(existingCallbackNode);
  }

  root.callbackExpirationTime = expirationTime;
  root.callbackPriority = priorityLevel;

  let callbackNode;
  if (expirationTime === Sync) {
    callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    callbackNode = Scheduler.scheduleCallback(
      priorityLevel, 
      performConcurrentWorkOnRoot.bind(null, root),
      // 根据expirationTime，为任务计算一个timeout
      // timeout会影响任务执行优先级
      {timeout: expirationTimeToMs(expirationTime) - Scheduler.now()}
    )
  }
  root.callbackNode = callbackNode;
}

// schedule阶段结束，进入concurrent模式的render阶段
function performConcurrentWorkOnRoot(root, didTimeout) {
  currentEventTime = NoWork;

  if (didTimeout) {
    // 由于currentEventTime已经被重置，且还未处于render或commit
    // 所以currentTime是一个新的时间
    const currentTime = requestCurrentTimeForUpdate();
    // 标记任务过期，这样ensureRootIsScheduled时会以同步任务的形式处理该任务
    markRootExpiredAtTime(root, currentTime);
    ensureRootIsScheduled(root);
    return null;
  }

  const expirationTime = getNextRootExpirationTimeToWorkOn(root);
  if (expirationTime === NoWork) {
    return null;
  }
  
  const originalCallbackNode = root.callbackNode;

  // 如果有已过期同步任务，先执行他们
  flushPassiveEffects();

  if (root !== workInProgressRoot || expirationTime !== renderExpirationTime) {
    prepareFreshStack(root, expirationTime);
  }

  if (workInProgress) {
    const prevExecutionContext = executionContext;
    executionContext |= RenderContext;

    do {
      try {
        workLoopConcurrent();
        break;
      } catch(e) {
        console.error('concurrent render error', e);
      }
    } while (true)

    executionContext = prevExecutionContext;

    const finishedWork = root.finishedWork = root.current.alternate;
    root.finishedExpirationTime = expirationTime;
    workInProgressRoot = null;
    commitRoot(root);

    ensureRootIsScheduled(root);

    if (root.callbackNode === originalCallbackNode) {
      // 如果下一次schedule的callbackNode和这一次一样，返回一个继续执行的回调函数
      // 具体逻辑见 Scheduler模块 workLoop函数 continuationCallback变量 定义处
      return performConcurrentWorkOnRoot.bind(null, root);
    }
  }
  return null;
}

function getNextRootExpirationTimeToWorkOn(root) {
  const lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime !== NoWork) {
    // 有过期任务
    return lastExpiredTime;
  }
  const firstPendingTime = root.firstPendingTime;
  // TODO suspense
  return firstPendingTime;
}

function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;

  if (workInProgress !== null) {
    // TODO 有未完成的任务时需要中断，主要是处理context
    // let interruptedWork = workInProgress.return;
    // while (interruptedWork !== null) {
    //   unwindInterruptedWork(interruptedWork);
    //   interruptedWork = interruptedWork.return;
    // }
    console.log('TODO 任务需要中断');
  }
  
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  renderExpirationTime = expirationTime;
}

export function unbatchedUpdates(fn, a) {
  try {
    return fn(a);
  } finally {
    
  }
}

// 获取fiber及fiber子孙节点中最大的expirationTime
function getRemainingExpirationTime(fiber) {
  const updateExpirationTime = fiber.expirationTime;
  const childExpirationTime = fiber.childExpirationTime;
  return updateExpirationTime > childExpirationTime ? updateExpirationTime : childExpirationTime;
}

// 将child fiber的expirationTime冒泡到父级
// 这样在父级就能直到子孙中优先级最高到expirationTime
// 配合 bailoutOnAlreadyFinishedWork 的优化路径
function resetChildExpirationTime(completedWork) {
  let newChildExpirationTime = NoWork;
  let child = completedWork.child;

  while (child) {
    const childUpdateExpirationTime = child.expirationTime;
    const childChildExpirationTime = child.childChildExpirationTime;
    if (childUpdateExpirationTime > newChildExpirationTime) {
      newChildExpirationTime = childUpdateExpirationTime;
    }
    if (childChildExpirationTime > newChildExpirationTime) {
      newChildExpirationTime = childChildExpirationTime;
    }
    child = child.sibling;
  }
  completedWork.childExpirationTime = newChildExpirationTime;
}

// 由于一定是beginWork返回null才会执行completeUnitOfWork，而beginWork始终创建并返回fiber.child
// 所以传入的fiber一定是某个子树的叶子节点
// 返回节点的兄弟节点（如果存在），不存在兄弟节点时递归上一级
function completeUnitOfWork(unitOfWork) {
  workInProgress = unitOfWork;
  do {
    const current = workInProgress.alternate;
    const returnFiber = workInProgress.return;
    // if (!(workInProgress.effectTag & Incomplete)) {
    if (true) {
      // 该fiber未抛出错误

      // 当前总会返回null
      let next = completeWork(current, workInProgress);
      resetChildExpirationTime(workInProgress);

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
  } while(workInProgress)

  return null;
}

// 包裹一层commitRoot，commit使用Scheduler调度
function commitRoot(root) {
  const renderPriorityLevel = Scheduler.getCurrentPriorityLevel();
  Scheduler.runWithPriority(Scheduler.ImmediatePriority, commitRootImp.bind(null, root, renderPriorityLevel));
}

// commit阶段的入口，包括如下子阶段：
// before mutation阶段：遍历effect list，执行 DOM操作前触发的钩子
// mutation阶段：遍历effect list，执行effect
function commitRootImp(root) {
  do {
    // syncCallback会保存在一个内部数组中，在 flushPassiveEffects 中 同步执行完
    // 由于syncCallback的callback是 performSyncWorkOnRoot，可能产生新的 passive effect
    // 所以需要遍历直到rootWithPendingPassiveEffects为空
    flushPassiveEffects();
  } while (ReactFiberCommitWorkGlobalVariables.rootWithPendingPassiveEffects !== null)
  const renderPriorityLevel = Scheduler.getCurrentPriorityLevel();
  const finishedWork = root.finishedWork;
  const expirationTime = root.finishedExpirationTime;

  if (!finishedWork) {
    return null;
  }

  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;

  // 重置Scheduler相关
  root.callbackNode = null;
  root.callbackExpirationTime = NoWork;
  root.callbackPriority = Scheduler.NoPriority;

  // 已经在commit阶段，finishedWork对应的expirationTime对应的任务的处理已经接近尾声
  // 让我们找找下一个需要处理的任务
  // 在 completeUnitOfWork中有childExpirationTime的冒泡逻辑
  // fiber树中高优先级的expirationTime会冒泡到顶上
  // 所以 childExpirationTime 代表整棵fiber树中下一个最高优先级的任务对应的expirationTime
  const remainingExpirationTimeBeforeCommit = getRemainingExpirationTime(finishedWork);
  // 更新root的firstPendingTime，这代表下一个要进行的任务的expirationTime
  markRootFinishedAtTime(root, expirationTime, remainingExpirationTimeBeforeCommit);

  if (root === workInProgressRoot) {
    // 重置 workInProgress
    workInProgressRoot = null;
    workInProgress = null;
    renderExpirationTime = NoWork;
  }

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
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    nextEffect = firstEffect;    
    do {
      try {
        nextEffect = commitBeforeMutationEffects(nextEffect);
      } catch(e) {
        console.warn('commit before error', e);
        nextEffect = nextEffect.nextEffect;
      }
    } while(nextEffect)

    // mutation阶段
    nextEffect = firstEffect;
    do {
      try {
        nextEffect = commitMutationEffects(root, nextEffect);
      } catch(e) {
        console.warn('commit mutaion error', e);
        nextEffect = nextEffect.nextEffect;
      }
    } while(nextEffect)

    // workInProgress tree 现在完成副作用的渲染变成current tree
    // 之所以在 mutation阶段后设置是为了componentWillUnmount触发时 current 仍然指向之前那棵树
    root.current = finishedWork;
    
    if (ReactFiberCommitWorkGlobalVariables.rootDoesHavePassiveEffects) {
      // 本次commit含有passiveEffect
      ReactFiberCommitWorkGlobalVariables.rootDoesHavePassiveEffects = false;
      ReactFiberCommitWorkGlobalVariables.rootWithPendingPassiveEffects = root;
      ReactFiberCommitWorkGlobalVariables.pendingPassiveEffectsExpirationTime = expirationTime;
      ReactFiberCommitWorkGlobalVariables.pendingPassiveEffectsRenderPriority = renderPriorityLevel;
    } else {
      // effectList已处理完，GC
      nextEffect = firstEffect;
      while (nextEffect) {
        const nextNextEffect = nextEffect.next;
        nextEffect.next = null;
        nextEffect = nextNextEffect;
      }
    }
    executionContext = prevExecutionContext;
  } else {
    // 无effect
    root.current = finishedWork;
  }
}

function markRootFinishedAtTime(root, finishedExpirationTime, remainingExpirationTime) {
  root.firstPendingTime = remainingExpirationTime;

  if (finishedExpirationTime <= root.lastExpiredTime) {
    // 优先级比lastExpiredTime更低的任务已经完成
    root.lastExpiredTime = NoWork;
  }
}

// 标记时间片不够用而中断的任务的expirationTime
function markRootExpiredAtTime(root, expirationTime) {
  const lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime === NoWork || lastExpiredTime > expirationTime) {
    // lastExpiredTime指fiber上存在的最低优先级的过期任务expirationTime
    // lastExpiredTime > expirationTime 表示fiber已经存在的过期任务的优先级更高
    // 由于是过期任务，高优先级expiredTime对应任务已经同步执行过
    // 所以将高优先级expiredTime替换为低优先级expiredTime
    root.lastExpiredTime = expirationTime;
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  // beginWork会返回fiber.child，不存在next意味着深度优先遍历已经遍历到某个子树的最深层叶子节点
  let next = beginWork(current, unitOfWork, renderExpirationTime);
  // beginWork完成 props的diff已经完成，可以更新momoizedProps
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (!next) {
    next = completeUnitOfWork(unitOfWork);
  }
  return next;
}

// 这是不通过scheduler的同步任务render阶段的入口
function  performSyncWorkOnRoot(root) {
  const lastExpiredTime = root.lastExpiredTime;
  const expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;

  // 如果有已过期同步任务，先执行他们
  flushPassiveEffects();

  if (root !== workInProgressRoot || expirationTime !== renderExpirationTime) {
    prepareFreshStack(root, expirationTime);
  }

  if (workInProgress) {
    const prevExecutionContext = executionContext;
    executionContext |= RenderContext;

    do {
      workLoopSync();
      break;
    } while (true)

    executionContext = prevExecutionContext;
    root.finishedWork = root.current.alternate;
    root.finishedExpirationTime = expirationTime;
    // render阶段结束，进入commit阶段
    commitRoot(root);
    ensureRootIsScheduled(root);
  }
  return null;
}

// 从当前fiber向上更新expirationTime，直到root
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
  if (fiber.expirationTime < expirationTime) {
    // 更新触发update的fiber的expirationTime
    fiber.expirationTime = expirationTime;
  }
  let alternate = fiber.alternate;
  if (alternate && alternate.expirationTime < expirationTime) {
    // 同时更新 alternate
    alternate.expirationTime = expirationTime;
  }

  let node = fiber.return;
  let root;

  if (!node && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
    while (node) {
      alternate = node.alternate;

      // 更新childExpirationTime
      if (node.childExpirationTime < expirationTime) {
        node.childExpirationTime = expirationTime

        if (alternate && alternate.childExpirationTime < expirationTime) {
          alternate.childExpirationTime = expirationTime;
        }
      } else if (alternate && alternate.childExpirationTime < expirationTime) {
        alternate.childExpirationTime = expirationTime;
      }

      if (!node.return && node.tag === HostRoot) {
        root = node.stateNode;
        break;
      }
      node = node.return;
    }
  }
  if (root) {
    // 标记root的 pendingTime
    markRootUpdatedAtTime(root, expirationTime);
  }
  return root;
}

function markRootUpdatedAtTime(root, expirationTime) {
  const firstPendingTime = root.firstPendingTime;

  if (expirationTime > firstPendingTime) {
    // 如果有优先级更高的任务，更新firstPendingTime
    root.firstPendingTime = expirationTime;
  }
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