import {
  HostComponent,
  HostRoot,
  HostText
} from 'shared/ReactWorkTags';
import {
  appendInitialChild,
  createInstance,
  createTextInstance,
  finalizeInitialChildren,
  diffProperties
} from 'reactDOM/ReactHostConfig';
import {
  Update
} from 'shared/ReactSideEffectTags';

function markUpdate(workInProgress) {
  workInProgress.effectTag |= Update;
}

function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps;

  if (oldProps === newProps) {
    return;
  }
  const instance = workInProgress.stateNode;
  // HostComponent单一文本节点会在这里加入updateQueue
  const updatePayload = diffProperties(instance, type, oldProps, newProps);
  // updateQueue的处理会在commitWork中进行
  workInProgress.updateQueue = updatePayload;

  if (updatePayload) {
    markUpdate(workInProgress);
  }
}

// 执行到当前函数之前已经为每个element创建对应的fiber，并且为每个host fiber创建对应的DOM节点
// 该函数会将fiber的所有子节点（chid,child.sibling...）append到fiber对应的DOM节点上（fiber.stateNode）
// 对于每一级HostComponent，该过程会递归上去，这样就能将分散在各自fiber中的DOM节点形成对应的DOM树
export function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (!node.sibling) {
      if (!node.return || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

// 为 beginWork阶段生成的fiber生成对应DOM，并产生DOM树
export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
      const fiberRoot = workInProgress.stateNode;
      return null;
    case HostComponent:
      const type = workInProgress.type;
      if (current && workInProgress.stateNode) {
        // 非首次渲染，已经存在对应current 和 stateNode
        updateHostComponent(current, workInProgress, type, newProps);
        return null;
      } 
      if (!newProps) {
        console.warn('error happen');
        return null;
      }
      // 创建对应DOM节点
      let instance = createInstance(type, newProps);
      // 因为current不存在，走到这里表示是首次渲染，不需要记录每一层的effect，层层更新
      // 只需要一次性把fiber树渲染到页面上
      // appendAllChildren用于将子DOM节点append到创建的DOM节点上（instance）
      // 这样当completeWork递归上去时DOM树其实是从底到顶一层层构建好的，commit阶段只需要把顶层root append到container即可
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      // 初始化props
      finalizeInitialChildren(instance, type, newProps);
      return null;
    case HostText:
      // TODO 更新流程
      const newText = newProps;
      workInProgress.stateNode = createTextInstance(newText);
      return null;
    default:
      break;
  }
}