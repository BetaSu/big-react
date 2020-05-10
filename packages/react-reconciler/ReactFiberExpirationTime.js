// 这里有篇文章介绍的不错 https://juejin.im/post/5d01f630e51d4555fc1acc8b
import * as Scheduler from 'scheduler';

export const NoWork = 0;
export const Never = 1;
export const Idle = 2;
// 最大的31 bit integer
export const Sync = 1073741823;
export const Batched = Sync - 1;

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = Batched - 1;

// 10ms内产生的update有同样的过期时间，这样可以把多个update在一次处理
// 越快过期的 expirationTime 越大
export function msToExpirationTime(ms) {
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}

export function expirationTimeToMs(expirationTime) {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
}

export const NORMAL_PRIORITY_EXPIRATION = 5000;
export const NORMAL_PRIORITY_BATCH_SIZE = 250;

// NORMAL_PRIORITY_BATCH_SIZE / UNIT_SIZE = 250 / 10 = 25
export function computeAsyncExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    NORMAL_PRIORITY_EXPIRATION,
    NORMAL_PRIORITY_BATCH_SIZE,
  );
}

// 一个步进值， 间隔在precision内的2个数字会得到同样的结果
// NORMAL_PRIORITY_BATCH_SIZE === 250
// HIGH_PRIORITY_BATCH_SIZE === 100
// 可见高优先级的任务步进更短，因为对更新的频率要求更高
function ceiling(num, precision) {
  return (((num / precision) | 0) + 1) * precision;
}

// 传入当前时间，和任务优先级相关，返回一个对应过期时间
function computeExpirationBucket(
  currentTime,
  expirationInMs,
  bucketSizeMs,
) {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE,
    )
  );
}

export const LOW_PRIORITY_EXPIRATION = 5000;
export const LOW_PRIORITY_BATCH_SIZE = 250;

export const HIGH_PRIORITY_EXPIRATION = 150;
export const HIGH_PRIORITY_BATCH_SIZE = 100;

export function computeUserBlockingExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE,
  );
}

// 从expirationTime中推断优先级
export function inferPriorityFromExpirationTime(currentTime, expirationTime) {
  if (expirationTime === Sync) {
    return Scheduler.ImmediatePriority;
  }
  if (expirationTime === Never || expirationTime === Idle) {
    return Scheduler.IdlePriority;
  }
  const msUntil =
    expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);
  if (msUntil <= 0) {
    return Scheduler.ImmediatePriority;
  }
  if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
    return Scheduler.UserBlockingPriority;
  }
  if (msUntil <= LOW_PRIORITY_EXPIRATION + LOW_PRIORITY_BATCH_SIZE) {
    return Scheduler.NormalPriority;
  }

  return Scheduler.IdlePriority;
}