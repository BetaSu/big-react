// 协调子fiber的过程
import {createFiberFromElement} from './ReactFiber';
import {Placement} from 'shared/ReactSideEffectTags';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

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
  // React.createElement类型 或者 子节点是String、Number对应的Array类型
  const isObject = typeof newChild === 'object' && newChild !== null;
  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return placeSingleChild(reconcileSingleElement(
          returnFiber,
          currentFirstChild,
          newChild
        ))
    }
    // 在 beginWork update各类Component时并未处理HostText，这里处理单个HostText
    if (typeof newChild === 'number' || typeof newChild === 'string') {

    }
    // 在 beginWork update各类Component时并未处理HostText，这里处理多个HostText
    if (Array.isArray(newChild)) {

    }
  }
  console.log('未实现的协调分支逻辑');
}