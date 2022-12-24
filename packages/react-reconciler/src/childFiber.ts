import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Props, ReactElement } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { Lanes } from './fiberLanes';
import { Fragment, HostText } from './workTags';

/**
 * mount/reconcile只负责 Placement(插入)/Placement(移动)/ChildDeletion(删除)
 * 更新（文本节点内容更新、属性更新）在completeWork中，对应Update flag
 */

type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
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
	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) {
			return;
		}
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement,
		lanes: Lanes
	) {
		// 前：abc 后：a  删除bc
		// 前：a 后：b 删除b、创建a
		// 前：无 后：a 创建a
		const key = element.key;
		let current = currentFirstChild;

		while (current !== null) {
			if (current.key === key) {
				// key相同，比较type

				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (current.type === element.type) {
						// type相同 可以复用
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children as Props;
						}
						const existing = useFiber(current, props);
						existing.return = returnFiber;
						// 当前节点可复用，其他兄弟节点都删除
						deleteRemainingChildren(returnFiber, current.sibling);
						return existing;
					}
					// key相同但type不同，没法复用。后面的兄弟节点也没有复用的可能性了，都删除
					deleteRemainingChildren(returnFiber, current);
					break;
				} else {
					console.error('未定义的element.$$typeof', element.$$typeof);
					break;
				}
			} else {
				// key不同，删除旧的，继续比较
				deleteChild(returnFiber, current);
				current = current.sibling;
			}
		}
		// 创建新的
		let fiber;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, lanes, key);
		} else {
			fiber = createFiberFromElement(element, lanes);
		}
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any,
		lanes: Lanes
	): FiberNode | null {
		// 确定key
		const keyToUse = element.key !== null ? element.key : index;

		const before = existingChildren.get(keyToUse);

		// 处理文本节点
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				// fiber key相同，如果type也相同，则可复用
				if (before.tag === HostText) {
					// 复用文本节点
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			return new FiberNode(HostText, { content: element }, null);
		}
		// 处理ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							lanes,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						// fiber key相同，如果type也相同，则可复用
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element, lanes);
			}
			// 处理Fragment
			/**
			 * after可能还是array 考虑如下，其中list是个array：
			 * <ul>
			 * 	<li></li>
			 * 	{list}
			 * </ul>
			 * 这种情况我们应该视after为Fragment
			 */
			if (Array.isArray(element)) {
				return updateFragment(
					returnFiber,
					before,
					element,
					lanes,
					keyToUse,
					existingChildren
				);
			}
		}
		return null;
	}

	function updateFragment(
		returnFiber: FiberNode,
		current: FiberNode | undefined,
		elements: any[],
		lanes: Lanes,
		key: string,
		existingChildren: ExistingChildren
	): FiberNode {
		let fiber;
		if (!current || current.tag !== Fragment) {
			fiber = createFiberFromFragment(elements, lanes, key);
		} else {
			existingChildren.delete(key);
			fiber = useFiber(current, elements);
		}
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string,
		lanes: Lanes
	) {
		// 前：b 后：a
		// TODO 前：abc 后：a
		// TODO 前：bca 后：a
		let current = currentFirstChild;
		while (current !== null) {
			if (current.tag === HostText) {
				// 可以复用
				const existing = useFiber(current, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, current.sibling);
				return existing;
			}
			// 不能复用
			deleteChild(returnFiber, current);
			current = current.sibling;
		}

		const created = new FiberNode(HostText, { content }, null);
		created.lanes = lanes;
		created.return = returnFiber;
		return created;
	}

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[],
		lanes: Lanes
	) {
		// 遍历到的最后一个可复用fiber在before中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个fiber
		let firstNewFiber: FiberNode | null = null;

		// 遍历前的准备工作，将current保存在map中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		// 遍历流程
		for (let i = 0; i < newChild.length; i++) {
			const after = newChild[i];

			// after对应的fiber，可能来自于复用，也可能是新建
			const newFiber = updateFromMap(
				returnFiber,
				existingChildren,
				i,
				after,
				lanes
			) as FiberNode;

			/**
			 * 考虑如下情况：
			 * 更新前：你好{123}
			 * 更新后：你好{null}
			 *   或者：你好{false}
			 *   或者：你好{undefined}
			 */
			if (newFiber === null) {
				continue;
			}

			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = firstNewFiber = newFiber;
			} else {
				lastNewFiber = (lastNewFiber.sibling as FiberNode) = newFiber;
			}

			if (!shouldTrackEffects) {
				continue;
			}
			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// 移动
					newFiber.flags |= Placement;
					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// fiber不能复用，插入新节点
				newFiber.flags |= Placement;
			}
		}

		// 遍历后的收尾工作，标记existingChildren中剩余的删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return firstNewFiber;
	}

	function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any,
		lanes: Lanes
	): FiberNode | null {
		// 对于类似 <ul><><li/><li/></></ul> 这样内部直接使用<>作为Fragment的情况
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;
		if (isUnkeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}

		// newChild 为 JSX
		// currentFirstChild 为 fiberNode
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(
							returnFiber,
							currentFirstChild,
							newChild,
							lanes
						)
					);
			}

			// 第一层数组直接遍历，嵌套数组作为Fragment处理
			// 如： <ul><li/>{[<li/>, <li/>]}</ul>
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(
					returnFiber,
					currentFirstChild,
					newChild,
					lanes
				);
			}
		}
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(
					returnFiber,
					currentFirstChild,
					newChild + '',
					lanes
				)
			);
		}

		// 其他情况全部视为删除旧的节点
		deleteRemainingChildren(returnFiber, currentFirstChild);
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
