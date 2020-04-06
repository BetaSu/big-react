import {
  Placement,
  Deletion,
  Update,
  PlacementAndUpdate
} from 'shared/ReactSideEffectTags';
import {
  HostRoot,
  HostComponent
} from 'shared/ReactWorkTags';

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

function getHostSibling(fiber) {
  let node = fiber;
  // sutodo
  sibling: while(true) {
    
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
  const before = getHostSibling(finishedWork);
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
    return null;
  }
}
