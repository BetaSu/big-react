import {
	Fragment,
	LazyComponent,
	OffscreenComponent,
	SuspenseComponent
} from 'react-reconciler/src/workTags';
import { Props, ReactElement } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFiber';
import {
	FiberNode,
	createFiberFromFragment,
	createFiberFromOffscreen,
	createWorkInProgress,
	resolveLazyComponentTag
} from './fiber';
import { renderWithHooks } from './fiberHooks';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import {
	Ref,
	NoFlags,
	DidCapture,
	Placement,
	ChildDeletion
} from './fiberFlags';
import { resolveDefaultProps } from './fiberLazyComponent';
import { LazyComponent as LazyComponentType } from 'react/src/lazy';
import { jsx } from 'react/src/jsx';
import { OffscreenProps } from './fiberOffscreenComponent';

export const beginWork = (workInProgress: FiberNode, renderLanes: Lanes) => {
	if (__LOG__) {
		console.log('beginWork流程', workInProgress.type);
	}
	// 接下来processUpdate会消耗lanes
	workInProgress.lanes = NoLane;

	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(workInProgress, renderLanes);
		case HostComponent:
			return updateHostComponent(workInProgress, renderLanes);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(workInProgress, renderLanes);
		case Fragment:
			return updateFragment(workInProgress, renderLanes);
		case LazyComponent:
			return mountLazyComponent(workInProgress, renderLanes);
		case SuspenseComponent:
			return updateSuspenseComponent(workInProgress, renderLanes);
		case OffscreenComponent:
			return updateOffscreenComponent(workInProgress, renderLanes);
		default:
			console.error('beginWork未处理的情况');
			return null;
	}
};

function updateFragment(workInProgress: FiberNode, renderLanes: Lanes) {
	const nextChildren = workInProgress.pendingProps;
	reconcileChildren(workInProgress, nextChildren, renderLanes);
	return workInProgress.child;
}

function updateFunctionComponent(
	workInProgress: FiberNode,
	renderLanes: Lanes
) {
	const nextChildren = renderWithHooks(workInProgress, renderLanes);
	reconcileChildren(workInProgress, nextChildren, renderLanes);
	return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode, renderLanes: Lanes) {
	// 根据element创建fiberNode
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps.children;
	markRef(workInProgress.alternate, workInProgress);
	reconcileChildren(workInProgress, nextChildren, renderLanes);
	return workInProgress.child;
}

function updateHostRoot(workInProgress: FiberNode, renderLanes: Lanes) {
	const baseState = workInProgress.memoizedState;
	const updateQueue = workInProgress.updateQueue as UpdateQueue<ReactElement>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending, renderLanes);
	workInProgress.memoizedState = memoizedState;

	const nextChildren = workInProgress.memoizedState;
	reconcileChildren(workInProgress, nextChildren, renderLanes);
	return workInProgress.child;
}

function reconcileChildren(
	workInProgress: FiberNode,
	children: any,
	renderLanes: Lanes
) {
	const current = workInProgress.alternate;

	if (current !== null) {
		// update
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current.child,
			children,
			renderLanes
		);
	} else {
		// mount
		workInProgress.child = mountChildFibers(
			workInProgress,
			null,
			children,
			renderLanes
		);
	}
}

function markRef(current: FiberNode | null, workInProgress: FiberNode) {
	const ref = workInProgress.ref;

	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref !== ref)
	) {
		workInProgress.flags |= Ref;
	}
}

function mountLazyComponent(workInProgress: FiberNode, renderLanes: Lanes) {
	const elementType = workInProgress.type;

	const props = workInProgress.pendingProps;
	const lazyComponent: LazyComponentType<any, any> = elementType;
	const payload = lazyComponent._payload;
	const init = lazyComponent._init;

	const Component = init(payload);
	// 能到这里说明异步结束了
	workInProgress.type = Component;
	const resolvedTag = (workInProgress.tag = resolveLazyComponentTag(Component));
	workInProgress.pendingProps = resolveDefaultProps(Component, props);
	switch (resolvedTag) {
		case FunctionComponent:
			return updateFunctionComponent(workInProgress, renderLanes);
		default:
			return null;
	}
}

