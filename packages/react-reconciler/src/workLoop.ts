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
	getNextLanes,
	Lane,
	Lanes,
	lanesToSchedulerPriority,
	markRootFinished,
	mergeLanes,
	NoLane,
	NoLanes,
	SyncLane
} from './fiberLanes';
import { scheduleMicrotask } from 'hostConfig';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';
import * as scheduler from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';

const {
	unstable_scheduleCallback: scheduleCallback,
	unstable_NormalPriority: NormalSchedulerPriority,
	unstable_cancelCallback: cancelSchedulerCallback,
	unstable_shouldYield: schedulerShouldYield
} = scheduler;

let workInProgress: FiberNode | null = null;
let workInProgressRootRenderLane: Lanes = NoLanes;

type ExecutionContext = number;
export const NoContext = /*             */ 0b0000;
// const BatchedContext = /*               */ 0b0001;
const RenderContext = /*                */ 0b0010;
const CommitContext = /*                */ 0b0100;
let executionContext: ExecutionContext = NoContext;

type RootExitStatus = number;
// 并发更新未完成
const RootIncomplete = 1;
// 更新完成
const RootCompleted = 2;

// 与调度effect相关
let rootDoesHavePassiveEffects = false;

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	if (__LOG__) {
		console.log('开始schedule阶段', fiber, lane);
	}
	const root = markUpdateLaneFromFiberToRoot(fiber, lane);
	// TODO 饥饿问题
	markRootUpdated(root, lane);
	console.log('root', root);
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
	const updateLanes = getNextLanes(root);
	const existingCallback = root.callbackNode;

	if (updateLanes === NoLanes) {
		if (existingCallback !== null) {
			cancelSchedulerCallback(existingCallback);
		}
		root.callbackNode = null;
		root.callbackPriority = NoLane;
		return;
	}
	const curPriority = getHighestPriorityLane(updateLanes);
	const prevPriority = root.callbackPriority;

	if (curPriority === prevPriority) {
		// 有更新在进行，比较该更新与正在进行的更新的优先级
		// 如果优先级相同，则不需要调度新的，退出调度
		return;
	}
	if (existingCallback !== null) {
		cancelSchedulerCallback(existingCallback);
	}
	// 如果使用Scheduler调度，则会存在新的callbackNode，用React微任务调度不会存在
	let newCallbackNode = null;
	if (curPriority === SyncLane) {
		// React调度
		if (__LOG__) {
			console.log('在微任务中调度执行，优先级：', updateLanes);
		}
		// 微任务中调度执行
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLanes));
		scheduleMicrotask(flushSyncCallbacks);
	} else {
		// Scheduler调度
		const schedulerPriority = lanesToSchedulerPriority(curPriority);
		newCallbackNode = scheduleCallback(
			schedulerPriority,
			performConcurrentWorkOnRoot.bind(null, root)
		);
	}
	root.callbackNode = newCallbackNode;
	root.callbackPriority = curPriority;
}

function performConcurrentWorkOnRoot(
	root: FiberRootNode,
	didTimeout: boolean
): any {
	if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
		throw '当前不应处于React工作流程内';
	}

	// 开始执行具体工作前，保证上一次的useEffct都执行了
	// 同时要注意useEffect执行时触发的更新优先级是否大于当前更新的优先级
	const didFlushPassiveEffects = flushPassiveEffects(
		root.pendingPassiveEffects
	);
	const curCallbackNode = root.callbackNode;
	if (didFlushPassiveEffects) {
		if (root.callbackNode !== curCallbackNode) {
			// 调度了更高优更新，这个更新已经被取消了
			return null;
		}
	}

	const lanes = getNextLanes(root);
	if (lanes === NoLanes) {
		return null;
	}

	// 本次更新是否是并发更新？
	// TODO 饥饿问题也会影响shouldTimeSlice
	const shouldTimeSlice = !didTimeout;
	const exitStatus = renderRoot(root, lanes, shouldTimeSlice);

	ensureRootIsScheduled(root);
	if (exitStatus === RootIncomplete) {
		if (root.callbackNode !== curCallbackNode) {
			// 调度了更高优更新，这个更新已经被取消了
			return null;
		}
		return performConcurrentWorkOnRoot.bind(null, root);
	}
	if (exitStatus === RootCompleted) {
		const finishedWork = root.current.alternate;
		root.finishedWork = finishedWork;
		root.finishedLanes = lanes;

		// commit阶段操作
		commitRoot(root);
	} else {
		throw '还未实现的并发更新结束状态';
	}
}

function renderRoot(
	root: FiberRootNode,
	lanes: Lanes,
	shouldTimeSlice: boolean
) {
	if (__LOG__) {
		console.log(`开始${shouldTimeSlice ? '并发' : '同步'}render阶段`, root);
	}
	const prevExecutionContext = executionContext;
	executionContext |= RenderContext;

	// 初始化操作
	prepareFreshStack(root, lanes);

	// render阶段具体操作
	do {
		try {
			shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
			break;
		} catch (e) {
			console.error('workLoop发生错误', e);
			workInProgress = null;
		}
	} while (true);

	executionContext = prevExecutionContext;

	if (shouldTimeSlice && workInProgress !== null) {
		return RootIncomplete;
	}
	if (!shouldTimeSlice && workInProgress !== null) {
		console.error('render阶段结束时wip不为null');
	}

	workInProgressRootRenderLane = NoLane;
	return RootCompleted;
}

function performSyncWorkOnRoot(root: FiberRootNode, lanes: Lanes) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);

	if (nextLane !== SyncLane) {
		ensureRootIsScheduled(root);
		return;
	}

	const exitStatus = renderRoot(root, lanes, false);
	if (exitStatus === RootCompleted) {
		const finishedWork = root.current.alternate;
		root.finishedWork = finishedWork;
		root.finishedLanes = lanes;

		// commit阶段操作
		commitRoot(root);
	} else {
		throw '还未实现的同步更新结束状态';
	}
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
	if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
		console.error('不能在React工作流程内执行useEffect回调');
	}
	let didFlushPassiveEffects = false;
	pendingPassiveEffects.unmount.forEach((effect) => {
		// 不需要HasEffect，因为unmount时一定会触发effect destroy
		didFlushPassiveEffects = true;
		commitHookEffectListDestroy(Passive, effect);
	});
	pendingPassiveEffects.unmount = [];

	pendingPassiveEffects.update.forEach((effect) => {
		didFlushPassiveEffects = true;
		commitHookEffectListUnmount(Passive | HookHasEffect, effect);
	});
	// 任何create都得在所有destroy执行后再执行
	pendingPassiveEffects.update.forEach((effect) => {
		didFlushPassiveEffects = true;
		commitHookEffectListMount(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update = [];
	flushSyncCallbacks();
	return didFlushPassiveEffects;
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
	const lanes = root.finishedLanes;

	// 重置
	root.finishedWork = null;
	root.finishedLanes = NoLanes;
	root.callbackNode = null;
	root.callbackPriority = NoLane;

	markRootFinished(root, lanes);

	if (lanes === NoLane) {
		console.error('commit阶段finishedLanes不应该是NoLanes');
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
	ensureRootIsScheduled(root);
}

function prepareFreshStack(root: FiberRootNode, lanes: Lanes) {
	if (__LOG__) {
		console.log('render阶段初始化工作', root);
	}
	workInProgress = createWorkInProgress(root.current, {});
	workInProgressRootRenderLane = lanes;
}

function workLoopSync() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}
function workLoopConcurrent() {
	while (workInProgress !== null && !schedulerShouldYield()) {
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
