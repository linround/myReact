// 递归 的递阶段
import { FiberNode } from './fiber';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFiber, reconcileChildFiber } from './childFibers';
import { renderWithHooks } from './fiberHooks';

// 标记解构变化相关的flags
// Placement 插入 移动
// ChildDeletion 删除

// Update  与节点属性相关的更新
export const beginWork = (wip: FiberNode) => {
	//  比较，返回子fiberNode
	switch (wip.tag) {
		case HostRoot: {
			// 计算状态最新值
			// 创建 子fiberNode

			return updateHostRoot(wip);
		}
		case HostComponent: {
			return updateHostComponent(wip);
		}
		case HostText: {
			return null;
		}
		case FunctionComponent: {
			return updateFunctionComponent(wip);
		}
		default: {
			if (__DEV__) {
				console.warn('beginWork 未实现的类型');
			}
			break;
		}
	}
	return null;
};

function updateFunctionComponent(wip: FiberNode) {
	const nextChildren = renderWithHooks(wip);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// 计算状态最新值
// 创建 子fiberNode
function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState;
	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// 创建子 fiberNode
function updateHostComponent(wip: FiberNode) {
	const nextProp = wip.pendingProps;
	const nextChildren = nextProp.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// 进入A的beginWork
// 通过对比B current fiberNode 与 B reactElement;；
// 生成B对应的 wip fiberNode
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;
	if (current !== null) {
		// update
		wip.child = reconcileChildFiber(wip, current?.child, children);
	} else {
		// mount
		wip.child = mountChildFiber(wip, null, children);
	}
}
