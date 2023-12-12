import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags } from './fiberFlags';
import { commitMutationEffects } from './commitWork';
import {
	getHighestPriorityLane,
	Lane,
	markRootFinished,
	mergeLane,
	NoLane,
	SyncLane
} from './fiberLanes';
import { flushSyncCallback, scheduleSyncCallback } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';

let workInProgress: FiberNode | null;
let wipRootRenderLane: Lane = NoLane;
function preparereFreshStack(root: FiberRootNode, lane: Lane) {
	// 创建待渲染的 workInProgress fiber
	workInProgress = createWorkInProgress(root.current, {});
	wipRootRenderLane = lane;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// todo 调度功能
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdate(root, lane);
	ensureRootIsScheduled(root);

	// renderRoot(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	if (updateLane === NoLane) {
		return;
	}
	if (updateLane === SyncLane) {
		// 同步优先级 用微任务 调度
		if (__DEV__) {
			console.log('在微任务中调度，优先级：', updateLane);
		}
		// 将 该函数 放入 syncQueue
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		// 使用微任务 执行 syncQueue 中的函数
		scheduleMicroTask(flushSyncCallback);
	} else {
		// 其他优先级 用宏任务 调度
	}
}

// 标记当前的lane
function markRootUpdate(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLane(root.pendingLanes, lane);
}

// 找到 fiberRootNode
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

// 从fiberRootNode 开始进行渲染
function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);
	if (nextLane !== SyncLane) {
		// 其他比 SyncLane 低的优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}

	// 初始化
	preparereFreshStack(root, lane);
	do {
		try {
			// 进入 递归过程
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop发生错误');
			}
			workInProgress = null;
		}
	} while (true);
	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;
	wipRootRenderLane = NoLane;

	// 更具 wip fiberNode 树中的flags 进行 DOM操作
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;
	if (finishedWork === null) {
		return;
	}
	if (__DEV__) {
		console.warn('commit阶段开始', finishedWork);
	}
	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.error('commit 阶段 finishedLane 不应该NoLane');
	}

	// 重置
	root.finishedWork = null;
	root.finishedLane = NoLane;
	markRootFinished(root, lane);

	// 判断三个子阶段 需要执行的操作
	// root flags  root subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subTreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation Placement
		commitMutationEffects(finishedWork);

		root.current = finishedWork;

		// layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		// 进行递归渲染
		performUnitOfWork(workInProgress);
	}
}

// 进行递归渲染
function performUnitOfWork(fiber: FiberNode) {
	// 进入递阶段
	const next = beginWork(fiber, wipRootRenderLane);

	fiber.memoizedProps = fiber.pendingProps;
	if (next === null) {
		// 进入归阶段
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}
function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
