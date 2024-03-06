import { FiberNode } from 'react-reconciler/src/fiber';
import { Props } from 'shared/ReactTypes';
import { REACT_MEMO_TYPE } from 'shared/ReactSymbols';
export function memo(
	type: FiberNode['type'],
	compare?: (oldProps: Props, newProps: Props) => boolean
) {
	const fiberType = {
		$$typeof: REACT_MEMO_TYPE,
		type,
		compare: compare === undefined ? null : compare
	};
	// memo fiber.type
	return fiberType;
}
