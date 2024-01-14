import { FiberRootNode } from './fiber';
import {
	unstable_getCurrentPriorityLevel,
	unstable_IdlePriority,
	unstable_ImmediatePriority,
	unstable_NormalPriority,
	unstable_UserBlockingPriority
} from 'scheduler';
import { sync } from 'rimraf';

export type Lane = number;
export type Lanes = number;
export const SyncLane = 0b0001;
export const NoLane = 0b0000;
export const NoLanes = 0b0000;
export const InputContinuousLane = 0b0010; // 连续的输入事件
export const DefaultLane = 0b0100;
export const IdleLane = 0b1000;

export function mergeLane(laneA: Lane, laneB: Lane): Lanes {
	return laneA | laneB;
}

// 运行流程在react 时，使用的时 lane 模型
// 运行流程在 scheduler 时，使用的是优先级

// 所以需要实现两者的转换
export function requestUpdateLanes() {
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
