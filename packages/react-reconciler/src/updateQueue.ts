import { Action } from 'shared/ReactTypes';
import { Dispatch } from 'react/src/currentDispatcher';
import { isSubsetOfLanes, Lane, mergeLane, NoLane } from './fiberLanes';
import { FiberNode } from './fiber';

export interface Update<State> {
	action: Action<State>;
	lane: Lane;
	next: Update<any> | null;
}
export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}
export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane // 代表update 自身的优先级
): Update<State> => {
	return {
		action,
		lane,
		next: null
	};
};
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>,
	fiber: FiberNode,
	lane: Lane
) => {
	const pending = updateQueue.shared.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;

	fiber.lanes = mergeLane(fiber.lanes, lane);

	const alternate = fiber.alternate;
	if (alternate !== null) {
		alternate.lanes = mergeLane(alternate.lanes, lane);
	}
};

export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane,
	onSkipUpdate?: <State>(update: Update<State>) => void
): {
	memoizedState: State;
	baseState: State;
	baseQueue: Update<State> | null;
} => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState,
		baseState,
		baseQueue: null
	};
	if (pendingUpdate !== null) {
		// 第一个update
		let first = pendingUpdate.next;
		let pending = pendingUpdate.next as Update<any>;

		let newBaseState = baseState;
		let newBaseQueueFirst: Update<State> | null = null;
		let newBaseQueueLast: Update<State> | null = null;
		let newState = baseState;

		do {
			const updateLane = pending.lane;
			if (!isSubsetOfLanes(updateLane, renderLane)) {
				// 优先级不够 被跳过
				const clone = createUpdate(pending.action, pending.lane);

				onSkipUpdate?.(clone);
				// 是不是第一个被跳过的
				if (newBaseQueueFirst === null) {
					newBaseQueueFirst = clone;
					newBaseQueueLast = clone;
					newBaseState = newState;
				} else {
					(newBaseQueueLast as Update<State>).next = clone;
					newBaseQueueLast = clone;
				}
			} else {
				// 优先级足够

				if (newBaseQueueLast !== null) {
					const clone = createUpdate(pending.action, NoLane);
					newBaseQueueLast.next = clone;
					newBaseQueueLast = clone;
				}

				const action = pendingUpdate.action;
				if (action instanceof Function) {
					newState = action(baseState);
				} else {
					newState = action;
				}
			}
			pending = pending?.next as Update<any>;
		} while (pending !== first);

		if (newBaseQueueLast === null) {
			// 本次计算没有 update 被跳过
			newBaseState = newState;
		} else {
			newBaseQueueLast.next = newBaseQueueFirst;
		}
		result.memoizedState = newState;
		result.baseState = newBaseState;
		result.baseQueue = newBaseQueueLast;
	}
	return result;
};
