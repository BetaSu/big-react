import * as DOMRenderer from 'reactReconciler';
import {FiberNode} from 'reactReconciler/ReactFiber';
import {createUpdate, initializeUpdateQueue, enqueueUpdate} from 'reactReconciler/ReactUpdateQueue';
import { NoPriority } from 'scheduler';
import { NoWork } from 'reactReconciler/ReactFiberExpirationTime';

/** 
 * @description 创建 FiberRoot ，其中 FiberRoot.current === RootFiber ，RootFiber.stateNode === FiberRoot
*/
export default class ReactRoot {
  constructor(container) {
    // RootFiber tag === 3
    this.current = new FiberNode(3, null, null);
    // 初始化rootFiber的updateQueue
    initializeUpdateQueue(this.current);
    // RootFiber指向FiberRoot
    this.current.stateNode = this;
    // 应用挂载的根DOM节点
    this.containerInfo = container;
    // root下已经render完毕的fiber
    this.finishedWork = null;
    // 保存Scheduler保存的当前正在进行的异步任务
    this.callbackNode = null;
    // 保存Scheduler保存的当前正在进行的异步任务的优先级
    this.callbackPriority = NoPriority;
    // pending 指还没有commit的任务
    // 在 scheduleUpdateOnFiber--markUpdateTimeFromFiberToRoot中会更新这个值
    // 在 commitRoot--markRootFinishedAtTime中会更新这个值
    this.firstPendingTime = NoWork;
    // 如果在Scheduler执行workLoop中某一时刻时间片用尽，则会暂停workLoop
    // 这个变量记录过期未执行的fiber的expirationTime
    this.lastExpiredTime = NoWork;
    // render阶段完成的任务的expirationTime，
    // 在 performWork完成时会被赋值
    // 在 prepareFreshStack（任务开始）、commitRoot（任务结束）会被重置
    this.finishedExpirationTime = NoWork;
  }
  render(element) {
    const current = this.current;
    const currentTime = DOMRenderer.requestCurrentTimeForUpdate();
    const expirationTime = DOMRenderer.computeExpirationForFiber(currentTime, current);
    const update = createUpdate(expirationTime);
    // fiber.tag为HostRoot类型，payload为对应要渲染的ReactComponents
    update.payload = {element};
    enqueueUpdate(current, update);
    return DOMRenderer.scheduleUpdateOnFiber(current, expirationTime);
  }
}
