import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance,
	Instance
} from 'hostConfig';
import { FiberNode, OffscreenProps } from './fiber';
import { NoFlags, Ref, Update, Visibility } from './fiberFlags';
import {
	HostRoot,
	HostText,
	HostComponent,
	FunctionComponent,
	Fragment,
	ContextProvider,
	OffscreenComponent,
	SuspenseComponent,
	MemoComponent
} from './workTags';
import { popProvider } from './fiberContext';
import { popSuspenseHandler } from './suspenseContext';
import { mergeLanes, NoLanes } from './fiberLanes';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

function markRef(fiber: FiberNode) {
	fiber.flags |= Ref;
}

export const completeWork = (wip: FiberNode) => {
	// 递归中的归

	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// TODO update
				// 1. props是否变化 {onClick: xx} {onClick: xxx}
				// 2. 变了 Update flag
				// className style
				markUpdate(wip);
				// 标记Ref
				if (current.ref !== wip.ref) {
					markRef(wip);
				}
			} else {
				// mount
				// 1. 构建DOM
				// const instance = createInstance(wip.type, newProps);
				const instance = createInstance(wip.type, newProps);
				// 2. 将DOM插入到DOM树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
				// 标记Ref
				if (wip.ref !== null) {
					markRef(wip);
				}
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizedProps?.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// 1. 构建DOM
				const instance = createTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
		case FunctionComponent:
		case Fragment:
		case OffscreenComponent:
		case MemoComponent:
			bubbleProperties(wip);
			return null;
		case ContextProvider:
			const context = wip.type._context;
			popProvider(context);
			bubbleProperties(wip);
			return null;
		case SuspenseComponent:
			popSuspenseHandler();

			const offscreenFiber = wip.child as FiberNode;
			const isHidden = offscreenFiber.pendingProps.mode === 'hidden';
			const currentOffscreenFiber = offscreenFiber.alternate;
			if (currentOffscreenFiber !== null) {
				const wasHidden = currentOffscreenFiber.pendingProps.mode === 'hidden';

				if (isHidden !== wasHidden) {
					// 可见性变化
					offscreenFiber.flags |= Visibility;
					bubbleProperties(offscreenFiber);
				}
			} else if (isHidden) {
				// mount时hidden
				offscreenFiber.flags |= Visibility;
				bubbleProperties(offscreenFiber);
			}
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.warn('未处理的completeWork情况', wip);
			}
			break;
	}
};

function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
	let node = wip.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;
	let newChildLanes = NoLanes;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		// child.lanes child.childLanes
		newChildLanes = mergeLanes(
			newChildLanes,
			mergeLanes(child.lanes, child.childLanes)
		);

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
	wip.childLanes = newChildLanes;
}
