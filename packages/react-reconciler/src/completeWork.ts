// 需要解决的问题：
// 对于host 类型的 fiberNode ：构建离屏DOM
// 标记 update flag

// completeWork 性能优化策略
// flags 分布在 不同的fiberNode 中，如何快速找到他们？
// 答案：利用completeWork 向上遍历的流程，将子 fiberNode 的flags 冒泡到 父fiberNode

import { FiberNode } from './fiber';
import {
	ContextProvider,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance,
	Instance
} from 'hostConfig';
import { NoFlags, Ref, Update } from './fiberFlags';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

export const completeWork = (wip: FiberNode) => {
	// 递归的 归阶段
	const newProps = wip.pendingProps;
	const current = wip.alternate;
	switch (wip.tag) {
		case HostComponent: {
			if (current !== null && wip.stateNode) {
				// todo update
				// 可能发生属性变化  比如 className 的变化
				// 1. props 是否变化
				// 2. 变了 update flag
				markUpdate(wip);
				if (current.ref !== wip.ref) {
					markRef(wip);
				}
			} else {
				// mount
				// 1.构建DOM
				const instance = createInstance(wip.type, newProps);
				// 2.将DOM 插入到DOM 树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;

				if (wip.ref !== null) {
					markRef(wip);
				}
			}
			bubbleProperties(wip);
			return null;
		}
		case HostText: {
			if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizedProps.content;
				const nextText = newProps.content;
				if (oldText !== nextText) {
					// 将 fiber 添加 更新标记
					markUpdate(wip);
				}
			} else {
				// 1.构建DOM
				const instance = createTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		}
		case HostRoot: {
			bubbleProperties(wip);
			return null;
		}
		case FunctionComponent: {
			bubbleProperties(wip);
			return null;
		}
		case ContextProvider: {
			bubbleProperties(wip);
			return null;
		}
		default: {
			if (__DEV__) {
				console.warn('未处理的 completeWork', wip);
			}
			break;
		}
	}
};

function markRef(fiber: FiberNode) {
	fiber.flags |= Ref;
}
function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
	let node = wip.child;
	while (node !== null) {
		if (node?.tag === HostComponent || node?.tag === HostText) {
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
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	let subTreeFlags = NoFlags;
	let child = wip.child;
	while (child !== null) {
		// subTreeFlags 包含当前节点 子节点的 flags
		subTreeFlags |= child.subTreeFlags;
		// subTreeFlags 包含当前节点的flags
		subTreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}
	wip.subTreeFlags = subTreeFlags;
}
