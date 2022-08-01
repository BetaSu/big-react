import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import {
	getHighestPriorityLane,
	Lane,
	Lanes,
	markRootFinished,
	mergeLanes,
	NoLane,
	NoLanes,
	SyncLane
} from './fiberLanes';
import { scheduleMicrotask } from './hostConfig';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;
let workInProgressRootRenderLane: Lanes = NoLanes;

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	if (__LOG__) {
		console.log('开始schedule阶段', fiber, lane);
	}
	const root = markUpdateLaneFromFiberToRoot(fiber, lane);
	markRootUpdated(root, lane);

	if (root === null) {
		return;
	}
	ensureRootIsScheduled(root);
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function markUpdateLaneFromFiberToRoot(fiber: FiberNode, lane: Lane) {
	let node = fiber;
	let parent = node.return;

	node.lanes = mergeLanes(node.lanes, lane);
	const alternate = node.alternate;
	if (alternate) {
		alternate.lanes = mergeLanes(alternate.lanes, lane);
	}

	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);

	if (updateLane === NoLane) {
		return;
	}
	if (updateLane === SyncLane) {
		if (__LOG__) {
			console.log('在微任务中调度执行，优先级：', updateLane);
		}
		// 微任务中调度执行
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		scheduleMicrotask(flushSyncCallbacks);
	}
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);

	if (nextLane !== SyncLane) {
		ensureRootIsScheduled(root);
		return;
	}

	if (__LOG__) {
		console.log('开始render阶段', root);
	}
	// 初始化操作
	prepareFreshStack(root, lane);

	// render阶段具体操作
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.error('workLoop发生错误', e);
			workInProgress = null;
		}
	} while (true);

	if (workInProgress !== null) {
		console.error('render阶段结束时wip不为null');
	}

	workInProgressRootRenderLane = NoLane;
	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;

	// commit阶段操作
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) {
		return;
	}
	if (__LOG__) {
		console.log('开始commit阶段', finishedWork);
	}
	const lane = root.finishedLane;

	// 重置
	root.finishedWork = null;
	root.finishedLane = NoLane;

	markRootFinished(root, lane);

	if (lane === NoLane) {
		console.error('commit阶段finishedLane不应该是NoLane');
	}

	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// 有副作用要执行

		// 阶段1/3:beforeMutation

		// 阶段2/3:Mutation
		commitMutationEffects(finishedWork);

		// Fiber Tree切换
		root.current = finishedWork;

		// 阶段3:Layout
	} else {
		// Fiber Tree切换
		root.current = finishedWork;
	}
}

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	if (__LOG__) {
		console.log('render阶段初始化工作', root);
	}
	workInProgress = createWorkInProgress(root.current, {});
	workInProgressRootRenderLane = lane;
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber, workInProgressRootRenderLane);
	// 执行完beginWork后，pendingProps 变为 memoizedProps
	fiber.memoizedProps = fiber.pendingProps;
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		const next = completeWork(node);

		if (next !== null) {
			workInProgress = next;
			return;
		}

		const sibling = node.sibling;
		if (sibling) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
