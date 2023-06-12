import { FiberNode } from './fiber';

let index = -1;
const valueStack: Array<any> = [];

export type StackCursor<T> = { current: T };

export function createCursor<T>(defaultValue: T): StackCursor<T> {
	return {
		current: defaultValue
	};
}

export function isEmpty(): boolean {
	return index === -1;
}

export function pop<T>(cursor: StackCursor<T>, providerFiber: FiberNode) {
	if (index < 0) {
		return;
	}
	cursor.current = valueStack[index];

	valueStack[index] = null;

	index--;
}

export function push<T>(
	cursor: StackCursor<T>,
	value: T,
	providerFiber: FiberNode
) {
	index++;

	valueStack[index] = value;

	cursor.current = value;
}
