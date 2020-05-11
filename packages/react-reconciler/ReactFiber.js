import {NoEffect} from 'shared/ReactSideEffectTags';
import { NoWork } from './ReactFiberExpirationTime';
import {
  IndeterminateComponent,
  HostText,
  HostComponent,
  ClassComponent
} from 'shared/ReactWorkTags';

// 判断是否是 ClassComponent
function shouldConstruct(Component) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}
export class FiberNode {
  constructor(tag, pendingProps, key) {
    // 1 ClassComponent
    // 3 HostRoot
    // 5 HostComponent
    this.tag = tag;
    // prop key
    this.key = key;
    // mode 标记当前fiber的模式 Sync/Blocking/Concurrent
    // Sync为旧的同步模式
    // Blocking为方便开发者从Sync过渡到Concurrent的非全功能异步模式
    // Concurrent为异步模式
    // 由于未来Concurrent会成为默认选项，我们只实现Concurrent，所以不需要这个参数
    // this.mode = mode;

    // type字段由React.createElement注入
    // 对于FunctionComponent，指向 fn
    // 对于ClassComponent，指向 class
    // 对于HostComponent，为对应DOM节点的字符串
    this.type = null;
    // 与type同步
    this.elementType = null;
    

    // 指向父Fiber
    this.return = null;
    // 指向子Fiber
    this.child = null;
    // 指向兄弟Fiber
    this.sibling = null;

    this.ref = null;

    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    // 存放update链表
    this.updateQueue = null;
    this.memoizedState = null;

    // 对于FunctionComponent，指向 fn()
    // 对于ClassComponent，指向 实例
    // 对于HostComponent，为对应DOM节点
    this.stateNode = null;
    this.effectTag = NoEffect;
    // fiber的过期时间
    this.expirationTime = NoWork;
    // 该fiber的子孙fiber中优先级最高的expirationTime
    // 有了这个变量就不用遍历当前fiber的子孙就能找到下一个任务的expirationTime
    this.childExpirationTime = NoWork;
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
      current.key
    );
    workInProgress.stateNode = current.stateNode;
    workInProgress.type = current.type;
    workInProgress.elementType = current.elementType;
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
  workInProgress.childExpirationTime = current.childExpirationTime;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;

  // 父级协调的过程中会被覆写
  workInProgress.sibling = current.sibling;
  // index同级多个节点，当前节点的索引
  // [null, a] [b, a] 2种情况 a的index都是1
  workInProgress.index = current.index;

  return workInProgress;
}

// type定义见FiberNode class
export function createFiberFromTypeAndProps(type, key, pendingProps, expirationTime) {
  let fiberTag = IndeterminateComponent;

  // FunctionComponent ClassComponent 类型都是 function
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent;
    }
  } else if (typeof type === 'string') {
    fiberTag = HostComponent;
  }
  const fiber = new FiberNode(fiberTag, pendingProps, key);
  fiber.type = type;
  fiber.elementType = type;
  fiber.expirationTime = expirationTime;
  return fiber;
}

export function createFiberFromElement(element, expirationTime) {
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    expirationTime
  );
  return fiber;
}

export function createFiberFromText(textContent, expirationTime) {
  const fiber = new FiberNode(HostText, textContent, null);
  fiber.expirationTime = expirationTime;
  return fiber;
}