import ReactSharedInternals from 'shared/ReactSharedInternals';
import * as DOMRenderer from 'reactReconciler';
import {
  Update as UpdateEffect, 
  Passive as PassiveEffect
} from 'shared/ReactSideEffectTags';
import {
  NoEffect as NoHookEffect,
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Passive as HookPassive
} from 'shared/ReactHookEffectTags';
import {
  requestCurrentTimeForUpdate,
  computeExpirationForFiber
} from './ReactFiberWorkLoop';
import {
  markWorkInProgressReceivedUpdate
} from './ReactFiberBeginWork';
import { NoWork } from './ReactFiberExpirationTime';
const {ReactCurrentDispatcher} = ReactSharedInternals;


// hook以单向链表的形式存储在fiber.memoizedState中
// currentHook属于current fiber
// workInProgressHook会被插入到workInprogress fiber
let currentHook;
let workInProgressHook;
// 指向workInProgress
let currentlyRenderingFiber;

let renderExpirationTime = NoWork;

// 传给useState的第二个参数，可以接受 值 或 回调函数 作为参数
function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

// useState是一种特殊的useReducer
function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState);
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null
  };
}

// effect对象保存在fiber.updateQueue.lastEffect 链表
function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    // 环
    next : null
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (!componentUpdateQueue) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }
  return effect;
}

