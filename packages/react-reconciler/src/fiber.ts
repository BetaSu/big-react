import { Key, Props, ReactElement, Ref } from 'shared/ReactTypes';
import { Flags, NoFlags } from './fiberFlags';
import { Effect } from './fiberHooks';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { Container } from 'hostConfig';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { CallbackNode } from 'scheduler';

export class FiberNode {
	pendingProps: Props;
	memoizedProps: Props | null;
	key: Key;
	stateNode: any;
	type: any;
	ref: Ref;
	tag: WorkTag;
	flags: Flags;
	subtreeFlags: Flags;
	deletions: FiberNode[] | null;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	updateQueue: unknown;
	memoizedState: any;

	alternate: FiberNode | null;

	lanes: Lanes;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例
		this.tag = tag;
		this.key = key;
		this.stateNode = null;
		this.type = null;

		// 树结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		// 状态
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.updateQueue = null;
		this.memoizedState = null;

		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;

		// 调度
		this.lanes = NoLane;
		// this.childLanes = NoLanes;

		this.alternate = null;
	}
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;
	pendingLanes: Lanes;
	finishedLanes: Lanes;
	callbackNode: CallbackNode | null;
	callbackPriority: Lane;
	pendingPassiveEffects: PendingPassiveEffects;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
		// 保存未执行的effect
		this.pendingPassiveEffects = {
			// 属于卸载组件的
			unmount: [],
			// 属于更新组件的
			update: []
		};

		// 所有未执行的lane的集合
		this.pendingLanes = NoLanes;
		// 本轮更新执行的lanes
		this.finishedLanes = NoLane;

		// 调度的回调函数
		this.callbackNode = null;
		// 调度的回调函数优先级
		this.callbackPriority = NoLane;
	}
}

export function createFiberFromElement(element: ReactElement): FiberNode {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type !== 'function') {
		console.error('未定义的type类型', element);
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;

	return fiber;
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.type = current.type;
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
		wip.type = current.type;
	}
	wip.updateQueue = current.updateQueue;
	wip.flags = current.flags;
	wip.child = current.child;

	// 数据
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	wip.lanes = current.lanes;

	return wip;
};
