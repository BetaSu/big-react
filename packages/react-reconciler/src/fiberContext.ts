import { ReactContext } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { StackCursor, createCursor, pop, push } from './fiberStack';
import { Lanes } from './fiberLanes';

const valueCursor: StackCursor<any> = createCursor(null);

let currentlyRenderingFiber: FiberNode | null = null;

export function pushProvider<T>(
	providerFiber: FiberNode,
	context: ReactContext<T>,
	newValue: T
): void {
	push(valueCursor, context._currentValue, providerFiber);
	context._currentValue = newValue;
}

export function popProvider<T>(
	context: ReactContext<T>,
	providerFiber: FiberNode
): void {
	const currentValue = valueCursor.current;

	context._currentValue = currentValue;

	pop(valueCursor, providerFiber);
}

export function prepareToReadContext(
	workInProgress: FiberNode,
	renderLanes: Lanes
) {
	currentlyRenderingFiber = workInProgress;
}

export function readContext<T>(context: ReactContext<T>): T {
	return readContextForConsumer(currentlyRenderingFiber, context);
}

export function readContextForConsumer<T>(
	consumer: FiberNode,
	context: ReactContext<T>
): T {
	const value = context._currentValue;
	return value;
}
