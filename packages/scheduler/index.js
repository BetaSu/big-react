const maxSigned31BitInt = 0b111111111111111111111111111111;

// Scheduler的priority是Symbol类型
// react的priority是递增的整数
// 为了减少2种priority切换时的附加插头函数，我们统一使用react的priority
export const NoPriority = 90;
export const ImmediatePriority = 99;
export const UserBlockingPriority = 98;
export const NormalPriority = 97;
export const LowPriority = 96;
export const IdlePriority = 95;

const IMMEDIATE_PRIORITY_TIMEOUT = -1; 
const USER_BLOCKING_PRIORITY = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000; 
// 永远不会过期
const IDLE_PRIORITY = maxSigned31BitInt;

const timerQueue = [];
const taskQueue = [];

let taskIdCounter = 1;
let currentTask = null;
let currentPriorityLevel = NormalPriority;

// 执行workLoop阶段
let isPerformingWork = false;
// 是否有任务正在等待Message Event回调触发（即下一次macroTask）时执行
let isHostCallbackScheduled = false;
// 是否有任务正在等待到他的startTime
let isHostTimeoutScheduled = false;

let isMessageLoopRunning = false;
let scheduledHostCallback = null;
let taskTimeoutID = -1;

let deadline = 0;

// 为任务执行留下的冗余时间
let yieldInterval = 5;

export function now() {
  return performance.now();
}

function shouldYieldToHost() {
  return now() >= deadline;
}


// 在MacroTask中，MessageChannel优先级高于timer（setTimeout）
// 所以可以在下一次MacroTask中以最高优执行任务
const channel = new MessageChannel();
const port = channel.port2;

// 执行taskQueue中的task，如果还有task没执行完但没有时间了，就等待下次Message Event执行时再执行
channel.port1.onmessage = function performWorkUntilDeadline() {
  if (scheduledHostCallback !== null) {
    const currentTime = now();

    // 在 yieldInterval 时间间隔后 yield
    // 这意味着在 message event开始时我们总有5ms空余时间
    deadline = currentTime + yieldInterval;
    const hasTimeRemaining = true;

    try {
      // scheduledHostCallback 即 flushWork
      // 返回值为taskQueue中是否还有task
      const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);

      if (!hasMoreWork) {
        isMessageLoopRunning = false;
        scheduledHostCallback = false;
      } else {
        // 如果有更多任务，在当前任务结尾开启下一个 message event
        port.postMessage(null);
      }
    } catch(e) {
      // 任务报错，开启下一个 mesage event，并抛出错误
      port.postMessage(null);
      throw e;
    }
  } else {
    isMessageLoopRunning = false;
  }
};

function requestHostCallback(callback) {
  scheduledHostCallback = callback;

  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
}

function requestHostTimeout(callback, ms) {
  taskTimeoutID = setTimeout(function () {
    callback(now());
  }, ms)
}

function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

// 这是一个优先队列（小顶堆）的计时器
// 遍历timerQueue，找到startTime小于currentTime的task，将其加入taskQueue
// 当taskQueue空时，会递归执行setTimeout，时间为当前时间到最近一个timer的startTime
// 当taskQueue不为空时，执行高优task
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

// 在 performWorkUntilDeadline 中执行
function flushWork(hasTimeRemaining, initialTime) {
  isHostCallbackScheduled = false;

  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;

  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }

}

// 循环执行taskQueue中的task，直到时间用尽（5ms），或任务没到过期时间
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  // 每次从taskQueue获取task前都会advanceTimers看看有没有task到了startTime需要加入taskQueue
  currentTask = peek(taskQueue);

  // 循环taskQueue执行task，直到时间用尽（5ms），或任务没到过期时间
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
      // 当前task还未过期，且本次调度没有剩余时间，deadline === currentTime + yieldInterval(5ms)
      // 由于taskQueue是优先队列，currentTask未过期则其后所有task也未过期
      break;
    }
    // 即使未到task 过期时间，但是本次调度有剩余时间也会执行回调
    const callback = currentTask.callback;

    if (callback !== null) {
      // 将当前task callback清除，这样再进入workLoop该task会被pop
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = now();

      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
      } else {
        if (currentTask === peek(taskQueue)) {
          // 执行完任务后删除任务
          pop(taskQueue);
        }
      }

      advanceTimers(currentTime);
    } else {
      pop(taskQueue);
    }

    currentTask = peek(taskQueue);
  }

  // 函数返回值 代表： 是否taskQueue中还有task
  if (currentTask !== null) {
    // taskQueue中还有任务，但是未到过期时间且本次调度没有剩余时间
    return true;
  } else {
    // taskQueue已执行完清空，从timerQueue中取出task放入taskQueue
    const firstTimer = peek(timerQueue);

    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }

    return false;
  }
}

