import { Action } from 'shared/ReactTypes';
import { ReactContext } from 'shared/ReactSymbols';

export interface Dispatcher {
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
	useEffect: (calback: () => void | void, deps: any[] | void) => void;
	useTransition: () => [boolean, (callback: () => void) => void];
	useRef: <T>(initialValue: T) => { current: T };
	useContext: <T>(context: ReactContext<T>) => T;
}
export type Dispatch<State> = (action: Action<State>) => void;
const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};
export default currentDispatcher;
export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;
	if (dispatcher === null) {
		throw new Error('hook 只能在函数组件中执行');
	}
	return dispatcher;
};
