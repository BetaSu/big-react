import { Container } from './hostConfig';
import {
	updateContainer,
	createContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElement } from 'shared/ReactTypes';
import { initEvent, elementPropsKey } from './SyntheticEvent';

const containerToRoot = new Map();

function clearContainerDOM(container: Container) {
	if (!container.hasChildNodes()) {
		return;
	}
	for (let i = 0; i < container.childNodes.length; i++) {
		const childNode = container.childNodes[i];
		if (!Object.hasOwnProperty.call(childNode, elementPropsKey)) {
			container.removeChild(childNode);
			// 当移除节点时，再遍历时length会减少，所以相应i需要减少一个
			i--;
		}
	}
}

export function createRoot(container: Container) {
	let root = containerToRoot.get(container);
	if (!root) {
		root = createContainer(container);
		containerToRoot.set(container, root);
	} else {
		throw '你在之前已经传递给createRoot()的container上调用了ReactDOM.createRoot()';
	}
	return {
		render(element: ReactElement) {
			if (containerToRoot.get(container) !== root) {
				throw '不能更新一个卸载的root.';
			}
			clearContainerDOM(container);
			initEvent(container, 'click');
			return updateContainer(element, root);
		},
		unmount() {
			containerToRoot.delete(container);
			return updateContainer(null, root);
		}
	};
}
