// 需要解决的问题：
// 对于host 类型的 fiberNode ：构建离屏DOM
// 标记 update flag

// completeWork 性能优化策略
// flags 分布在 不同的fiberNode 中，如何快速找到他们？
// 答案：利用completeWork 向上遍历的流程，将子 fiberNode 的flags 冒泡到 父fiberNode

import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { NoFlags } from './fiberFlags';

export const completeWork = (wip: FiberNode) => {
	// 递归的 归阶段
	const newProps = wip.pendingProps;
	const current = wip.alternate;
	switch (wip.tag) {
		case HostComponent: {
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// 1.构建DOM
				const instance = createInstance(wip.type, newProps);
				// 2.将DOM 插入到DOM 树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		}
		case HostText: {
			if (current !== null && wip.stateNode) {
				// update
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
		default: {
			if (__DEV__) {
				console.warn('未处理的 completeWork', wip);
			}
			break;
		}
	}
};
function appendAllChildren(parent: Container, wip: FiberNode) {
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
