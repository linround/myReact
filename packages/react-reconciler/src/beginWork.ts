// 递归 的递阶段
import { FiberNode } from './fiber';
import {
	ContextProvider,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFiber, reconcileChildFiber } from './childFibers';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';
import { Ref } from './fiberFlags';
import { pushProvider } from './fiberContext';

// 标记解构变化相关的flags
// Placement 插入 移动
// ChildDeletion 删除

// Update  与节点属性相关的更新
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	//  比较，返回子fiberNode
	switch (wip.tag) {
		case HostRoot: {
			// 计算状态最新值
			// 创建 子fiberNode

			return updateHostRoot(wip, renderLane);
		}
		case HostComponent: {
			return updateHostComponent(wip);
		}
		case HostText: {
			return null;
		}
		case FunctionComponent: {
			return updateFunctionComponent(wip, renderLane);
		}
		case ContextProvider: {
			return updateContextProvider(wip);
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

function updateContextProvider(wip: FiberNode) {
	const providerType = wip.type;
	const context = providerType._context;
	const newProps = wip.pendingProps;

	// todo
	pushProvider(context, newProps!.value);

	const nextChildren = newProps?.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
	const nextChildren = renderWithHooks(wip, renderLane);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// 计算状态最新值
// 创建 子fiberNode
function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);
	wip.memoizedState = memoizedState;
	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// 创建子 fiberNode
function updateHostComponent(workInProgress: FiberNode) {
	const nextProp = workInProgress.pendingProps;
	// @ts-ignore
	const nextChildren = nextProp.children;
	markRef(workInProgress.alternate, workInProgress);
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
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

function markRef(current: FiberNode | null, workInProgress: FiberNode) {
	const ref = workInProgress.ref;
	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref != ref)
	) {
		workInProgress.flags |= Ref;
	}
}
