// 递归 的递阶段
import {
	createFiberFromFragment,
	createFiberFromOffscreen,
	createWorkInProgress,
	FiberNode,
	OffscreenProps
} from './fiber';
import {
	ContextProvider,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	MemoComponent,
	OffscreenComponent,
	SuspenseComponent
} from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import {
	cloneChildFibers,
	mountChildFiber,
	reconcileChildFiber
} from './childFibers';
import { bailoutHook, renderWithHooks } from './fiberHooks';
import { includeSomeLanes, Lane, NoLanes } from './fiberLanes';
import {
	ChildDeletion,
	DidCapture,
	NoFlags,
	Placement,
	Ref
} from './fiberFlags';
import { pushProvider } from './fiberContext';
import { pushSuspenseHandler } from './suspenseContext';
import React from 'react';
import { shallowEqual } from 'shared/shallowEquals';

// 标记解构变化相关的flags
// Placement 插入 移动
// ChildDeletion 删除

// 是否能命中 bailout
let didReceiveUpdate = false;
export function markWipReceiveUpdate() {
	didReceiveUpdate = true;
}

// Update  与节点属性相关的更新
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	// todo bailout策略
	didReceiveUpdate = false;
	const current = wip.alternate;
	if (current !== null) {
		const oldProps = current.memoizedProps;
		const newProps = wip.pendingProps;

		if (oldProps !== newProps || current.type !== wip.type) {
			didReceiveUpdate = true;
		} else {
			console.log('here');
			// state context
			const hasScheduledStateOrContext = checkScheduledUpdateOrContext(
				current,
				renderLane
			);
			if (!hasScheduledStateOrContext) {
				// 命中 bailout
				didReceiveUpdate = false;

				switch (wip.tag) {
					case ContextProvider:
						const newValue = wip.memoizedProps!.value;
						const context = wip.type._context;
						pushProvider(context, newValue);

						break;
					// todo Suspense
				}

				return bailoutOnAlreadyFinishedWork(wip, renderLane);
			}
		}
	}

	wip.lanes = NoLanes;

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
			return updateFunctionComponent(wip, wip.type, renderLane);
		}
		case ContextProvider: {
			return updateContextProvider(wip);
		}
		case SuspenseComponent: {
			return updateSuspenseComponent(wip);
		}
		case OffscreenComponent: {
			return updateOffscreenComponent(wip);
		}
		case MemoComponent: {
			return UpdateMemoComponent(wip, renderLane);
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

function UpdateMemoComponent(wip: FiberNode, renderLane: Lane) {
	// bailout 四要素
	// props 浅比较
	const current = wip.alternate;
	const nextProps = wip.pendingProps;
	const Component = wip.type.type;
	if (current !== null) {
		const prevProps = current.memoizedProps;
		// 钱比较 props
		if (shallowEqual(prevProps, nextProps) && current.ref === wip.ref) {
			didReceiveUpdate = false;
			wip.pendingProps = prevProps;

			// state context
			if (!checkScheduledUpdateOrContext(current, renderLane)) {
				// 满足四要素
				wip.lanes = current.lanes;
				return bailoutOnAlreadyFinishedWork(wip, renderLane);
			}
		}
	}
	return updateFunctionComponent(wip, Component, renderLane);
}
function updateSuspenseComponent(wip: FiberNode) {
	const current = wip.alternate;
	const nextProps = wip.pendingProps;

	let showFallback = false;
	const didSuspense = (wip.flags & DidCapture) !== NoFlags;

	if (didSuspense) {
		showFallback = true;
		wip.flags &= ~DidCapture;
	}

	const nextPrimaryChildren = nextProps?.children;
	const nextFallbackChildren = nextProps!.fallback;
	pushSuspenseHandler(wip);

	if (current === null) {
		// mount
		if (showFallback) {
			// 挂起

			return mountSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			// 正常
			return mountSuspensePrimaryChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		}
	} else {
		// update
		if (showFallback) {
			// 挂起
			return updateSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			// 正常
			return updateSuspensePrimaryChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		}
	}
}

function updateSuspensePrimaryChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};

	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = null;
	wip.child = primaryChildFragment;

	if (currentFallbackChildFragment !== null) {
		const deletions = wip.deletions;
		if (deletions === null) {
			wip.deletions = [currentFallbackChildFragment];
			wip.flags |= ChildDeletion;
		} else {
			deletions.push(currentFallbackChildFragment);
		}
	}
	return primaryChildFragment;
}

function updateSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	let fallbackChildFragment;
	if (currentFallbackChildFragment !== null) {
		fallbackChildFragment = createWorkInProgress(
			currentFallbackChildFragment,
			fallbackChildren
		);
	} else {
		fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);

		fallbackChildFragment.flags |= Placement;
	}

	fallbackChildFragment.return = wip;
	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = fallbackChildFragment;
	wip.child = primaryChildFragment;

	return fallbackChildFragment;
}

function mountSuspensePrimaryChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	wip.child = primaryChildFragment!;
	primaryChildFragment.return = wip;

	return primaryChildFragment;
}

// mount时挂起的状态
function mountSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	const fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);

	fallbackChildFragment.flags |= Placement;

	primaryChildFragment.return = wip;
	fallbackChildFragment.return = wip;
	primaryChildFragment.sibling = fallbackChildFragment;
	wip.child = primaryChildFragment;

	return fallbackChildFragment;
}
function updateOffscreenComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps?.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function bailoutOnAlreadyFinishedWork(wip: FiberNode, renderLane: Lane) {
	if (!includeSomeLanes(wip.childLanes, renderLane)) {
		if (__DEV__) {
			console.warn('bailout 整棵子树', wip);
		}
		return null;
	}

	if (__DEV__) {
		console.warn('bailout 一个fiber', wip);
	}
	cloneChildFibers(wip);
	return wip.child;
}

function checkScheduledUpdateOrContext(
	current: FiberNode,
	renderLane: Lane
): boolean {
	const updateLanes = current.lanes;

	if (includeSomeLanes(updateLanes, renderLane)) {
		return true;
	} else {
		return false;
	}
}
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

function updateFunctionComponent(
	wip: FiberNode,
	Component: FiberNode['type'],
	renderLane: Lane
) {
	// render
	const nextChildren = renderWithHooks(wip, Component, renderLane);

	const current = wip.alternate;
	if (current !== null && !didReceiveUpdate) {
		bailoutHook(wip, renderLane);
		return bailoutOnAlreadyFinishedWork(wip, renderLane);
	}

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

	const prevChildren = wip.memoizedState;

	const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);

	const current = wip.alternate;
	if (current !== null) {
		if (!current.memoizedState) {
			current.memoizedState = memoizedState;
		}
	}

	wip.memoizedState = memoizedState;
	const nextChildren = wip.memoizedState;

	if (prevChildren === nextChildren) {
		return bailoutOnAlreadyFinishedWork(wip, renderLane);
	}

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
