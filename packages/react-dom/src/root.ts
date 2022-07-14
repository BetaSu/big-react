import { Container } from './hostConfig';
import {
	updateContainer,
	createContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElement } from 'shared/ReactTypes';
import { initEvent } from './SyntheticEvent';

export function createRoot(container: Container) {
	const root = createContainer(container);
	return {
		render(element: ReactElement) {
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
