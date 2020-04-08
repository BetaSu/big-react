import ReactSharedInternals from 'shared/ReactSharedInternals';

const {ReactCurrentDispatcher} = ReactSharedInternals;

// hook以单向链表的形式存储在fiber.memoizedState中
// currentHook属于current fiber
// workInProgressHook会被插入到workInprogress fiber
let currentHook;
let workInProgressHook;
// 指向workInProgress
let currentlyRenderingFiber;

function dispatchAction(fiber, queue, action) {
  console.log('还未实现 更新流程');
}

// 将hook插入workInProgress 的 memoizedState
function mountWorkInProgressHook() {
  const hook = {
    // mount时的初始化state
    memoizedState: null,
    // mount时的初始化state
    baseState: null,
    baseQueue: null,
    queue: null,
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

const HooksDispatcherOnMount = {
  useState(initialState) {
    // 这部分代码在React中存在于mountState
    // 生成新hook并插入WorkInProgress memoizedState最后
    const hook = mountWorkInProgressHook();
    if (typeof initialState === 'function') {
      initialState = initialState();
    }
    hook.memoizedState = hook.baseState = initialState;
    return [hook.memoizedState, dispatchAction];
  }
}

export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress;
  // 重置
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  // 通过 current区分当前dispatcher
  // ReactCurrentDispatcher.current = !current || !current.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;

  const children = Component(props);  

  return children;
}