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


let didReceiveUpdate = false;

function updateHostRoot(current, workInProgress) {
  const updateQueue = workInProgress.updateQueue;

}

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