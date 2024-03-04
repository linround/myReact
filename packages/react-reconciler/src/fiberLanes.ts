import { FiberRootNode } from './fiber';
import {
	unstable_getCurrentPriorityLevel,
	unstable_IdlePriority,
	unstable_ImmediatePriority,
	unstable_NormalPriority,
	unstable_UserBlockingPriority
} from 'scheduler';
import ReactCurrentBatchConfig from 'react/src/currentBatchConfig';

export type Lane = number;
export type Lanes = number;
export const SyncLane = 0b00001;
export const NoLane = 0b00000;
export const NoLanes = 0b00000;
export const InputContinuousLane = 0b00010; // 连续的输入事件
export const DefaultLane = 0b00100;
export const TransitionLane = 0b01000;
export const IdleLane = 0b10000;

export function mergeLane(laneA: Lane, laneB: Lane): Lanes {
	return laneA | laneB;
}

// 运行流程在react 时，使用的时 lane 模型
// 运行流程在 scheduler 时，使用的是优先级

// 所以需要实现两者的转换
export function requestUpdateLanes() {
	const isTransition = ReactCurrentBatchConfig.transition !== null;
	if (isTransition) {
		return TransitionLane;
	}

	// 从上下文环境中获取 scheduler 优先级
	const currentSchedulerPriority = unstable_getCurrentPriorityLevel();
	const lane = schedulerPriorityToLane(currentSchedulerPriority);

	return lane;
}

export function getHighestPriorityLane(lanes: Lanes) {
	return lanes & -lanes;
}

// 即两个 完全相同的 lane
export function isSubsetOfLanes(set: Lanes, subset: Lane) {
	return (set & subset) === subset;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;

	root.suspendedLanes = NoLane;
	root.pingLanes = NoLane;
}

export function laneToSchedulerPriority(lanes: Lanes) {
	const lane = getHighestPriorityLane(lanes);

	if (lane === SyncLane) {
		return unstable_ImmediatePriority;
	}
	if (lane === InputContinuousLane) {
		return unstable_UserBlockingPriority;
	}
	if (lane === DefaultLane) {
		return unstable_NormalPriority;
	}
	return unstable_IdlePriority;
}

export function schedulerPriorityToLane(schedulerPriority: number): Lane {
	if (schedulerPriority === unstable_ImmediatePriority) {
		return SyncLane;
	}
	if (schedulerPriority === unstable_UserBlockingPriority) {
		return InputContinuousLane;
	}
	if (schedulerPriority === unstable_NormalPriority) {
		return DefaultLane;
	}
	return NoLane;
}

export function markRootSuspended(root: FiberRootNode, suspendedLane: Lane) {
	root.suspendedLanes |= suspendedLane;
	root.pendingLanes &= ~suspendedLane;
}
export function markRootPinged(root: FiberRootNode, pingedLane: Lane) {
	root.pingLanes |= root.suspendedLanes & pingedLane;
}

export function getNextLane(root: FiberRootNode): Lane {
	const pendingLanes = root.pendingLanes;
	if (pendingLanes === NoLane) {
		return NoLane;
	}
	let nextLane = NoLane;

	const suspendedLanes = pendingLanes & ~root.suspendedLanes;
	if (suspendedLanes !== NoLane) {
		nextLane = getHighestPriorityLane(suspendedLanes);
	} else {
		const pingedLanes = pendingLanes & root.pingLanes;
		if (pingedLanes !== NoLanes) {
			nextLane = getHighestPriorityLane(pingedLanes);
		}
	}
	return nextLane;
}
export function includeSomeLanes(set: Lanes, subset: Lane | Lanes): boolean {
	return (set & subset) !== NoLanes;
}

export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
	return set & ~subset;
}
