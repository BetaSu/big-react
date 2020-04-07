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
import {cloneUpdateQueue, processUpdateQueue} from './ReactUpdateQueue';
import {reconcileChildFibers, mountChildFibers} from './ReactChildFiber';
import {shouldSetTextContent} from 'reactDOM/ReactHostConfig';

let didReceiveUpdate = false;

// 应该存在于 ReactFiberHooks.js
function renderWithHooks(current, workInProgress, Component, props) {
  
}

function reconcileChildren(current, workInProgress, nextChildren) {
  // 首次渲染时只有root节点存在current，所以只有root会进入reconcile产生effectTag
  // 其他节点会appendAllChildren形成DOM树
  if (current) {
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  } else {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  }
}

// 更新HostRoot，
// 遍历update链表，更新state
// 生成child fiber
// 返回child fiber
function updateHostRoot(current, workInProgress) {
  const updateQueue = workInProgress.updateQueue;
  const nextProps = workInProgress.pendingProps;
  const prevState = current.memoizedState;
  const prevChildren = prevState ? prevState.element : null;

  cloneUpdateQueue(current, workInProgress);
  // 根据update链表更新state的操作只在HostRoot上有，存疑？
  processUpdateQueue(workInProgress, nextProps);

  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;

  if (prevChildren === nextChildren) {
    return console.log('prevChildren === nextChildren it is a bailout');
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function updateFunctionComponent(current, workInProgress, Component, nextProps) {
  let nextChildren = renderWithHooks(current, workInProgress, Component, nextProps);

  if (current && !didReceiveUpdate) {
    // 需要返回    
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function updateHostText(current, workInProgress) {
  
}

// 生成 child fiber
// 返回 child fiber
function updateHostComponent(current, workInProgress) {
  // DOM节点名
  const type = workInProgress.type;
  const prevProps = current ? current.memoizedProps : null;
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;

  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    // 当前fiber对应的DOM节点只有唯一一个文本子节点，这种情况比较常见，故针对其单独优化
    // 标记其nextChildren为空，省去了再生成一个HostText Fiber并遍历下去的过程
    // 该节点的child的处理在compleWork finalizeInitialChildren中
    nextChildren = null;
  }
  // 省去 之前isDirectTextChild 现在不是情况的 diff

  reconcileChildren(
    current,
    workInProgress,
    nextChildren
  )
  return workInProgress.child;
}

// render阶段开始处理fiber的入口
// 总体来说该函数会计算新state，返回child
export default function beginWork(current, workInProgress) {
  if (current) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;
  
    if (oldProps !== newProps) {
      didReceiveUpdate = true;
    }
  }

  switch (workInProgress.tag) {
    case HostRoot:  
      return updateHostRoot(current, workInProgress);
    case FunctionComponent:
      const Component = workInProgress.type;
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        workInProgress.pendingProps
      );
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
        return updateHostText(current, workInProgress);
    default:
      break;
  }
}