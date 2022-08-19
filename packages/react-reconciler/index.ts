import { createContainer, updateContainer } from './src/fiberReconciler';

export interface Reconciler {
	createContainer: typeof createContainer;
	updateContainer: typeof updateContainer;
}

export default {
	createContainer,
	updateContainer
} as Reconciler;
