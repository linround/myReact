import {
	createWorkInProgress,
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects
} from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestroy,
	commitHookEffectListUnmount,
	commitLayoutEffects,
	commitMutationEffects
} from './commitWork';
import {
	getHighestPriorityLane,
	getNextLane,
	Lane,
	laneToSchedulerPriority,
	markRootFinished,
	markRootSuspended,
	mergeLane,
	NoLane,
	SyncLane
} from './fiberLanes';
import { flushSyncCallback, scheduleSyncCallback } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority,
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_shouldYield,
	unstable_cancelCallback
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';
import { getSuspendedThenable, SuspenseException } from './thenable';
import { resetHooksOnUnwind } from './fiberHooks';
import { throwException } from './fiberThrow';
import { unwindWork } from './fiberUnwindWork';

let workInProgress: FiberNode | null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffects: boolean = false;

type RootExitStatus = number;

// 工作中的状态
const RootInProgress = 0;

// 并发更新 中途打断
const RootInComplete = 1;

// render 完成
const RootCompleted = 2;

// 由于挂起，当前是未完成的状态，不用进入 commit 阶段
const RootDidNotComplete = 3;

let wipRootExitStatus: number = RootInProgress;

type SuspendedReason = typeof NotSuspended | typeof SuspendedOnData;
const NotSuspended = 0;
const SuspendedOnData = 1;
let wipSuspendedReason: SuspendedReason = NotSuspended;
let wipThrowValue: any = null;

// todo 执行过程中报错了

function preparereFreshStack(root: FiberRootNode, lane: Lane) {
	root.finishedLane = NoLane;
	root.finishedWork = null;
	// 创建待渲染的 workInProgress fiber
	workInProgress = createWorkInProgress(root.current, {});
	wipRootRenderLane = lane;

	wipRootExitStatus = RootInProgress;
	wipSuspendedReason = NotSuspended;
	wipThrowValue = null;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// todo 调度功能
	const root = markUpdateLaneFromFiberToRoot(fiber, lane);
	markRootUpdate(root, lane);
	ensureRootIsScheduled(root);

	// renderRoot(root);
}

export function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getNextLane(root);
	const existingCallback = root.callbackNode;

	if (updateLane === NoLane) {
		if (existingCallback !== null) {
			unstable_cancelCallback(existingCallback);
		}
		root.callbackNode = null;
		root.callbackPriority = NoLane;
		return;
	}

	const curPriority = updateLane;
	const prevPriority = root.callbackPriority;

	if (curPriority === prevPriority) {
		return;
	}

	if (existingCallback !== null) {
		unstable_cancelCallback(existingCallback);
	}
	let newCallbackNode = null;

	if (__DEV__) {
		console.log(
			`在${updateLane === SyncLane ? '微' : '宏'}任务中调度，优先级：`,
			updateLane
		);
	}
	if (updateLane === SyncLane) {
		// 同步优先级 用微任务 调度
		// 将 该函数 放入 syncQueue
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
		// 使用微任务 执行 syncQueue 中的函数
		scheduleMicroTask(flushSyncCallback);
	} else {
		// 其他优先级 用宏任务 调度
		const schedulerPriority = laneToSchedulerPriority(updateLane);
		newCallbackNode = scheduleCallback(
			schedulerPriority,
			// @ts-ignore
			performConcurrentWorkOnRoot.bind(null, root)
		);
	}
	root.callbackNode = newCallbackNode;
	root.callbackPriority = curPriority;
}

// 标记当前的lane
export function markRootUpdate(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLane(root.pendingLanes, lane);
}

// 找到 fiberRootNode
function markUpdateLaneFromFiberToRoot(fiber: FiberNode, lane: Lane) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		parent.childLanes = mergeLane(parent.childLanes, lane);
		const alternate = parent.alternate;
		if (alternate !== null) {
			alternate.childLanes = mergeLane(alternate.childLanes, lane);
		}

		node = parent;
		parent = node.return;
	}

	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function performConcurrentWorkOnRoot(
	root: FiberRootNode,
	didTimeout?: boolean
): any {
	// 保证 useEffect 回调执行
	const curCallback = root.callbackNode;
	const didFlushPassiveEffect = flushPassiveEffects(root.pendingPassiveEffects);
	if (didFlushPassiveEffect) {
		if (root.callbackNode !== curCallback) {
			return null;
		}
	}

	const lane = getNextLane(root);
	const currentCallbackNode = root.callbackNode;
	if (lane === NoLane) {
		return null;
	}
	const needSync = lane === SyncLane || didTimeout;
	// render 阶段
	const exitStatus = renderRoot(root, lane, !needSync);

	switch (exitStatus) {
		case RootInProgress:
			// 中断
			if (root.callbackNode !== currentCallbackNode) {
				return null;
			}
			return performConcurrentWorkOnRoot.bind(null, root);
		case RootCompleted:
			const finishedWork = root.current.alternate;
			root.finishedWork = finishedWork;
			root.finishedLane = lane;
			wipRootRenderLane = NoLane;

			commitRoot(root);
			break;
		case RootDidNotComplete:
			wipRootRenderLane = NoLane;
			markRootSuspended(root, lane);
			ensureRootIsScheduled(root);
			break;
		default:
			if (__DEV__) {
				console.error('还未实现并发更新结束状态');
			}
			break;
	}
}

