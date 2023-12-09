import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import { updateFiberProps, DOMElement } from './SyntheticEvent';
import { Props } from 'shared/ReactTypes';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
export const createInstance = (type: string, props: Props): Instance => {
	// todo  处理props
	const element = document.createElement(type) as unknown;
	updateFiberProps(element as DOMElement, props);
	return element as DOMElement;
};
export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};
export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};
export const appendChildToContainer = appendInitialChild;

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode, text);

		default:
			if (__DEV__) {
				console.warn('为实现的Update 类型', fiber);
			}
			break;
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}

export function insertChildToContainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	container.insertBefore(child, before);
}
