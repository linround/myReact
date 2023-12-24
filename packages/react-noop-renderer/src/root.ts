// ReactDOM.createRoot(root).render(<App />)
import { Container, Instance } from './hostConfig';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';

let idCounter = 0;
export function createRoot() {
	const container = {
		rootID: idCounter++,
		children: []
	};

	// @ts-ignore
	const root = createContainer(container);
	function getChildren(parent: Container | Instance) {
		if (parent) {
			return parent.children;
		}
		return null;
	}

	function getChildrenAsJSX(root: Container) {
		const children = childToJSX(getChildren(root));
		if (Array.isArray(children)) {
			return {
				$$typeof: REACT_ELEMENT_TYPE,
				type: REACT_FRAGMENT_TYPE,
				key: null,
				ref: null,
				props: { children },
				_mark: 'Lin'
			};
		}
		return children;
	}
	function childToJSX(child: any): any {
		if (typeof child === 'string' || typeof child === 'number') {
			return child;
		}

		if (Array.isArray(child)) {
			if (child.length === 0) {
				return null;
			}
			if (child.length === 1) {
				return childToJSX(child[0]);
			}

			const children = child.map(childToJSX);
			if (
				children.every(
					(child) => typeof child === 'string' || typeof child === 'number'
				)
			) {
				return children.join('');
			}

			// [TextInstance Instance]
			return children;
		}

		// instance
		if (Array.isArray(child.children)) {
			const instance: Instance = child;
			const children = childToJSX(instance.children);
			const props = instance.props;

			if (children !== null) {
				props.children = children;
			}

			return {
				$$typeof: REACT_ELEMENT_TYPE,
				type: instance.type,
				key: null,
				ref: null,
				props,
				_mark: 'Lin'
			};
		}

		// TextInstance
		return child.text;
	}

	return {
		render(element: ReactElementType) {
			return updateContainer(element, root);
		},
		getChildren() {
			// 返回的时树状结构
			return getChildren(container);
		},
		getChildrenAsJSX() {
			// reactElement 的树状结构
			return getChildrenAsJSX(container);
		}
	};
}
