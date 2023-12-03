// 与React-DOM相关的事件系统

import { Props } from 'shared/ReactTypes';
import { Container } from 'hostConfig';

export const elementPropsKey = '__props';
// 合法的事件系统
const validEventTypeList = ['click'];

type EventCallback = (e: Event) => void;
interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}
export interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}
export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}
// dom[xxx] = reactElement props
export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}
export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('当前不支持', eventType, '事件');
		return;
	}

	if (__DEV__) {
		console.log('初始化事件');
	}
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

function createSyntheticEvent(e: Event) {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;
	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};
	return syntheticEvent;
}
function dispatchEvent(container: Container, eventType: string, e: Event) {
	const targetElement = e.target; // 事件绑定的元素

	if (targetElement === null) {
		console.warn('事件不存在 target', e);
		return;
	}
	// 1. 收集沿途的事件
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	// 2. 构造合成事件
	const se = createSyntheticEvent(e);
	// 3. 遍历capture
	triggerEventFlow(capture, se);

	if (!se.__stopPropagation) {
		// 4. 遍历 bubble
		triggerEventFlow(bubble, se);
	}
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);
		if (se.__stopPropagation) {
			break;
		}
	}
}
function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick'] // 捕获和冒泡阶段
	}[eventType];
}
function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
): Paths {
	const paths: Paths = {
		capture: [],
		bubble: []
	};
	while (targetElement && targetElement !== container) {
		// 收集
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						if (i === 0) {
							// 将事件保存到 捕获列表中
							paths.capture.unshift(eventCallback);
						} else {
							// 将事件保存到 冒泡列表中
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}

		targetElement = targetElement.parentElement as unknown as DOMElement;
	}

	return paths;
}
