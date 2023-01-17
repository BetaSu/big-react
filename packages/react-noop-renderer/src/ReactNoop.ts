import { ReactElement } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import Reconciler from 'react-reconciler';
import * as Scheduler from 'scheduler';
import { Container, Instance } from './hostConfig';

let idCounter = 0;

export function createRoot() {
	const container: Container = {
		rootID: idCounter++,
		children: []
	};
	const root = Reconciler.createContainer(container);

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
				__mark: 'KaSong'
			};
		}
		return children;
	}

	// 递归将整棵子树变为JSX
	function childToJSX(child: any): any {
		if (['string', 'number'].includes(typeof child)) {
			return child;
		}
		if (Array.isArray(child)) {
			if (child.length === 0) {
				return null;
			}
			if (child.length === 1) {
				return childToJSX(child[0]);
			}
			const children: any = child.map(childToJSX);
			// 如果每个child都是文本节点，将他们连接在一起形成string
			if (children.every((c: any) => ['string', 'number'].includes(typeof c))) {
				return children.join('');
			}
			// 混合了Instance与TextInstance，应该用Fragment处理
			return children;
		}
		// 这是Instance
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
				__mark: 'KaSong'
			};
		}
		// 这是TextInstance
		return child.text;
	}

	return {
		// 用于jest-react
		_Scheduler: Scheduler,
		getChildren() {
			return getChildren(container);
		},
		getChildrenAsJSX() {
			return getChildrenAsJSX(container);
		},
		render(children: ReactElement) {
			Reconciler.updateContainer(children, root);
		}
	};
}
