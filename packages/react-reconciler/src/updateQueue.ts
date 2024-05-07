import { Disptach } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Update } from './fiberFlags';
import {
	isSubsetOfLanes,
	Lane,
	Lanes,
	mergeLanes,
	NoLanes
} from './fiberLanes';

export interface Update<State> {
	action: Action<State>;
	lane: Lane;
	next: Update<any> | null;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Disptach<State> | null;
}

// 创建
export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	if (__LOG__) {
		console.log('创建update：', action, lane);
	}
	return {
		action,
		lane,
		next: null
	};
};

// 插入
export const enqueueUpdate = <Action>(
	updateQueue: UpdateQueue<Action>,
	update: Update<Action>
) => {
	if (__LOG__) {
		console.log('将update插入更新队列：', update);
	}
	const pending = updateQueue.shared.pending;
	if (pending === null) {
		update.next = update;
	} else {
		// pending = a -> a
		// pending = b -> a -> b
		// pending = c -> a -> b -> c
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;
};

// 初始化
export const createUpdateQueue = <Action>() => {
	const updateQueue: UpdateQueue<Action> = {
		shared: {
			pending: null
		},
		dispatch: null
	};
	return updateQueue;
};

// 消费
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLanes: Lanes
): {
	memoizedState: State;
	skippedUpdateLanes: Lanes;
	baseState: State;
	baseQueue: null | Update<State>;
} => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState,
		baseState,
		baseQueue: null,
		skippedUpdateLanes: NoLanes
	};

	if (pendingUpdate !== null) {
		let update = pendingUpdate;

		// 更新后的baseState（有跳过情况下与memoizedState不同）
		let newBaseState = baseState;
		// 更新后的baseQueue第一个节点
		let newBaseQueueFirst: Update<State> | null = null;
		// 更新后的baseQueue最后一个节点
		let newBaseQueueLast: Update<State> | null = null;

		do {
			const updateLane = update.lane;

			if (!isSubsetOfLanes(renderLanes, updateLane)) {
				// 优先级不足
				const clone = createUpdate(update.action, update.lane);
				if (newBaseQueueLast === null) {
					// 没有被跳过的update
					newBaseQueueFirst = newBaseQueueLast = clone;
					// baseState从此开始计算
					newBaseState = result.memoizedState;
				} else {
					newBaseQueueLast.next = clone;
					newBaseQueueLast = newBaseQueueLast.next;
				}
				// 记录跳过的lane
				result.skippedUpdateLanes = mergeLanes(
					result.skippedUpdateLanes,
					update.lane
				);
			} else {
				// 优先级足够
				if (newBaseQueueLast !== null) {
					// 之前有跳过的
					const clone = createUpdate(update.action, update.lane);
					newBaseQueueLast.next = clone;
					newBaseQueueLast = newBaseQueueLast.next;
				}

				const action = update.action;
				if (action instanceof Function) {
					result.memoizedState = action(result.memoizedState);
				} else {
					result.memoizedState = action;
				}
			}
			update = update.next as Update<State>;
		} while (update !== pendingUpdate);

		if (newBaseQueueLast === null) {
			// 没有跳过的，memoizedState应该与baseState一致
			newBaseState = result.memoizedState;
		} else {
			// 形成环状链表
			newBaseQueueLast.next = newBaseQueueFirst;
		}
		result.baseState = newBaseState;
		result.baseQueue = newBaseQueueLast;
	}
	return result;
};
