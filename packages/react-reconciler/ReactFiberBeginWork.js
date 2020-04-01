// beginWork 为render阶段的主要工作之一
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