// 获取当前hook的状态信息
// 根据queue里存储的update更新hook的状态信息
function updateReducer(reducer, initialArg) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  queue.lastRenderedReducer = reducer;

  const current = currentHook;
  let baseQueue = queue.baseQueue;
  let pendingQueue = queue.pending;

  if (pendingQueue) {
    // 将pending加入baseQueue
    if (baseQueue) {
      // baseQueue本身指向baseQueue中的最后一个update
      const baseFirst = baseQueue.next;
      // pendingQueue本身指向pendingQueue中的最后一个update
      const pendingFirst = pendingQueue.next;
      // 假设 baseQueue: b-1(最后一个,baseQueue引用他) -> b0 -> b1 -> b-1
      // 假设 pendingQueue: p-1(最后一个,pendingQueue引用他) -> p0 -> p1 -> p-1
      // 以下2行操作的意思是
      // b-1 -> p0
      baseQueue.next = pendingFirst;
      // p-1 -> b0
      pendingQueue.next = baseFirst;
      // 则操作完成后形成 pendingQueue: p-1 -> b0 -> b1 -> b-1 -> p0 -> p1 -> p-1
      // 即将pendingQueue append到baseQueue
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue) {
    // 需要更新state
    let first = baseQueue.next;
    let newState = current.baseState;

    // let newBaseState;
    // let newBaseQueueFirst;
    // let newBaseQueueLast;
    let update = first;

    do {
      // TODO 优先级判断
      // TODO 更新baseQueue的逻辑
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while(update && update !== first)

    if (!Object.is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newState;
    hook.baseQueue = null;
    queue.lastRenderedState = newState;
  }
  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}

// 非首次渲染 和 render阶段触发update造成的重复更新 都会调用该函数
// 用于下面注释的名词解释：
//    hook: 指 React.useState React.useEffect...
//    hook对象：指存储在fiber.memoizedState上的保存hook状态信息的对象
// 该函数返回当前hook对应的hook对象，具体做法是
// 由于hook对象的存储方式是： fiber.memoizedState: hook对象0 -(next)- hook对象1 -- hook对象2
// 每次调用，指针都会向后，只要hook调用顺序不变，就能拿到属于该hook的hook对象
// fiber.memoizedState可能来自2个地方：
// 
function updateWorkInProgressHook() {
  let nextCurrentHook;
  if (!currentHook) {
    // 这次updateComponent进入的第一个renderWithHooks会进入这个逻辑
    let current = currentlyRenderingFiber.alternate;
    if (current) {
      nextCurrentHook = current.memoizedState;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook;
  if (!workInProgressHook) {
    // 这次updateComponent进入的第一个renderWithHooks会进入这个逻辑
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    // 只遇到过 workInProgressHook.next 值为null
    // workInProgressHook应该是从current复制过来的
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook) {
    // 还没有进过这个逻辑
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = nextWorkInProgressHook.next;
    currentHook = nextCurrentHook;
  } else {
    if (!nextCurrentHook) {
      console.error('比上一次render调用了更多的hook');
    }
    // 从 current hook复制来
    // 即使是同一个FunctionComponent中多个useState，也是进入这个逻辑，workInProgressHook由currentHook复制而来
    currentHook = nextCurrentHook;

    const newHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null
    };
    if (!workInProgressHook) {
      // 这是链表中第一个hook
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}

// 该函数useState返回的第二个参数，用于将update插入更新队列
// 第三个参数之所以叫action，是借鉴了redux中的概念
// 事实上useState就是useReducer的特殊情况
function dispatchAction(fiber, queue, action) {
  const currentTime = requestCurrentTimeForUpdate();
  var expirationTime = computeExpirationForFiber(currentTime, fiber);

  // 这个update和fiber.update是有区别的，可以理解为这是针对fiber的hook的update，相较于fiber update粒度更细
  // 他存在的原因是因为一个fiber代表一个FunctionComponent，而一个FunctionComponent上是可以有多个hook的
  const update = {
    action,
    expirationTime,
    // 用于特殊情况的优化
    // eagerReducer: null,
    // eagerState: null,
    next: null
  };

  const pending = queue.pending;
  // 将当前update append到 list 最后
  if (!pending) {
    // 这是第一个update，与自己形成环
    update.next = update;
  } else {
    // 否则插入list尾 这里的逻辑同 fiber.update
    // 调用同一个hook的更新方法多次会进入这个逻辑
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;
  
  // 对于首次渲染完后触发的dispatch，fiber还不存在alternate
  const alternate = fiber.alternate;

  if (fiber === currentlyRenderingFiber || (alternate && alternate === currentlyRenderingFiber)) {
    // 这种情况可能发生于：没有在useEffect中调用useState的更新方法（即当前这个函数），而是在函数组件体内直接调用了。
    // 可能会造成该组件无限循环渲染（类似于在ClassComponent render方法中 setState）
    console.warn('TODO 在render阶段发生的更新');
  } else {
    // 一条优化路径 不影响流程
    // if (!alternate) {
    //   const lastRenderedReducer = queue.lastRenderedReducer;
    //   if (lastRenderedReducer) {
    //     const currentState = queue.lastRenderedState;
    //     const eagerState = lastRenderedReducer(currentState, action);
    //     update.eagerReducer = lastRenderedReducer;
    //     update.eagerState = eagerState;
    //     if (Object.is(currentState, eagerState)) {
    //       // 当前后2个state相同时可以不进行调度
    //       return;
    //     }
    //   }
    // }

    // 注意fiber参数是mount时bind的currentlyRenderingFiber，即首次渲染时的workInProgress fiber
    // 一般调用当前方法时首屏渲染已经完成，fiber已经从workInProgress变为current
    DOMRenderer.scheduleUpdateOnFiber(fiber, expirationTime);
  }
}

// hook对象保存一个hook的状态信息
// 该函数将hook对象插入workInProgress 的 memoizedState 以构成链表
// 所以对于 FunctionComponent，fiber.memoizedState保存函数内部调用的所有hook状态的链表
function mountWorkInProgressHook() {
  // 注意每个hook（useState/useEffect/useRef...都会有个对应的hook对象）
  const hook = {
    // mount时的初始化state
    memoizedState: null,
    // mount时的初始化state
    baseState: null,
    baseQueue: null,
    queue: null,
    // 指向同一个FunctionComponent中下一个hook，构成链表
    next: null
  };
  if (!workInProgressHook) {
    // 这是list中第一个hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 将该hook append到list最后
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

function mountEffect(create, deps) {
  return mountEffectImpl(UpdateEffect | PassiveEffect, HookPassive, create, deps);
}

function updateEffect(create, deps) {
  return updateEffectImpl(UpdateEffect | PassiveEffect, HookPassive, create, deps);
}

function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  // 指向effect对象
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create,
    undefined,
    nextDeps
  );
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return false;
  }
  if (nextDeps.length !== prevDeps.length) {
    console.error('前后deps长度不一致');
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // deps相同，不需要为fiber增加effectTag
        pushEffect(hookEffectTag, create, destroy, nextDeps);
        return;
      }
    }
  }

  // 前后deps不同，增加effectTag
  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create,
    destroy,
    nextDeps
  );
}

const HooksDispatcherOnMount = {
  useState(initialState) {
    // 这部分代码在React中对应于mountState函数
    
    // 生成新hook并插入WorkInProgress memoizedState最后
    // 同一个FunctionComponent内多个useState就会多次调用，生成 hook list
    const hook = mountWorkInProgressHook();

    // 设置该hook的初始值
    if (typeof initialState === 'function') {
      initialState = initialState();
    }
    hook.memoizedState = hook.baseState = initialState;
    const queue = hook.queue = {
      pending: null,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: initialState
    }
    const dispatch = queue.dispatch = dispatchAction.bind(null, currentlyRenderingFiber, queue);
    return [hook.memoizedState, dispatch];
  },
  useEffect: mountEffect
}

const HooksDispatcherOnUpdate = {
  useState: updateState,
  useEffect: updateEffect
}

export function renderWithHooks(current, workInProgress, Component, props, nextRenderExpirationTime) {
  renderExpirationTime = nextRenderExpirationTime;
  currentlyRenderingFiber = workInProgress;
  // 重置
  // workInProgress.memoizedState会在updateWorkInProgressHook中赋值
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  // 通过 current区分是否是首次渲染，对应不同hook
  ReactCurrentDispatcher.current = current && current.memoizedState ? HooksDispatcherOnUpdate : HooksDispatcherOnMount;

  const children = Component(props);  
  // 重置hook相关全局变量
  // 这里重置的目的是：
  // 调用renderWithHooks的时机是在update某个Component对应fiber时，这个函数调用是同步的
  // 下面几个全局变量会在函数调用过程中指向当前fiber内
  // 方便在该模块下不同方法内共享变量
  // 此时重置他代表这个fiber已经处理完了，所以这些全局变量不能再指向该fiber内部
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;

  return children;
}

export function bailoutHooks(current, workInProgress, expirationTime) {
  workInProgress.updateQueue = current.updateQueue;
  // 对于没有任务需要处理的fiber，去掉effect
  workInProgress.effectTag &= ~(PassiveEffect | UpdateEffect);

  if (current.expirationTime <= expirationTime) {
    current.expirationTime = NoWork;
  }
}