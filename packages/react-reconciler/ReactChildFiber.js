// 协调子fiber的过程
import {createFiberFromElement} from './ReactFiber';
import {Placement} from 'shared/ReactSideEffectTags';

// 标志当前fiber需要在commit阶段插入DOM
function placeSingleChild(fiber) {
  // alternate存在表示该fiber已经插入到DOM
  if (!fiber.alternate) {
    fiber.effectTag = Placement;
  }
  return fiber;
}

// 协调子fiber 
function reconcileSingleElement(returnFiber, currentFirstChild, element) {
  // key diff 算法待补充
  const created = createFiberFromElement(element);
  created.return = returnFiber;
  return created;
}

export function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
  const isObject = typeof newChild === 'object' && newChild !== null;
  if (isObject) {
    return placeSingleChild(reconcileSingleElement(
      returnFiber,
      currentFirstChild,
      newChild
    ))
  }
  console.log('未实现的协调分支逻辑');
}