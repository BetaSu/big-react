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
  insertInContainerBefore,
  appendChildToContainer
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

  // 嵌套的循环的原因是 fiber节点可能没有对应DOM节点，相应的fiber树层级和DOM树也不一定匹配
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
  let isContainer = false;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
  }
  // 目标DOM节点需要插入在谁之前
  const before = getHostSibling(finishedWork);

  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
    console.log('里程碑！！~');
  } else {
    // TODO
  }
}

function insertOrAppendPlacementNodeIntoContainer(fiber, before, parent) {
  const {tag} = fiber;
  if (tag === HostComponent || tag === HostText) {
    const stateNode = fiber.stateNode;
    if (before) {
      insertInContainerBefore(parent, stateNode, before);
    } else {
      appendChildToContainer(parent, stateNode);
    }
  } else {
    // 当前fiber不是host类型，递归其子fiber
    const child = fiber.child;
    if (child) {
      insertOrAppendPlacementNodeIntoContainer(child, before, parent);
      // 对于ClassComponent FunctionComponent 可能返回一个数组，即有多个需要插入的节点
      // 所以还需要遍历其兄弟节点执行插入
      const sibling = child.sibling;
      while (sibling) {
        insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
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
        break;
      case Deletion:
        break;
      case PlacementAndUpdate:
        break;
    }
    nextEffect = nextEffect.nextEffect;
  }
  return null;
}
