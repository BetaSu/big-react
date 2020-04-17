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
import {
  HostText
} from 'shared/ReactWorkTags';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

// 对于协调单一节点过程中，创建的workInProgress需要去掉他的sibling指向
function useFiber(fiber, pendingProps) {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.sibling = null;
  clone.index = 0;
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

  function updateTextNode(returnFiber, current, textContent) {
    if (!current || current.tag !== HostText) {
      // 插入
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    }
    // 更新
    const existing = useFiber(current, textContent);
    existing.return = returnFiber;
    return existing;
  }

  function updateElement(returnFiber, current, element) {
    if (current) {
      // 更新
      if (current.elementType === element.type) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    // 插入
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(returnFiber, oldFiber, newChild) {
    // 如果key相同则更新fiber，否则返回null
    const key = oldFiber ? oldFiber.key : null;

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // 文本节点没有key，如果之前的节点有key，代表之前不是文本节点而当前是，可以直接返回
      if (key !== null) {
        return null;
      }
      return updateTextNode(returnFiber, oldFiber, '' + newChild);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
        if (newChild.key === key) {
          // key相同，如果type不同会创建新fiber，不复用
          return updateElement(returnFiber, oldFiber, newChild);
        } else {
          // key不同的Component不复用
          return null;
        }
      } 
    }
    return null;
  }

  /** 
   * newFiber 更新的fiber
   * lastPlacedIndex 最后一个插入的节点索引？
   * newIndex 该fiber在新数组中的index
  */
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current) {
      
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // 移动新fiber
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
      } else {
        // 在原地
        return oldIndex;
      }
    } else {
      // 插入
      newFiber.effectTag = Placement;
      return lastPlacedIndex;
    }
  }

  // 将fiber保存为 key:(fiber.key，当key为null时为fiber.index)，value:fiber 的对象
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  // 通过map中保存的oldFiber和newChild比较，判断是否更新oldFiber或创建新节点
  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // 文本节点没有key，只需要比较他们是否都是文本节点
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
        const matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
        return updateElement(returnFiber, matchedFiber, newChild);
      }
    }

    return null;
  }

  // diff算法会进行4轮遍历，可能中间有中断，时间复杂度O(n)
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    console.log('reconcileChildrenArray');
    // 由于fiber没有保存before引用，所以无法通过头尾双指针的方式优化diff算法

    // diff完成后新的第一个child
    let resultingFirstChild = null;
    let previousNewFiber = null;
    // 最后一个插入的newChild的索引
    let lastPlacedIndex = 0;
    // 遍历newChildren的索引
    // 虽然都和lastPlacedIndex一样从0开始，但是中间有null节点会造成 newIdx > lastPlacedIndex
    let newIdx = 0;
    // 遍历过程中用于比较的老fiber
    let oldFiber = currentFirstChild;
    let nextOldFiber = null;

    // 第一轮遍历，对比oldFiber与newChildren[i]寻找可以复用的fiber，可复用条件：
    // 1. 新旧节点都为文本节点，直接复用（文本节点没有key）
    // 2. 其他类型节点判断key是否相同决定复用（可能key相同但是类型不同）
    // 这次遍历要求新旧fiber key相同，顺序相同，如果遇到不满足的则跳出这次遍历
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        // fiber.index 始终等于该fiber在数组中的索引，即使其前一个兄弟节点是null
        // ex： [null, a] ， 其中 a.index === 1
        // 上次的索引大于这次，代表上次这个节点之前的兄弟节点有null  ex： [null, a] 
        // 假设这次是 [b, a] ，则实际上 diff的是 null -> b   a -> a
        // 所以这里这么赋值
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      // key相同则更新fiber
      //   更新包括 复用fiber或者创建新fiber
      // key不同则返回null，代表该节点不能复用

      // 设想如果没有key，那么对应
      const newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx]
      )
      if (newFiber === null) {
        // 该索引对应位置的新节点是 null
        if (!oldFiber) {
          oldFiber = nextOldFiber;
        }
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && !newFiber.alternate) {
          // oldFiber与newFiber都存在代表对应索引key没变化
          // !newFiber.alternate代表newFiber是新创建的fiber
          //   ex：oldFiber: <div key="1"></div> newFiber: <p key="1"></p>
          //   新旧fiber key相同，则newFiber存在，但是type不同，所以是创建新fiber，没有对应alternate
          // 插入新DOM节点的同时删掉老的DOM节点
          deleteChild(returnFiber, oldFiber);
        }
      }
      // 将可复用的新fiber插入，返回插入的索引
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

      if (!previousNewFiber) {
        // 这是第一个插入的新fiber
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    // 第二轮遍历
    if (newIdx === newChildren.length) {
      // 当newChildren遍历完时，代表第一轮所有新节点都可复用，
      // 只需要删除剩下的oldFiber，因为这部分oldFiber在新的数组里已经不存在了
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }
    // 第三轮遍历
    if (!oldFiber) {
      // 当oldFiber遍历完时，代表所有oldFiber已经复用完或者这是首次渲染没有oldFiber
      // 再遍历newChildren，把新节点append到后面，这部分在oldFiber中不存在的节点是新加入的
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (!newFiber) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    // 第四轮遍历
    // 将可复用的节点移动位置
    // 将所有未遍历的oldFiber存入map，这样在接下来的遍历中能O(1)的复杂度就能通过key找到对应的oldFiber
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx]
      );
      if (newFiber) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate) {
            // 存在current，代表我们需要复用这个节点，将对应oldFiber从map中删除
            // 这样该oldFiber就不会置为删除
            existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (!previousNewFiber) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    if (shouldTrackSideEffects) {
      // 还留下的oldFiber表示没有被复用，需要删除
      existingChildren.forEach(child => deleteChild(returnFiber, child));
    }
    return resultingFirstChild;
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

