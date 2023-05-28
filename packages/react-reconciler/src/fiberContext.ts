import { ReactContext } from 'shared/ReactTypes';

const valueStack: any[] = [];

export function pushProvider<T>(context: ReactContext<T>, newValue: T) {
	valueStack.push(newValue);
	context._currentValue = newValue;
}

export function popProvider<T>(context: ReactContext<T>) {
	const currentValue = valueStack[valueStack.length - 1];
	context._currentValue = currentValue;
	valueStack.pop();
}