// 遍历timerQueue，将过期的timer取出加入taskQueue
function advanceTimers(currentTime) {
  let timer = peek(timerQueue);

  while (timer !== null) {
    if (timer.callback === null) {
      // 取消没有 callback 的 timer
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      pop(timerQueue);
      // sortIndex === startTime
      // expirationTime === startTime + timeout
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // 余下的timer都处于延迟状态
      return;
    }

    timer = peek(timerQueue);
  } 
}

// 小顶堆操作中的 insert
// 对于堆操作不熟悉可以看下这篇文章 https://spground.github.io/2017/07/07/Heap%20and%20Heap's%20Application-Heap%20Sort%20and%20Priority%20Queue/
function push(heap, node) {
  let index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

// 获取堆顶任务，即 sortIndex 或 id 最小的任务
function peek(heap) {
  let first = heap[0];
  return first === undefined ? null : first;
}

// 删除堆顶任务
function pop(heap) {
  const first = heap[0];
  if (first !== undefined) {
    const last = heap.pop();

    if (last !== first) {
      heap[0] = last;
      // 从上往下堆化
      siftDown(heap, last, 0);
    }

    return first;
  } else {
    return null;
  }
}

// 小顶堆向上堆化
function siftUp(heap, node, i) {
  let index = i;

  while (true) {
    // 位运算 无符号右移一位
    let parentIndex = index - 1 >>> 1;
    let parent = heap[parentIndex];

    if (parent !== undefined && compare(parent, node) > 0) {
      // parent 更大，交换位置
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}

// 小顶堆向下堆化
function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;

  while (index < length) {
    const leftIndex = 2 * index + 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // 如果左子节点或右子节点小于目标节点，则交换
    if (left !== undefined && compare(left, node) < 0) {
      if (right !== undefined && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (right !== undefined && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      return;
    }
  }
}

// 先比较sort index，再比较 task id
function compare(a, b) {
  let diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}

// 根据优先级计算过期时间
function timeoutForPriorityLevel(priorityLevel) {
  switch (priorityLevel) {
    case ImmediatePriority:
      return IMMEDIATE_PRIORITY_TIMEOUT;

    case UserBlockingPriority:
      return USER_BLOCKING_PRIORITY;

    case IdlePriority:
      return IDLE_PRIORITY;

    case LowPriority:
      return LOW_PRIORITY_TIMEOUT;

    case NormalPriority:
    default:
      return NORMAL_PRIORITY_TIMEOUT;
  }
}

// 替代 requestIdleCallback
export function scheduleCallback(priorityLevel, callback, options) {
  const currentTime = now();
  // 任务开始时间
  let startTime;
  // startTime + timeout = 任务过期时间
  let timeout;

  if (typeof options === 'object' && options !== null) {
    // 任务开始时间 = 当前时间 + 延迟的时间
    let delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
    timeout = typeof options.timeout === 'number' ? options.timeout : timeoutForPriorityLevel(priorityLevel);
  } else {
    timeout = timeoutForPriorityLevel(priorityLevel);
    startTime = currentTime;
  }

  const expirationTime = startTime + timeout;
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1
  };

  if (startTime > currentTime) {
    // 延迟的task

    // 当这是个延迟的task，需要被加入timerQueue
    // 由于timerQueue的目的是存储还未到startTime的task
    // 所以timerQueue内的task是以startTime排序
    newTask.sortIndex = startTime;
    // 将新任务保存在小顶堆中
    // 小顶堆按 sortIndex（如果相同则比较 id）排序
    // 所以堆顶任务为sortIndex最小（或id最小）任务
    push(timerQueue, newTask);

    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // 所有任务都延迟了，当前任务是优先级最高的
      if (isHostTimeoutScheduled) {
        // 取消已存在的timeout
        cancelHostTimeout();
      } else {
        // 注册timeout
        isHostTimeoutScheduled = true;
      }
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // 加入taskQueue的 task都是已经过了startTime，需要被执行的task
    // 所以以expirationTime作为排序依据
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }
  return newTask;
}

export function shouldYield() {
  const currentTime = now();
  advanceTimers(currentTime);
  const firstTask = peek(taskQueue);
  return firstTask !== currentTask &&
    currentTask !== null &&
    firstTask !== null && 
    firstTask.callback !== null && 
    firstTask.startTime <= currentTime && 
    firstTask.expirationTime < currentTask.expirationTime || shouldYieldToHost();
}

// 执行eventHandler，函数内部获取到的 currentPriorityLevel 为传入的priorityLevel
// 在 commitRoot、createUpdate、dispatchAction、computeExpirationForFiber、scheduleUpdateOnFiber 中都会用到 currentPriorityLevel
// React的时间切片，只是它更新的一种表现，实质上是由每个 fiber 的 expirationTime 所决定，
// 而 fiber 的 expirationTime 又来自 priorityLevel ，
// priorityLevel 则来自用户的UI操作，不同的事件，带来三种不同的priorityLevel，分别是如下3种：
// DiscreteEvent 离散事件. 例如blur、focus、 click、 submit、 touchStart. 这些事件都是离散触发的。
// UserBlockingEvent 用户阻塞事件. 例如touchMove、mouseMove、scroll、drag、dragOver等等。这些事件会'阻塞'用户的交互。
// ContinuousEvent 连续事件。例如load、error、loadStart、abort、animationEnd. 这个优先级最高，也就是说它们应该是立即同步执行的，这就是Continuous的意义，是持续地执行，不能被打断。
// SuspenseComponent，为某个 fiber 带来第四种priorityLevel——LowPriority。
// 用户代码出现问题，被catch住时，出现第五种priorityLevel——IdlePriority。
export function runWithPriority(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;

    default:
      priorityLevel = NormalPriority;
  }

  let previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}

export function getCurrentPriorityLevel() {
  return currentPriorityLevel;
}

export function cancelCallback(callbackNode) {
  if (cancelCallback !== fakeCallbackNode) {
    // callback为null的任务在advanceTimers或workLoop中会被pop掉
    // 不在queue中直接删掉该任务的原因是，小顶堆只能删除堆顶元素
    callbackNode.callback = null;
  }
}

// --------- 下面部分在React中存在于 SchedulerWithReactIntegration，用于对React使用的Scheduler方法包装一层
// 为了方便，我们直接在Scheduler中实现

const fakeCallbackNode = {};

// 存放未执行的立即执行任务
let syncQueue = null;
// 需要执行的立即执行任务
let immediateQueueCallbackNode = null;
let isFlushingSyncQueue = false;

export function scheduleSyncCallback(callback) {
  if (syncQueue === null) {
    syncQueue = [callback];
    immediateQueueCallbackNode = scheduleCallback(ImmediatePriority, flushSyncCallbackQueueImpl);
  } else {
    // 当syncQueue存在，不需要创建一个新schedule任务，因为在创建syncQueue时已经创建了一个schedule任务
    syncQueue.push(callback);
  }
  return fakeCallbackNode;
}

// 执行同步任务
export function flushSyncCallbackQueue() {
  if (immediateQueueCallbackNode !== null) {
    // 如果有正在schedule的立即执行任务还未执行，取消他的schedule，立即同步执行他
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}

function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    let i = 0;
    try {
      const isSync = true;
      const queue = syncQueue;
      runWithPriority(ImmediatePriority, () => {
        for (; i < queue.length; i++) {
          let callback = queue[i];
          do {
            callback = callback(isSync);
          } while (callback !== null)
        }
      })
      syncQueue = null;
    } catch(e) {
      // 如果某个任务报错，将他从queue中去除
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      scheduleCallback(ImmediatePriority, flushSyncCallbackQueue);
      throw e;
    } finally {
      isFlushingSyncQueue = false;
    }
  }
}