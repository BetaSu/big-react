import { ReactContext } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import {
	Lane,
	NoLanes,
	includeSomeLanes,
	isSubsetOfLanes,
	mergeLanes
} from './fiberLanes';
import { ContextProvider } from './workTags';
import { markWorkInProgressReceivedUpdate } from './beginWork';

export interface ContextItem<T> {
	context: ReactContext<T>;
	memoizedState: T;
	next: ContextItem<any> | null;
}

let prevContextValue: any = null;
const prevContextValueStack: any[] = [];
let lastContextDependency: ContextItem<any> | null = null;

export function pushProvider<T>(context: ReactContext<T>, newValue: T) {
	prevContextValueStack.push(prevContextValue);

	prevContextValue = context._currentValue;
	context._currentValue = newValue;
}

export function popProvider<T>(context: ReactContext<T>) {
	context._currentValue = prevContextValue;

	prevContextValue = prevContextValueStack.pop();
}

export function prepareToReadContext(wip: FiberNode, renderLane: Lane) {
	lastContextDependency = null;

	const deps = wip.dependencies;
	if (deps !== null) {
		const firstContext = deps.firstContext;
		if (firstContext !== null) {
			if (includeSomeLanes(deps.lanes, renderLane)) {
				markWorkInProgressReceivedUpdate();
			}
			// 重置 firstContext，readContext时会重新创建
			deps.firstContext = null;
		}
	}
}

export function readContext<T>(
	consumer: FiberNode | null,
	context: ReactContext<T>
): T {
	if (consumer === null) {
		throw new Error('只能在函数组件中调用useContext');
	}
	const value = context._currentValue;
	const contextItem: ContextItem<T> = {
		context,
		next: null,
		memoizedState: value
	};
	if (lastContextDependency === null) {
		lastContextDependency = contextItem;
		consumer.dependencies = {
			firstContext: contextItem,
			lanes: NoLanes
		};
	} else {
		lastContextDependency = lastContextDependency.next = contextItem;
	}

	return value;
}

export function propagateContextChange<T>(
	wip: FiberNode,
	context: ReactContext<T>,
	renderLane: Lane
) {
	let fiber = wip.child;
	// 这是context的遍历，所以保持连接稳定
	if (fiber !== null) {
		fiber.return = wip;
	}

	while (fiber !== null) {
		let nextFiber = null;
		const deps = fiber.dependencies;
		if (deps !== null) {
			nextFiber = fiber.child;
			// 潜在的可能性
			let contextItem = deps.firstContext;
			while (contextItem !== null) {
				if (contextItem.context === context) {
					// 找到了
					fiber.lanes = mergeLanes(fiber.lanes, renderLane);
					const alternate = fiber.alternate;
					if (alternate !== null) {
						alternate.lanes = mergeLanes(alternate.lanes, renderLane);
					}
					// 向上回到Provider
					scheduleContextWorkOnParentPath(fiber.return, renderLane, wip);
					deps.lanes = mergeLanes(deps.lanes, renderLane);
					break;
				}
				contextItem = contextItem.next;
			}
		} else if (fiber.tag === ContextProvider) {
			// 如果是同类Provider，则不继续递归，其他Provider则继续递归他的Child
			nextFiber = fiber.type === wip.type ? null : fiber.child;
		} else {
			nextFiber = fiber.child;
		}

		if (nextFiber !== null) {
			nextFiber.return = fiber;
		} else {
			// 没有child 向sibling寻找
			nextFiber = fiber;
			while (nextFiber !== null) {
				if (nextFiber === wip) {
					nextFiber = null;
					break;
				}
				const sibling = nextFiber.sibling;
				if (sibling !== null) {
					sibling.return = nextFiber.return;
					nextFiber = sibling;
					break;
				}
				nextFiber = nextFiber.return;
			}
		}
		fiber = nextFiber;
	}
}

function scheduleContextWorkOnParentPath(
	from: FiberNode | null,
	renderLane: Lane,
	to: FiberNode
) {
	let node = from;

	while (node !== null) {
		const alternate = node.alternate;
		if (!isSubsetOfLanes(node.childLanes, renderLane)) {
			node.childLanes = mergeLanes(node.childLanes, renderLane);
			if (alternate !== null) {
				alternate.childLanes = mergeLanes(alternate.childLanes, renderLane);
			}
		} else if (
			alternate !== null &&
			!isSubsetOfLanes(alternate.childLanes, renderLane)
		) {
			alternate.childLanes = mergeLanes(alternate.childLanes, renderLane);
		}
		if (node === to) {
			break;
		}
		node = node.return;
	}
}
