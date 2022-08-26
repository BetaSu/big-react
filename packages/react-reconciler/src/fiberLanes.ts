import {
	unstable_NormalPriority as NormalPriority,
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_IdlePriority as IdlePriority,
	unstable_LowPriority as LowPriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	unstable_getCurrentPriorityLevel as getCurrentSchedulerPriorityLevel
} from 'scheduler';
import { FiberRootNode } from './fiber';

export type Lane = number;
export type Lanes = number;

export const NoLane = /*               */ 0b0000000000000000000000000000000;
export const NoLanes = /*              */ 0b0000000000000000000000000000000;
export const SyncLane = /*             */ 0b0000000000000000000000000000001; // 同步，ex：onClick
export const InputContinuousLane = /*  */ 0b0000000000000000000000000000010; // 连续触发，ex：onScroll
export const DefaultLane = /*          */ 0b0000000000000000000000000000100; // 默认，ex：useEffect回调
export const IdleLane = /*             */ 0b1000000000000000000000000000000; // 空闲

export function mergeLanes(laneA: Lane, laneB: Lane): Lane {
	return laneA | laneB;
}

// 获取update应有的优先级，根据update触发场景
export function requestUpdateLane() {
	// TODO render阶段触发更新
	// TODO Transition

	// 从当前上下文中获取优先级信息
	const currentSchedulerPriorityLevel = getCurrentSchedulerPriorityLevel();
	const updateLane = schedulerPriorityToLane(currentSchedulerPriorityLevel);
	console.warn('updateLane!', updateLane);
	return updateLane;
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
	return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lanes: Lanes) {
	root.pendingLanes &= ~lanes;
}

export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane) {
	return (set & subset) === subset;
}

// 当前没有做特殊处理，但是保留了lanes的灵活性
export function getNextLanes(root: FiberRootNode): Lanes {
	const pendingLanes = root.pendingLanes;
	if (pendingLanes === NoLanes) {
		return NoLanes;
	}
	const nextLanes = getHighestPriorityLane(pendingLanes);

	if (nextLanes === NoLanes) {
		return NoLanes;
	}
	// TODO render阶段更新

	return nextLanes;
}

// lanes向Scheduler优先级转换
export function lanesToSchedulerPriority(lanes: Lanes) {
	const lane = getHighestPriorityLane(lanes);
	if (lane === SyncLane) {
		return ImmediatePriority;
	}
	if (lane === InputContinuousLane) {
		return UserBlockingPriority;
	}
	if (lane === DefaultLane) {
		return NormalPriority;
	}
	// 剩下的做空闲处理
	return IdlePriority;
}

// Scheduler优先级向lanes转换
export function schedulerPriorityToLane(schedulerPriority: number): Lane {
	if (schedulerPriority === ImmediatePriority) {
		return SyncLane;
	}
	if (schedulerPriority === UserBlockingPriority) {
		return InputContinuousLane;
	}
	if (schedulerPriority === NormalPriority) {
		return DefaultLane;
	}
	return NoLane;
}
