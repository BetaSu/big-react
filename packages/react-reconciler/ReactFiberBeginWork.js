// beginWork 为render阶段的主要工作之一，主要做了如下事：
// 根据update更新 state
// 根据update更新 props
// 根据update更新 effectTag
import {
  FunctionComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText
} from 'shared/ReactWorkTags';
import {cloneUpdateQueue} from './ReactUpdateQueue';
import {reconcileChildFibers} from './ReactChildFiber';


let didReceiveUpdate = false;


function reconcileChildren(current, workInProgress, nextChildren) {
  workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
}

// 更新HostRoot，
// 遍历update链表，更新state，协调子节点，返回child
function updateHostRoot(current, workInProgress) {
  const updateQueue = workInProgress.updateQueue;
  const nextProps = workInProgress.pendingProps;
  const prevState = current.memoizedState;
  const prevChildren = prevState ? prevState.element : null;

  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps);

  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;

  if (prevChildren === nextChildren) {
    return console.log('prevChildren === nextChildren it is a bailout');
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// render阶段开始处理fiber的入口
// 总体来说该函数会计算新state，返回child
export default function beginWork(workInProgress) {
  const current = workInProgress.alternate;

  const oldProps = current.memoizedProps;
  const newProps = workInProgress.pendingProps;

  if (oldProps !== newProps) {
    didReceiveUpdate = true;
  }

  switch (workInProgress.tag) {
    case HostRoot:  
      return updateHostRoot(current, workInProgress);
    default:
      break;
  }
}