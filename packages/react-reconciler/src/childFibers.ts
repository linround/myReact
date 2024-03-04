import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { Props, ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

type ExistingChildren = Map<string | number, FiberNode>;

// shouldTrackEffects
// 在mount 流程存在插入大量的DOM
// 在update 流程更多的是更新
function ChildReconciler(shouldTrackEffects: boolean) {
	// 删除子节点
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

	// 创建fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		// 比较key,如果key不同，不能复用
		// 比较type，如果type不同，不能复用
		// 如果 key和type都相同，则可以复用
		const key = element.key;
		work: if (currentFiber != null) {
			// update
			if (currentFiber.key === key) {
				// key 相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// type 相同
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					}
					// 删掉旧的
					deleteChild(returnFiber, currentFiber);
					break work;
				} else {
					if (__DEV__) {
						console.warn('还未实现的react 类型', element);
						break work;
					}
				}
			} else {
				// 删掉旧的
				deleteChild(returnFiber, currentFiber);
			}
		}

		// 根据 element 创建fiber
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		if (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				// 类型不变可以复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
		}

		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}
	// 插入单一节点
	// 对传入的fiber 进行标记
	function placeSingleChild(fiber: FiberNode) {
		// 首屏渲染
		if (shouldTrackEffects && fiber.alternate === null) {
			// 标记为插入
			fiber.flags |= Placement;
		}
		return fiber;
	}

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		// 最后一个可复用 fiber 在current 中的index
		let lastPlacedIndex: number = 0;
		//创建的最后一个 fiber
		let lastNewFiber: FiberNode | null = null;
		//创建的第一个 fiber
		let firstNewFiber: FiberNode | null = null;

		// 1.将current 保存在 map中保存同级fiber
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}
		for (let i = 0; i < newChild.length; i++) {
			// 2.遍newChild，寻找是否可复用
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) {
				continue;
			}
			// 3.标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
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
				// mount
				newFiber.flags |= Placement;
			}
		}

		// 4.将map中剩下的标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return firstNewFiber;
	}
	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = element.key !== null ? element.key : index;
		const before = existingChildren.get(keyToUse);

		if (typeof element === 'string' || typeof element === 'number') {
			// HostText
			if (before) {
				if (before.tag === HostText) {
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			return new FiberNode(HostText, { content: element + '' }, null);
		}

		// ReactElement
		if (element !== null && typeof element === 'object') {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}
			//todo 数组实现
			if (Array.isArray(element) && __DEV__) {
				console.warn('还未实现数组类型的child');
			}
		}
		return null;
	}

	return function reconcileChildFiber(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					// 创建 fiber
					// 标记 fiber
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				}
				default: {
					if (__DEV__) {
						console.log('未实现的 reconcile 类型', newChild);
					}
					break;
				}
			}
			// todo 多节点的情况
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}
		}

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (currentFiber !== null) {
			// 兜底删除
			deleteChild(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.log('未实现的 reconcile 类型', newChild);
		}
		return null;
	};
}
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}
//
export const reconcileChildFiber = ChildReconciler(true);
//
export const mountChildFiber = ChildReconciler(false);

export function cloneChildFibers(wip: FiberNode) {
	// child sibling
	if (wip.child === null) {
		return;
	}
	let currentChild = wip.child;
	let newChild = createWorkInProgress(currentChild, currentChild.pendingProps!);
	wip.child = newChild;
	newChild.return = wip;

	while (currentChild.sibling !== null) {
		currentChild = currentChild.sibling;
		newChild = newChild.sibling = createWorkInProgress(
			newChild,
			newChild.pendingProps!
		);
		newChild.return = wip;
	}
}