// 从fiberRootNode 开始进行渲染
function performSyncWorkOnRoot(root: FiberRootNode) {
	const nextLane = getNextLane(root);
	if (nextLane !== SyncLane) {
		// 其他比 SyncLane 低的优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}

	const exitStatus = renderRoot(root, nextLane, false);

	switch (exitStatus) {
		case RootCompleted:
			const finishedWork = root.current.alternate;
			root.finishedWork = finishedWork;
			root.finishedLane = nextLane;
			wipRootRenderLane = NoLane;

			// 更具 wip fiberNode 树中的flags 进行 DOM操作
			commitRoot(root);
			break;
		case RootDidNotComplete:
			wipRootRenderLane = NoLane;

			markRootSuspended(root, nextLane);
			ensureRootIsScheduled(root);
			break;
		default:
			if (__DEV__) {
				console.error('还未实现同步更新结束状态');
			}
			break;
	}
}

function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: boolean) {
	if (__DEV__) {
		console.log(`开始${shouldTimeSlice ? '并发' : '同步'}更新`, root);
	}

	if (wipRootRenderLane !== lane) {
		// 初始化
		preparereFreshStack(root, lane);
	}
	do {
		try {
			if (wipSuspendedReason !== NotSuspended && workInProgress !== null) {
				const throwValue = wipThrowValue;
				wipSuspendedReason = NotSuspended;
				wipThrowValue = null;
				// unwind
				throwAndUnwindWorkLoop(root, workInProgress, throwValue, lane);
			}
			// 进入 递归过程
			shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop发生错误');
			}
			handleThrow(root, e);
		}
	} while (true);

	if (wipRootExitStatus !== RootInProgress) {
		return wipRootExitStatus;
	}

	// 中断执行
	if (shouldTimeSlice && workInProgress !== null) {
		return RootInComplete;
	}
	// render 阶段执行完成
	if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
		console.error('render 阶段执行结束时 wip不应该是 null');
	}
	return RootCompleted;
}

function throwAndUnwindWorkLoop(
	root: FiberRootNode,
	unitOfWork: FiberNode,
	throwValue: any,
	lane: Lane
) {
	// 重置FC全局变量
	resetHooksOnUnwind();
	// 请求返回后 重新触发更新
	throwException(root, throwValue, lane);
	// unwind
	unwindUnitOfWork(unitOfWork);
}

function unwindUnitOfWork(unitOfWork: FiberNode) {
	let incompleteWork: FiberNode | null = unitOfWork;
	do {
		const next = unwindWork(incompleteWork);
		if (next !== null) {
			workInProgress = next;
			return;
		}

		const returnFiber = incompleteWork.return as FiberNode;
		if (returnFiber !== null) {
			returnFiber.deletions = null;
		}
		incompleteWork = returnFiber;
	} while (incompleteWork !== null);

	// 使用了 use 抛出了data ,但是没有定义suspense
	wipRootExitStatus = RootDidNotComplete;
	workInProgress = null;
}
function handleThrow(root: FiberRootNode, thrownValue: any) {
	// Error Boundary

	if (thrownValue === SuspenseException) {
		thrownValue = getSuspendedThenable();
		wipSuspendedReason = SuspendedOnData;
	}

	wipThrowValue = thrownValue;
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

	if (
		(finishedWork.flags & PassiveMask) !== NoFlags ||
		(finishedWork.subTreeFlags & PassiveMask) !== NoFlags
	) {
		if (!rootDoesHasPassiveEffects) {
			rootDoesHasPassiveEffects = true;
			// 调度 effect
			// 在一个setTimeout 中执行回调函数
			scheduleCallback(NormalPriority, () => {
				// 执行 effect
				flushPassiveEffects(root.pendingPassiveEffects);
				return;
			});
		}
	}

	// 判断三个子阶段 需要执行的操作
	// root flags  root subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subTreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation Placement
		commitMutationEffects(finishedWork, root);

		root.current = finishedWork;

		// 阶段3  Layout
		commitLayoutEffects(finishedWork, root);

		// layout
	} else {
		root.current = finishedWork;
	}

	rootDoesHasPassiveEffects = false;
	ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
	let didFlushPassiveEffect = false;

	// 先执行完成 所有的destroy 回调
	pendingPassiveEffects.unmount.forEach((effect) => {
		didFlushPassiveEffect = true;
		commitHookEffectListUnmount(Passive, effect);
	});
	pendingPassiveEffects.unmount = [];

	pendingPassiveEffects.update.forEach((effect) => {
		didFlushPassiveEffect = true;
		commitHookEffectListDestroy(Passive | HookHasEffect, effect);
	});

	// 本次更新的任何回调 都必须在所有上一次 更新的 destroy 回调执行完之后 再执行
	pendingPassiveEffects.update.forEach((effect) => {
		didFlushPassiveEffect = true;
		commitHookEffectListCreate(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update = [];

	// 回调的过程也可能触发更新
	flushSyncCallback();
	return didFlushPassiveEffect;
}

function workLoopSync() {
	while (workInProgress !== null) {
		// 进行递归渲染
		performUnitOfWork(workInProgress);
	}
}
function workLoopConcurrent() {
	while (workInProgress !== null && !unstable_shouldYield()) {
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
