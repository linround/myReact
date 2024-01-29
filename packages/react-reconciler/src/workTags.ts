export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof ContextProvider;
export const FunctionComponent = 0;
export const HostRoot = 3;
export const HostComponent = 5;

export const HostText = 6;

export const ContextProvider = 8;
