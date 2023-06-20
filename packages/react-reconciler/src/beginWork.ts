import {
	Fragment,
	LazyComponent,
	SuspenseComponent
} from 'react-reconciler/src/workTags';
import { Props, ReactElement } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFiber';
import {
	FiberNode,
	createFiberFromFragment,
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
import { Ref, NoFlags, DidCapture } from './fiberFlags';
import { resolveDefaultProps } from './fiberLazyComponent';
import { LazyComponent as LazyComponentType } from 'react/src/lazy';

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

	if (current === null) {
		const nextPrimaryChildren = nextProps.children;
		const nextFallbackChildren = nextProps.fallback;

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
		const nextFallbackChildren = nextProps.fallback;
		const nextPrimaryChildren = nextProps.children;
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
	renderLanes: any
) {
	const progressedPrimaryFragment: FiberNode | null = workInProgress.child;

	let primaryChildFragment;
	let fallbackChildFragment;

	if (progressedPrimaryFragment !== null) {
		primaryChildFragment = progressedPrimaryFragment;
		primaryChildFragment.childLanes = NoLanes;
		primaryChildFragment.pendingProps = primaryChildren;

		fallbackChildFragment = createFiberFromFragment(
			fallbackChildren,
			renderLanes,
			null
		);
	} else {
		primaryChildFragment = createFiberFromFragment(
			primaryChildren,
			renderLanes,
			null
		);
		fallbackChildFragment = createFiberFromFragment(
			fallbackChildren,
			renderLanes,
			null
		);
	}

	primaryChildFragment.return = workInProgress;
	fallbackChildFragment.return = workInProgress;
	primaryChildFragment.sibling = fallbackChildFragment;
	workInProgress.child = primaryChildFragment;

	return fallbackChildFragment;
}
function updateSuspenseFallbackChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	fallbackChildren: any,
	renderLanes: any
) {
	const current = workInProgress.alternate!;
	const currentPrimaryChildFragment: FiberNode = current.child;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;
}

function mountSuspensePrimaryChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	renderLanes: Lanes
) {
	const primaryChildFragment = createFiberFromFragment(
		primaryChildren,
		renderLanes,
		null
	);
	primaryChildFragment.return = workInProgress;
	workInProgress.child = primaryChildFragment;
	return primaryChildFragment;
}
