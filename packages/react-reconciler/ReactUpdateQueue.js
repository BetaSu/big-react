export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

export function createUpdate(expirationTime) {
  return {
    expirationTime,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null,
    nextEffect: null,
  };
}

export function initializeUpdateQueue(fiber) {
  fiber.updateQueue = {
    baseState: fiber.memoizedState,
    baseQueue: null,
    shared: {
      pending: null
    },
    effects: null
  };
}

// 为 workInProgress 复制一份 updateQueue
export function cloneUpdateQueue(current, workInProgress) {
  const currentQueue = current.updateQueue;
  const workInProgressQueue = workInProgress.updateQueue;
  if (currentQueue === workInProgressQueue) {
    workInProgress.updateQueue = {
      baseState: currentQueue.baseState,
      baseQueue: currentQueue.baseQueue,
      shared: currentQueue.shared,
      effects: currentQueue.effects
    }
  }
}

// 将update插入单向环状链表
// 插入 u0 形成 u0 - u0  当前pending: uo
// 插入 u1 形成 u1 - u0 - u1  当前pending: u1
// 插入 u2 形成 u2 - u0 - u1 - u2  当前pending: u2
// 插入 u3 形成 u3 - u0 - u1 - u2 -u3  当前pending: u3
// 故 shared.pending 为 lastPendingUpdate
// shared.pending.next 为 firstPendingUpdate
export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  if (!updateQueue) {
    // fiber已经unmount
    return;
  }

  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  // 使新插入的update始终位于单向环状链表首位
  if (!pending) {
    // 这是第一个update，使他形成单向环状链表
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}

//
export function getStateFromUpdate(workInProgress, queue, update, prevState, nextProps) {
  switch (update.tag) {
    case UpdateState:
      const payload = update.payload;
      if (!payload) return prevState;
      return Object.assign({}, prevState, payload);

    default:
      break;
  }
}

// 通过遍历update链表，根据fiber.tag不同，通过不同的路径计算新的state
export function processUpdateQueue(workInProgress, nextProps) {
  const queue = workInProgress.updateQueue;
  // base update 为 单向非环链表
  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;

  // 如果有 pendingUpdate，需要将 pendingUpdate单向环状链表剪开并拼在baseUpdate单向链表后面
  let pendingQueue = queue.shared.pending;
  if (pendingQueue) {
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = pendingQueue.next;
    // 将环剪开
    lastPendingUpdate.next = null;

    // 将pendingUpdate拼入baseUpdate
    if (!lastBaseUpdate) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;

    const current = workInProgress.alternate;
    // 存在current 更新其updateQueue
    if (current) {
      const currentQueue = current.updateQueue;
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
      if (lastBaseUpdate !== currentLastBaseUpdate) {
        if (!currentLastBaseUpdate) {
          currentQueue.firstBaseUpdate = firstPendingUpdate;
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate;
        }
        current.lastBaseUpdate = lastPendingUpdate;
      }
    }
  }

  if (firstBaseUpdate) {
    // 存在update时遍历链表，计算出update后的值

    let newState = queue.baseState;
    let update = firstBaseUpdate;
    do {
      // 需要考虑优先级，还未处理
      newState = getStateFromUpdate(workInProgress, queue, update, newState, nextProps);
      update = update.next;
      if (!update) {
        console.log('update to state 过程中可能产生新pendingUpdate，还未处理', queue.shared.pending)
        break;
      }
    } while(true)
    queue.baseState = newState;
    queue.firstBaseUpdate = null;
    queue.lastBaseUpdate = null;
    workInProgress.memoizedState = newState;
  }
}