function updateSuspenseComponent(
	workInProgress: FiberNode,
	renderLanes: Lanes
) {
	const current = workInProgress.alternate;
	const nextProps = workInProgress.pendingProps;

	let showFallback = false;
	const didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;

	if (didSuspend) {
		showFallback = true;
		workInProgress.flags &= ~DidCapture;
	}
	const nextPrimaryChildren = nextProps.children;
	const nextFallbackChildren = nextProps.fallback;

	// 源码中会用Offline去保存状态
	if (current === null) {
		if (showFallback) {
			const fallbackFragment = mountSuspenseFallbackChildren(
				workInProgress,
				nextPrimaryChildren,
				nextFallbackChildren,
				renderLanes
			);
			return fallbackFragment;
		} else {
			return mountSuspensePrimaryChildren(
				workInProgress,
				nextPrimaryChildren,
				renderLanes
			);
		}
	} else {
		if (showFallback) {
			const fallbackChildFragment = updateSuspenseFallbackChildren(
				workInProgress,
				nextPrimaryChildren,
				nextFallbackChildren,
				renderLanes
			);
			return fallbackChildFragment;
		} else {
			return updateSuspensePrimaryChildren(
				workInProgress,
				nextPrimaryChildren,
				renderLanes
			);
		}
	}
}

function mountSuspenseFallbackChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	fallbackChildren: any,
	renderLanes: Lanes
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = mountWorkInProgressOffscreenFiber(
		primaryChildProps,
		NoLanes
	);
	const fallbackFragment = createFiberFromFragment(
		fallbackChildren,
		renderLanes,
		null
	);
	primaryChildFragment.return = fallbackFragment.return = workInProgress;
	primaryChildFragment.sibling = fallbackFragment;
	workInProgress.child = primaryChildFragment;
	return fallbackFragment;
}

function mountSuspensePrimaryChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	renderLanes: Lanes
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};
	const primaryChildFragment = mountWorkInProgressOffscreenFiber(
		primaryChildProps,
		renderLanes
	);
	primaryChildFragment.return = workInProgress;
	workInProgress.child = primaryChildFragment;
	return primaryChildFragment;
}
function updateSuspenseFallbackChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	fallbackChildren: any,
	renderLanes: Lanes
) {
	const current = workInProgress.alternate!;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = updateWorkInProgressOffscreenFiber(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	let fallbackChildFragment!: FiberNode;
	if (currentFallbackChildFragment !== null) {
		fallbackChildFragment = createWorkInProgress(
			currentFallbackChildFragment,
			fallbackChildren
		);
	} else {
		fallbackChildFragment = createFiberFromFragment(
			fallbackChildren,
			renderLanes,
			null
		);
		fallbackChildFragment.flags |= Placement;
	}

	workInProgress.deletions = null;
	workInProgress.flags &= ~ChildDeletion;

	fallbackChildFragment.return = workInProgress;
	primaryChildFragment.return = workInProgress;
	primaryChildFragment.sibling = fallbackChildFragment;
	workInProgress.child = primaryChildFragment;

	return fallbackChildFragment;
}

function updateSuspensePrimaryChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	renderLanes: Lanes
) {
	const current = workInProgress.alternate!;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment = currentPrimaryChildFragment.sibling;

	const primaryChildFragment = updateWorkInProgressOffscreenFiber(
		currentPrimaryChildFragment,
		{
			mode: 'visible',
			children: primaryChildren
		}
	);

	primaryChildFragment.return = workInProgress;
	primaryChildFragment.sibling = null;

	if (currentFallbackChildFragment !== null) {
		const deletions = workInProgress.deletions;
		if (deletions === null) {
			workInProgress.deletions = [currentFallbackChildFragment];
			workInProgress.flags |= ChildDeletion;
		} else {
			deletions.push(currentFallbackChildFragment);
		}
	}

	workInProgress.child = primaryChildFragment;
	return primaryChildFragment;
}

function mountWorkInProgressOffscreenFiber(
	offscreenProps: OffscreenProps,
	renderLanes: Lanes
) {
	return createFiberFromOffscreen(offscreenProps, renderLanes, null);
}

function updateWorkInProgressOffscreenFiber(
	current: FiberNode,
	offscreenProps: OffscreenProps
) {
	return createWorkInProgress(current, offscreenProps);
}

function updateOffscreenComponent(
	workInProgress: FiberNode,
	renderLanes: Lanes
) {
	// debugger;
	const nextProps: OffscreenProps = workInProgress.pendingProps;
	const nextChildren = nextProps.children;
	if (nextProps.mode === 'hidden') {
		return null;
	} else {
		reconcileChildren(workInProgress, nextChildren, renderLanes);
		return workInProgress.child;
	}
}
