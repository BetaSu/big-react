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

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  if (!updateQueue) {
    // fiber已经unmount
    return;
  }

  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  // 使新插入的update始终位于cycle list首位
  if (!pending) {
    // 这是第一个update，使他形成cycle list
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}
