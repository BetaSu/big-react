import { beginWork } from './beginWork';
import {
	commitHookEffectListDestroy,
	commitHookEffectListMount,
	commitHookEffectListUnmount,
	commitMutationEffects
} from './commitWork';
import { completeWork } from './completeWork';
import {
	createWorkInProgress,
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects
} from './fiber';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
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
import * as scheduler from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';

const {
	unstable_scheduleCallback: scheduleCallback,
	NormalPriority: NormalSchedulerPriority
} = scheduler;

let workInProgress: FiberNode | null = null;
let workInProgressRootRenderLane: Lanes = NoLanes;

type ExecutionContext = number;
export const NoContext = /*             */ 0b0000;
// const BatchedContext = /*               */ 0b0001;
const RenderContext = /*                */ 0b0010;
const CommitContext = /*                */ 0b0100;
let executionContext: ExecutionContext = NoContext;

// 与调度effect相关
let rootDoesHavePassiveEffects = false;

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
	const prevExecutionContext = executionContext;
	executionContext |= RenderContext;

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

	executionContext = prevExecutionContext;
	workInProgressRootRenderLane = NoLane;
	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;

	// commit阶段操作
	commitRoot(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
	if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
		console.error('不能在React工作流程内执行useEffect回调');
	}

	pendingPassiveEffects.unmount.forEach((effect) => {
		// 不需要HasEffect，因为unmount时一定会触发effect destroy
		commitHookEffectListDestroy(Passive, effect);
	});
	pendingPassiveEffects.unmount = [];

	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListUnmount(Passive | HookHasEffect, effect);
	});
	// 任何create都得在所有destroy执行后再执行
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListMount(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update = [];
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;
	const pendingPassiveEffects = root.pendingPassiveEffects;

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

	/*
		useEffect的执行包括2种情况：
			1. deps变化导致的
			2. 组件卸载，触发destory
			首先在这里调度回调
	*/
	if (
		(finishedWork.flags & PassiveMask) !== NoFlags ||
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlags
	) {
		if (!rootDoesHavePassiveEffects) {
			rootDoesHavePassiveEffects = true;
			scheduleCallback(NormalSchedulerPriority, () => {
				flushPassiveEffects(pendingPassiveEffects);
				return;
			});
		}
	}

	const subtreeHasEffect =
		(finishedWork.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags;
	const rootHasEffect =
		(finishedWork.flags & (MutationMask | PassiveMask)) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		const prevExecutionContext = executionContext;
		executionContext |= CommitContext;
		// 有副作用要执行

		// 阶段1/3:beforeMutation

		// 阶段2/3:Mutation
		commitMutationEffects(finishedWork, root);

		// Fiber Tree切换
		root.current = finishedWork;

		// 阶段3/3:Layout

		executionContext = prevExecutionContext;
	} else {
		// Fiber Tree切换
		root.current = finishedWork;
	}

	rootDoesHavePassiveEffects = false;
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
