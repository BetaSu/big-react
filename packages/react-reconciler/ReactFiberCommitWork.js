import {
  Placement,
  Deletion,
  Update,
  PlacementAndUpdate
} from 'shared/ReactSideEffectTags';
import {
  HostRoot,
  HostText,
  HostComponent
} from 'shared/ReactWorkTags';
import {
  insertBefore,
  appendChild,
  commitUpdate,
  removeChild
} from 'reactDOM/ReactHostConfig';

function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while(parent) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

function isHostParent(parent) {
  return (
    parent.tag === HostRoot ||
    parent.tag === HostComponent
  ) 
}

// 目标DOM需要插入在哪个DOM之前（DOMElement.insertBefore）
function getHostSibling(fiber) {
  let node = fiber;

  // 嵌套循环的原因是 fiber节点可能没有对应DOM节点，相应的fiber树层级和DOM树也不一定匹配
  siblings: while(true) {
    while (!node.sibling) {
      // 考虑 fiber.return 是 FunctionComponent，fiber.return.sibling 是 HostCompoennt
      // 则 fiber.stateNode 和 fiber.return.sibling.stateNode在DOM树上是兄弟关系
      if (!node.return || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;

    // 当前节点不是Host节点，目标节点不能直接插在当前节点之前
    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.effectTag & Placement) {
        // 如果当前节点也是需要执行插入操作，再进行一次整个流程
        continue siblings;
      }
      // 节点不是Host节点，但是他的子节点如果是Host节点，则目标DOM和子节点DOM是兄弟节点
      // 目标DOM应该插入在子节点DOM前面
      // 如果节点没有子节点，则继续寻找兄弟节点
      if (!node.child) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // 到这一步时一定是一个Host节点，判断下该节点是否也是需要插入的节点
    if (!(node.effectTag & Placement)) {
      return node.stateNode;
    }
  }
}

function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork);
  const parentStateNode = parentFiber.stateNode;

  let parent;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      break;
  }
  // 目标DOM节点需要插入在谁之前
  const before = getHostSibling(finishedWork);
  insertOrAppendPlacementNode(finishedWork, before, parent);
}

function commitWork(current, finishedWork) {
  switch (finishedWork.tag) {
    case HostComponent:
      // 处理组件completeWork产生的updateQueue
      const instance = finishedWork.stateNode;
      if (instance) {
        const updatePayload = finishedWork.updateQueue;
        finishedWork.updatePayload = null;
        if (updatePayload) {
          commitUpdate(instance, updatePayload);
        }
      }
      return;
  }
}

function commitUnmount(finishedRoot, current) {
  // TODO 触发 componentWillUnmout 清除ref等操作
}

function commitNestedUnmounts(finishedRoot, root) {
  // 整体采用深度优先遍历 树结构
  let node = root;
  while (true) {
    commitUnmount(finishedRoot, node);

    if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === root) {
      return;
    }

    while (!node.sibling) {
      if (!node.return || node.return === root) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function unmountHostComponents(finishedRoot, current) {
  // 当前节点可能是FunctionComponent，或者ClassComponent之类
  // 即当前节点可能没有对应的DOM节点
  // 所以有可能需要child、child.sibling遍历
  // 所以这是个循环的过程
  let node = current;
  // 当找到要删除节点的父级DOM节点，该变量置为true，这样当遍历到zi节点时不会再执行寻找父级DOM节点的操作
  let currentParentIsValid = false;

  let currentParent;
  
  while (true) {
    // 这个循环到目的是找到要删除的目标节点的父级DOM节点
    if (!currentParentIsValid) {
      let parent = node.return;
      findParent: while (true) {
        const parentStateNode = parent.stateNode;
        switch (parent.tag) {
          case HostComponent:
            currentParent = parentStateNode;
            break findParent;
          case HostRoot:
            currentParent = parentStateNode.containerInfo;
            break findParent;
        }
        parent = parent.return;
      }
      currentParentIsValid = true;
    }

    if (node.tag === HostComponent || node.tag === HostText) {
      // 我们需要遍历下去每个节点，直到叶子节点，从叶子节点触发 componentWillUnmount，再一直往上到当前节点
      commitNestedUnmounts(finishedRoot, node);
      
      // 子节点已经遍历完，可以安全的删除当前节点了
      removeChild(currentParent, node.stateNode);
    } else {
      // 同commitNestedUnmounts一样的深度优先遍历
      commitUnmount(finishedRoot, node);

      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === current) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === current) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

}

function commitDeletion(finishedRoot, current) {
  unmountHostComponents(finishedRoot, current);
}

function insertOrAppendPlacementNode(fiber, before, parent) {
  const {tag} = fiber;
  if (tag === HostComponent || tag === HostText) {
    const stateNode = fiber.stateNode;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    // 当前fiber不是host类型，递归其子fiber
    const child = fiber.child;
    if (child) {
      insertOrAppendPlacementNode(child, before, parent);
      // 对于ClassComponent FunctionComponent 可能返回一个数组，即有多个需要插入的节点
      // 所以还需要遍历其兄弟节点执行插入
      const sibling = child.sibling;
      while (sibling) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

// commit阶段的第一项工作（before mutation）
// 调用ClassComponent getSnapshotBeforeUpdate生命周期钩子
export function commitBeforeMutationEffects(nextEffect) {
  while(nextEffect) {
    // TODO getSnapshotBeforeUpdate生命周期钩子
    // 假装已经处理完
    return nextEffect = null;
  }
}

// 处理DOM增删查改
export function commitMutationEffects(root, nextEffect) {
  console.log('commitMutationEffects');
  while (nextEffect) {
    const effectTag = nextEffect.effectTag;
    // 处理 Placement / Update / Deletion，排除其他effectTag干扰
    const primaryEffectTag = effectTag & (Placement | Deletion | Update);
    switch (primaryEffectTag) {
      case Placement:
        commitPlacement(nextEffect);
        // 去掉已使用的effectTag
        nextEffect.effectTag &= ~Placement;
        break;
      case Update:
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      case Deletion:
        commitDeletion(root, nextEffect);
        break;
      case PlacementAndUpdate:
        break;
    }
    nextEffect = nextEffect.nextEffect;
  }
  return null;
}