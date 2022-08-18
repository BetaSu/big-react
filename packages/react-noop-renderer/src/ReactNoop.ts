import { ReactElement } from 'shared/ReactTypes';
import Reconciler from 'react-reconciler';

let idCounter = 0;

export function createRoot() {
	const container = {
		rootID: idCounter++,
		pendingChildren: [],
		children: []
	};
	const root = Reconciler.createContainer(container);
	return {
		render(children: ReactElement) {
			Reconciler.updateContainer(children, root);
		}
	};
}
