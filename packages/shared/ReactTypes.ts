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
