import { Dispatcher, Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import sharedInternals from 'shared/internals';
import { FiberNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	Update,
	UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import {
	Lane,
	Lanes,
	mergeLanes,
	NoLane,
	NoLanes,
	requestUpdateLane
} from './fiberLanes';
import { Flags, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './hookEffectTags';

let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let currentlyRenderingFiber: FiberNode | null = null;
let renderLanes: Lanes = NoLanes;
interface Hook {
	memoizedState: any;
	// 对于state，保存update相关数据
	updateQueue: unknown;
	// 对于state，保存开始更新前就存在的updateList（上次更新遗留）
	baseQueue: Update<any> | null;
	// 对于state，基于baseState开始计算更新，与memoizedState的区别在于上次更新是否存在跳过
	baseState: any;
	next: Hook | null;
}

const { currentDispatcher } = sharedInternals;

export const renderWithHooks = (workInProgress: FiberNode, lane: Lane) => {
	currentlyRenderingFiber = workInProgress;
	// 重置
	workInProgress.memoizedState = null;
	workInProgress.updateQueue = null;
	renderLanes = lane;

	const current = workInProgress.alternate;
	if (current !== null) {
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	const children = Component(props);

	// 重置
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	renderLanes = NoLane;

	return children;
};

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect,
	useRef: mountRef
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect,
	useRef: updateRef
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	const hook = mountWorkInProgressHook();
	let memoizedState: State;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	hook.memoizedState = memoizedState;
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;

	// @ts-ignore
	const dispatch = (queue.dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		queue
	));

	return [memoizedState, dispatch];
}

function updateState<State>(): [State, Dispatch<State>] {
	const hook = updateWorkInProgressHook();
	const queue = hook.updateQueue as UpdateQueue<State>;
	const baseState = hook.baseState;

	// TODO 缺少render阶段更新的处理逻辑

	const current = currentHook as Hook;
	let baseQueue = current.baseQueue;

	const pending = queue.shared.pending;

	if (pending !== null) {
		// 基于baseQueue拼装pendingQueue
		if (baseQueue !== null) {
			// baseQueue = b2 -> b0 -> b1 -> b2
			// pending = p2 -> p0 -> p1 -> p2

			// b0
			const baseFirst = baseQueue.next;
			// p0
			const pendingFirst = pending.next;
			// baseQueue = b2 -> p0 -> p1 -> p2
			baseQueue.next = pendingFirst;
			// pending = p2 -> b0 -> b1 -> b2
			pending.next = baseFirst;
			// 拼接完成后：先pending，再baseQueue
			// baseQueue = b2 -> p0 -> p1 -> p2 -> b0 -> b1 -> b2
		}
		// pending保存在current中，因为commit阶段不完成，current不会变为wip
		// 所以可以保证多次render阶段（只要不进入commit）都能从current恢复pending
		current.baseQueue = baseQueue = pending;
		queue.shared.pending = null;
	}
	if (baseQueue !== null) {
		const {
			memoizedState,
			baseState: newBaseState,
			baseQueue: newBaseQueue,
			skippedUpdateLanes
		} = processUpdateQueue(baseState, baseQueue, renderLanes);
		(currentlyRenderingFiber as FiberNode).lanes = mergeLanes(
			(currentlyRenderingFiber as FiberNode).lanes,
			skippedUpdateLanes
		);
		hook.memoizedState = memoizedState;
		hook.baseState = newBaseState;
		hook.baseQueue = newBaseQueue;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const lane = requestUpdateLane();
	const update = createUpdate(action, lane);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber, lane);
}

type TEffectCallback = () => void;
type TEffectDeps = any[] | null;

function mountEffect(create: TEffectCallback | void, deps: TEffectDeps | void) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	// 注意区分PassiveEffect与Passive，PassiveEffect是针对fiber.flags
	// Passive是effect类型，代表useEffect。类似的，Layout代表useLayoutEffect
	(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		undefined,
		nextDeps
	);
}

function updateEffect(
	create: TEffectCallback | void,
	deps: TEffectDeps | void
) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	let destroy: TEffectCallback | void;

	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState as Effect;
		destroy = prevEffect.destroy;
		if (nextDeps !== null) {
			// 浅比较依赖
			const prevDeps = prevEffect.deps;
			if (areHookInputsEqual(prevDeps, nextDeps)) {
				hook.memoizedState = pushEffect(Passive, create, destroy, nextDeps);
				return;
			}
		}
	}
	// 接下来才是有副作用
	(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		destroy,
		nextDeps
	);
}

