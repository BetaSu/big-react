import { Key, Props, Ref } from 'shared/ReactTypes';
import { Container } from './hostConfig';
import { WorkTag } from './workTags';

export class FiberNode {
	pendingProps: Props | null;
	memoizedProps: Props | null;
	key: Key;
	stateNode: any;
	type: any;
	ref: Ref;
	tag: WorkTag;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	updateQueue: any;
	memoizedState: any;

	alternate: FiberNode | null;

	constructor(tag: WorkTag, pendingProps: Props | null, key: Key) {
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
		// this.flags = NoFlags;
		// this.subtreeFlags = NoFlags;
		// this.deletions = null;

		// 调度
		// this.lanes = NoLanes;
		// this.childLanes = NoLanes;

		this.alternate = null;
	}
}

export class FiberRootNode {
	container: Container;
	current: FiberNode | null;
	constructor(container: Container) {
		this.container = container;
		this.current = null;
	}
}
