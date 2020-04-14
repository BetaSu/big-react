// 协调子fiber的过程
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress
} from './ReactFiber';
import {
  Placement,
  Deletion
} from 'shared/ReactSideEffectTags';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

// 对于协调单一节点过程中，创建的workInProgress需要去掉他的sibling指向
function useFiber(fiber, pendingProps) {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.sibling = null;
  return clone;
}

export function cloneChildFibers(current, workInProgress) {
  const currentChild = workInProgress.child;
  if (!currentChild) return;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;
  newChild.return = workInProgress;

  while (currentChild.sibling) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps);
    newChild.return = workInProgress;
  }
  newChild.sibling = null;
}

// 为了在2个方法中复用一批共用方法
// shouldTrackSideEffects标示是否标记fiber的effectTag
// 对于首次渲染，不需要标记effectTag，因为completeWork时会appendAllChildren，最后一次渲染整棵树
// 对于单次更新，需要标记更新fiber的effectTag
function ChildReconciler(shouldTrackSideEffects) {

  function createChild(returnFiber, newChild) {
    if (typeof newChild === 'number' || typeof newChild === 'string') {
      const created = createFiberFromText(newChild);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === 'object' && newChild !== null) {
      if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
        const created = createFiberFromElement(newChild);
        created.return = returnFiber;
        return created;
      }
    }
    return null;
  }

  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      return;
    }
    // Deletion插入在末尾 ？
    const last = returnFiber.lastEffect;
    if (last) {
      last.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
    childToDelete.nextEffect = null;
    childToDelete.effectTag = Deletion;
  }

  // 将children置为删除
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) {
      return;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }
  
  // 协调单一节点的子fiber 创建fiber
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    let child = currentFirstChild;
    while (child) {
      // 非首次渲染
      // TODO key diff
      if (child.type === element.type) {
        // child type未改变，当前节点需要保留
        // 父级下应该只有这一个子节点，将该子节点的兄弟节点删除
        deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
        // 创建child的workInProgress
        const existing = useFiber(child, element.props);
        existing.return = returnFiber;
        return existing;
      } else {
        // 节点的type改变，同时是单一节点，需要将父fiber下所有child标记为删除
        // 重新走创建新workInProgress的流程
        deleteRemainingChildren(returnFiber, child);
        break;
      }
      child = child.sibling;
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }
  
  function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent) {
    // 省略更新过程
    const created = createFiberFromText(textContent);
    created.return = returnFiber;
    return created;
  }

  // 标志当前fiber需要在commit阶段插入DOM
  function placeSingleChild(fiber) {
    // alternate存在表示该fiber已经插入到DOM
    if (shouldTrackSideEffects && !fiber.alternate) {
      fiber.effectTag = Placement;
    }
    return fiber;
  }

  function reconcileChildrenArray(returnFiber, currentFirstChild, newChild) {
    // TODO array diff
    let prev;
    let first;
    for (let i = 0; i < newChild.length; i++) {
      const child = newChild[i];
      const newFiber = createChild(returnFiber, child);
      if (!newFiber) {
        continue;
      }
      placeSingleChild(newFiber);
      if (prev) {
        prev.sibling = newFiber;
      }
      if (!first) {
        first = newFiber;
      }
      prev = newFiber;
    }
    return first;
  }
  
  // 协调子节点，分为 mount 和 reconcile 2类
  // mount用于首次渲染，child没有对应fiber，直接生成fiber，mount不会改变fiber的effectTag，原因见 appendAllChildren
  // reconcile用于更新
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
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
        return placeSingleChild(reconcileSingleTextNode(
          returnFiber,
          currentFirstChild,
          newChild
        ))
      }
      // 在 beginWork update各类Component时并未处理HostText，这里处理多个HostText
      if (Array.isArray(newChild)) {
        return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild
        )
      }
    }
    // 兜底删除
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }
  return reconcileChildFibers;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

