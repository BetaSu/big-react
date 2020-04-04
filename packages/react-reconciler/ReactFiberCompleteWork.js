
// 已经为children创建对应fiber，递归子节点为HostFiber创建对应DOM节点
export function appendAllChildren(parent, workInProgress) {
  
}

export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
      const fiberRoot = workInProgress.stateNode;
      console.log('complete host root');
      return null;
    case HostComponent:
      const type = workInProgress.type;
      if (current && workInProgress.stateNode) {
        // current存在代表不是首次render的fiber
      }
      if (!newProps) {
        console.warn('error happen');
        return null;
      }
      // 创建对应DOM节点
      let instance = createInstance(type, newProps);
      appendAllChildren(instance, workInProgress);
    default:
      break;
  }
}