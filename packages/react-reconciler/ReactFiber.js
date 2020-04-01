import {NoEffect} from 'shared/ReactSideEffectTags';
import { NoWork } from './ReactFiberExpirationTime';

export class FiberNode {
  constructor(tag, pendingProps, key, mode) {
    // 1 ClassComponent
    // 3 HostRoot
    // 5 HostComponent
    this.tag = tag;
    this.pendingProps = pendingProps;
    // prop key
    this.key = key;
    // 未使用
    this.mode = mode;

    // 对于FunctionComponent，指向 fn
    // 对于ClassComponent，指向 class
    // 对于HostComponent，为对应DOM节点的字符串
    // type

    // 指向父Fiber
    this.return = null;
    // 指向子Fiber
    this.child = null;
    // 指向兄弟Fiber
    this.sibling = null;

    this.ref = null;

    // 对于FunctionComponent，指向 fn()
    // 对于ClassComponent，指向 实例
    // 对于HostComponent，为对应DOM节点
    this.stateNode = null;
    this.effectTag = NoEffect;
    // fiber的过期时间
    this.expirationTime = null;
    // 指向前一次render的fiber
    this.alternate = null;

    // 以下3个变量组成了当前Fiber上保存的effect list
    this.firstEffect = null;
    this.lastEffect = null;
    this.nextEffect = null;
  }
}

// 为 current fiber 创建对应的 alternate fiber
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (!workInProgress) {
    workInProgress = new FiberNode(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.stateNode = current.stateNode;
    workInProgress.type = current.type;
    current.alternate = workInProgress;
    workInProgress.alternate = current;
  } else {
    workInProgress.pendingProps = pendingProps;

    // 已有alternate的情况重置effect
    workInProgress.effectTag = NoWork;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
    workInProgress.nextEffect = null;
  }
  workInProgress.expirationTime = current.expirationTime;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;

  return workInProgress;
}