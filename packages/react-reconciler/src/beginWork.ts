import { Fragment } from 'react-reconciler/src/workTags';
import { ReactElement } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFiber';
import { FiberNode } from './fiber';
import { renderWithHooks } from './fiberHooks';
import { Lane, Lanes, NoLane } from './fiberLanes';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

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
	reconcileChildren(workInProgress, nextChildren, renderLanes);
	return workInProgress.child;
}

function updateHostRoot(workInProgress: FiberNode, renderLanes: Lanes) {
	const baseState = workInProgress.memoizedState;
	const updateQueue = workInProgress.updateQueue as UpdateQueue<Element>;
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
