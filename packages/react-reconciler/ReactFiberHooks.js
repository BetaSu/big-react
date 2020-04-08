
// TODO hook相关
export function renderWithHooks(current, workInProgress, Component, props) {
  // 重置
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  const children = Component(props);  
  return children;
}