function areHookInputsEqual(nextDeps: TEffectDeps, prevDeps: TEffectDeps) {
	if (prevDeps === null || nextDeps === null) {
		return false;
	}
	for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (Object.is(prevDeps[i], nextDeps[i])) {
			continue;
		}
		return false;
	}
	return true;
}

function mountRef<T>(initialValue: T): { current: T } {
	const hook = mountWorkInProgressHook();
	const ref = { current: initialValue };
	hook.memoizedState = ref;
	return ref;
}

function updateRef<T>(initialValue: T): { current: T } {
	const hook = updateWorkInProgressHook();
	return hook.memoizedState;
}

export interface Effect {
	tag: Flags;
	create: TEffectCallback | void;
	destroy: TEffectCallback | void;
	deps: TEffectDeps;
	// 环状链表
	next: Effect | null;
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null;
}

// 将所有effectHook连接形成链表，并且保证每次commit updateQueue.lastEffect链表的顺序都不会变
function pushEffect(
	hookFlags: Flags,
	create: TEffectCallback | void,
	destroy: TEffectCallback | void,
	deps: TEffectDeps
) {
	const effect: Effect = {
		tag: hookFlags,
		create,
		destroy,
		deps,
		next: null
	};

	const fiber = currentlyRenderingFiber as FiberNode;
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue();
		fiber.updateQueue = updateQueue;
		// 与自己形成环
		updateQueue.lastEffect = effect.next = effect;
	} else {
		// append操作
		const lastEffect = updateQueue.lastEffect;
		if (lastEffect === null) {
			updateQueue.lastEffect = effect.next = effect;
		} else {
			const firstEffect = lastEffect.next;
			lastEffect.next = effect;
			effect.next = firstEffect;
			updateQueue.lastEffect = effect;
		}
	}
	return effect;
}

function createFCUpdateQueue<State>() {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
	updateQueue.lastEffect = null;
	return updateQueue;
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		baseQueue: null,
		baseState: null,
		next: null
	};
	if (workInProgressHook === null) {
		if (currentlyRenderingFiber === null) {
			console.error('mountWorkInprogressHook时currentlyRenderingFiber未定义');
		} else {
			currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
		}
	} else {
		workInProgressHook = workInProgressHook.next = hook;
	}
	return workInProgressHook as Hook;
}

function updateWorkInProgressHook(): Hook {
	// 情况1:交互触发的更新，此时wipHook还不存在，复用 currentHook链表中对应的 hook 克隆 wipHook
	// 情况2:render阶段触发的更新，wipHook已经存在，使用wipHook
	let nextCurrentHook: Hook | null;
	let nextWorkInProgressHook: Hook | null;

	if (currentHook === null) {
		// 情况1 当前组件的第一个hook
		const current = (currentlyRenderingFiber as FiberNode).alternate;
		if (current !== null) {
			nextCurrentHook = current.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		nextCurrentHook = currentHook.next;
	}

	if (workInProgressHook === null) {
		// 情况2 当前组件的第一个hook
		nextWorkInProgressHook = (currentlyRenderingFiber as FiberNode)
			.memoizedState;
	} else {
		nextWorkInProgressHook = workInProgressHook.next;
	}

	if (nextWorkInProgressHook !== null) {
		// 针对情况2 nextWorkInProgressHook保存了当前hook的数据
		workInProgressHook = nextWorkInProgressHook;
		currentHook = nextCurrentHook;
	} else {
		// 针对情况1 nextCurrentHook保存了可供克隆的hook数据
		if (nextCurrentHook === null) {
			// 本次render当前组件执行的hook比之前多，举个例子：
			// 之前：hook1 -> hook2 -> hook3
			// 本次：hook1 -> hook2 -> hook3 -> hook4
			// 那到了hook4，nextCurrentHook就为null
			console.error(
				`组件${currentlyRenderingFiber?.type}本次执行的hook比上次多`
			);
		}
		currentHook = nextCurrentHook as Hook;
		const newHook: Hook = {
			memoizedState: currentHook.memoizedState,
			// 对于state，保存update相关数据
			updateQueue: currentHook.updateQueue,
			baseState: currentHook.baseState,
			baseQueue: currentHook.baseQueue,
			next: null
		};

		if (workInProgressHook === null) {
			(currentlyRenderingFiber as FiberNode).memoizedState =
				workInProgressHook = newHook;
		} else {
			workInProgressHook = workInProgressHook.next = newHook;
		}
	}
	return workInProgressHook as Hook;
}
