import { ReactElement } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { Container } from './hostConfig';
import { HostRoot } from './workTags';

export function createContainer(container: Container) {
	const root = new FiberRootNode(container);
	const hostRootFiber = new FiberNode(HostRoot, null, null);
	root.current = hostRootFiber;
	hostRootFiber.stateNode = root;

	return root;
}

// export function updateContainer(element: ReactElement, root: FiberRootNode) {}
