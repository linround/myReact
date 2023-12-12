import { Action } from 'shared/ReactTypes';
import { Dispatch } from 'react/src/currentDispatcher';
import { Lane } from './fiberLanes';

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
	update: Update<State>
) => {
	const pending = updateQueue.shared.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;
};

export const processUpdateQueue = <State>(
	baseUpdate: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseUpdate
	};
	if (pendingUpdate !== null) {
		// 第一个update
		let first = pendingUpdate.next;
		let pending = pendingUpdate.next as Update<any>;
		do {
			const updateLane = pending.lane;
			if (updateLane === renderLane) {
				const action = pendingUpdate.action;
				if (action instanceof Function) {
					baseUpdate = action(baseUpdate);
				} else {
					baseUpdate = action;
				}
			} else {
				if (__DEV__) {
					console.error('不应该进入 updateLane !== renderLane 这个逻辑');
				}
			}
			pending = pending?.next as Update<any>;
		} while (pending !== first);
	}
	result.memoizedState = baseUpdate;
	return result;
};
