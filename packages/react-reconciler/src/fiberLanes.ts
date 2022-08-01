import { FiberRootNode } from './fiber';

export type Lane = number;
export type Lanes = number;

export const NoLane = /*    */ 0b0000000000000000000000000000000;
export const NoLanes = /*   */ 0b0000000000000000000000000000000;
export const SyncLane = /*  */ 0b0000000000000000000000000000001;

export function mergeLanes(laneA: Lane, laneB: Lane): Lane {
	return laneA | laneB;
}

// 获取update应有的优先级
export function requestUpdateLane() {
	return SyncLane;
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
	return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}
