/** 
 * @description 主要是 reconcile 的过程
*/
import {renderer} from '../core/renderer';

/**
 * 基于DFS遍历虚拟DOM树，初始化vnode为fiber,并产出组件实例或DOM节点
 */
export const reconcileDFS = (fiber, deadline, ENOUGH_TIME) => {
  const topWork = fiber;
  outerLoop: while (fiber) {
    if (deadline.timeRemaining() <= ENOUGH_TIME) {
      break;
    }
    if (typeof fiber.type === 'function') {          
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }
    if (fiber.child) {
        fiber = fiber.child;
        continue outerLoop;
    }

    let f = fiber;
    while (f) {
      if (f === topWork) {
        return;
      }
      if (f.sibling) {
        fiber = f.sibling;
        continue outerLoop;
      }
      f = f.return;
    }
  }
}

export function updateFunctionComponent(fiber) {
  let { type, stateNode: instance, props } = fiber;
  if (instance == null) {
      fiber.parent = type === AnuPortal ? props.parent : containerStack[0];
      instance = createInstance(fiber, newContext);
  }
  
  instance._reactInternalFiber = fiber; //更新rIF
  
  if (fiber.parent && fiber.hasMounted && fiber.dirty) {
      fiber.parent.insertPoint = getInsertPoint(fiber);
  }
  if (isStateful) {

      delete fiber.dirty;
      fiber.effectTag *= HOOK;
  } else if (fiber.effectTag == 1){
      fiber.effectTag = WORKING;
  }
  fiber._hydrating = true;
  Renderer.currentOwner = instance;
  const rendered = instance.render.call(instance);
  diffChildren(fiber, rendered);
}