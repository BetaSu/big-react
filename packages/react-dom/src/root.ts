import { Container } from './hostConfig';
import {
	updateContainer,
	createContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElement } from 'shared/ReactTypes';
import { initEvent } from './SyntheticEvent';

const containerToRoot = new Map();

export function createRoot(container: Container) {
	let root = containerToRoot.get(container);
	if (!root) {
		root = createContainer(container);
		containerToRoot.set(container, root);
	}
	return {
		render(element: ReactElement) {
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
