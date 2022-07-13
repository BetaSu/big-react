import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Props, ReactElement } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { HostText } from './workTags';

/**
 * mount/reconcile只负责 Placement(插入)/Placement(移动)/ChildDeletion(删除)
 * 更新（文本节点内容更新、属性更新）在completeWork中，对应Update flag
 */

function ChildReconciler(shouldTrackEffect: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffect) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement
	) {
		// TODO 前：abc 后：a  删除bc
		// 前：a 后：b 删除b、创建a
		// 前：无 后：a 创建a
		const key = element.key;
		if (currentFirstChild !== null) {
			if (currentFirstChild.key === key) {
				// key相同，比较type

				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFirstChild.type === element.type) {
						// type相同 可以复用
						const existing = useFiber(currentFirstChild, element.props);
						existing.return = returnFiber;
						return existing;
					}
					// type不同，删除旧的
					deleteChild(returnFiber, currentFirstChild);
				} else {
					console.error('未定义的element.$$typeof', element.$$typeof);
				}
			} else {
				// key不同，删除旧的
				deleteChild(returnFiber, currentFirstChild);
			}
		}
		// 创建新的
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffect && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string
	) {
		// 前：b 后：a
		// TODO 前：abc 后：a
		// TODO 前：bca 后：a
		if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
			const existing = useFiber(currentFirstChild, { content });
			existing.return = returnFiber;
			return existing;
		}
		if (currentFirstChild !== null) {
			deleteChild(returnFiber, currentFirstChild);
		}

		const created = new FiberNode(HostText, { content }, null);
		created.return = returnFiber;
		return created;
	}

	function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild?: ReactElement
	): FiberNode | null {
		// newChild 为 JSX
		// currentFirstChild 为 fiberNode
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFirstChild, newChild)
					);
			}
		}
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + '')
			);
		}
		console.error('reconcile时未实现的child 类型');
		return null;
	}

	return reconcileChildFibers;
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;

	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
