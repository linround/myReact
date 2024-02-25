import { ReactContext } from './ReactSymbols';

export type Type = any;
export type Key = any;
export type Ref = { current: any } | ((instance: any) => void);
export type ElementType = any;
export type Props = {
	[key: string]: any;
	children?: any;
};
export interface ReactElementType {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: string;
}
export type Action<State> = State | ((preState: State) => State);

export type Usable<T> = Thenable<T> | ReactContext<T>;

export interface Wakeable<Result> {
	then(
		onFulfilled: () => Result,
		onRejected: () => Result
	): void | Wakeable<Result>;
}
// untracked
// pending
// fulfilled
// rejected
export interface ThenableImpl<T, Result, Err> {
	then(
		onFulfilled: () => Result,
		onRejected: (error: Err) => Result
	): void | Wakeable<Result>;
}

export interface UntrackedThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status?: void;
}
export interface PendingThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'pending';
}
export interface FulfilledThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'fulfilled';
	value: T;
}
export interface RejectedThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'rejected';
	reason: Err;
}

export type Thenable<T, Result = void, Err = any> =
	| UntrackedThenable<T, Result, Err>
	| PendingThenable<T, Result, Err>
	| FulfilledThenable<T, Result, Err>
	| RejectedThenable<T, Result, Err>;
