import { FiberNode } from './fiber';

export const renderWithHooks = (workInProgress: FiberNode) => {
	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	const children = Component(props);
	return children;
};
