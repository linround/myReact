import { createFiber, createFiberFromElement, FiberNode } from './fiber';
import { ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

// shouldTrackEffects
// 在mount 流程存在插入大量的DOM
// 在update 流程更多的是更新
function ChildReconciler(shouldTrackEffects: boolean) {
	// 创建fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
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
		}
		// todo 多节点的情况
		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (__DEV__) {
			console.log('未实现的 reconcile 类型', newChild);
		}
		return null;
	};
}

//
export const reconcileChildFiber = ChildReconciler(true);
//
export const mountChildFiber = ChildReconciler(false);
