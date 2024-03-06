const supportSymbol = typeof Symbol === 'function';
export const REACT_ELEMENT_TYPE = 0xeac7;
export const REACT_FRAGMENT_TYPE = 0xeacb;
export const REACT_CONTEXT_TYPE = 0xeacc;
export const REACT_PROVIDER_TYPE = 0xeac2;
export const REACT_SUSPENSE_TYPE = 0xeac3;
export const REACT_MEMO_TYPE = 0xeac4;

export type ReactContext<T> = {
	$$typeof: symbol | number;
	Provider: ReactProviderType<T> | null;
	_currentValue: T;
};

export type ReactProviderType<T> = {
	$$typeof: symbol | number;
	_context: ReactContext<T> | null;
};
