import { ReactContext } from 'shared/ReactSymbols';
import { FiberNode } from './fiber';
import {
	includeSomeLanes,
	isSubsetOfLanes,
	Lane,
	mergeLane,
	NoLane,
	NoLanes
} from './fiberLanes';
import { markWipReceiveUpdate } from './beginWork';
import { ContextProvider } from './workTags';

let lastContextDep: ContextItem<any> | null = null;

export interface ContextItem<Value> {
	context: ReactContext<Value>;
	memoizedState: Value;
	next: ContextItem<Value> | null;
}

let preContextValue: any = null;
const preContextValueStack: any[] = [];

export function pushProvider<T>(context: ReactContext<T>, newValue: T) {
	preContextValueStack.push(preContextValue); // [1]
	preContextValue = context._currentValue; // 2
	context._currentValue = newValue; // 3
}

// 这里 push 一个 preContextValue
// 再该变 preContextValue
// 为 _currentValue 赋新值 preContextValue

// _currentValue 又被赋值为上一次的
export function popProvider<T>(context: ReactContext<T>) {
	// 2
	context._currentValue = preContextValue; /*上一个 context._currentValue*/
	preContextValue = preContextValueStack.pop(); //1
}

export function prepareToReadContext(wip: FiberNode, renderLane: Lane) {
	lastContextDep = null;

	const deps = wip.dependencies;
	if (deps !== null) {
		const firstContext = deps.firstContext;
		if (firstContext !== null) {
			if (includeSomeLanes(deps.lanes, renderLane)) {
				markWipReceiveUpdate();
			}
			deps.firstContext = null;
		}
	}
}
export function readContext<T>(
	consumer: FiberNode | null,
	context: ReactContext<T>
): T {
	if (consumer === null) {
		throw new Error('只能在函数组件中调用');
	}
	const value = context._currentValue;
	// 建立fiber => context
	const contextItem: ContextItem<T> = {
		context,
		next: null,
		memoizedState: value
	};

	if (lastContextDep === null) {
		lastContextDep = contextItem;
		consumer.dependencies = {
			firstContext: contextItem,
			lanes: NoLanes
		};
	} else {
		lastContextDep = lastContextDep.next = contextItem;
	}

	return value;
}

export function propagateContextChange<T>(
	wip: FiberNode,
	context: ReactContext<T>,
	renderLane: Lane
) {
	let fiber = wip.child;
	if (fiber !== null) {
		fiber.return = wip;
	}
	while (fiber !== null) {
		let nextFiber = null;
		const deps = fiber.dependencies;
		if (deps !== null) {
			// todo
			nextFiber = fiber.child;
			let contextItem = deps.firstContext;
			while (contextItem !== null) {
				if (contextItem.context === context) {
					// 找到了
					fiber.lanes = mergeLane(fiber.lanes, renderLane);
					const alternate = fiber.alternate;
					if (alternate !== null) {
						alternate.lanes = mergeLane(alternate.lanes, renderLane);
					}
					//  向上标记
					scheduleContextWorkOnParentPath(fiber.return, wip, renderLane);
					deps.lanes = mergeLane(deps.lanes, renderLane);
					break;
				}
				contextItem = contextItem.next;
			}
		} else if (fiber.tag === ContextProvider) {
			nextFiber = fiber.type === wip.type ? null : fiber.child;
		} else {
			nextFiber = fiber.child;
		}

		if (nextFiber !== null) {
			nextFiber.return = fiber;
		} else {
			// 到了叶子节点
			nextFiber = fiber;
			while (nextFiber !== null) {
				if (nextFiber === wip) {
					nextFiber = null;
					break;
				}
				const sibling = nextFiber.sibling;
				if (sibling !== null) {
					sibling.return = nextFiber.return;
					nextFiber = sibling;
					break;
				}
				nextFiber = nextFiber.return;
			}
		}
		fiber = nextFiber;
	}
}

export function scheduleContextWorkOnParentPath(
	from: FiberNode | null,
	to: FiberNode,
	renderLane: Lane
) {
	let node = from;

	while (node !== null) {
		const alternate = node.alternate;
		if (!isSubsetOfLanes(node.childLanes, renderLane)) {
			node.childLanes = mergeLane(node.childLanes, renderLane);
			if (alternate !== null) {
				alternate.childLanes = mergeLane(alternate.childLanes, renderLane);
			}
		} else if (
			alternate !== null &&
			!isSubsetOfLanes(alternate.childLanes, renderLane)
		) {
			alternate.childLanes = mergeLane(alternate.childLanes, renderLane);
		}

		if (node === to) {
			break;
		}
		node = node.return;
	}
}
