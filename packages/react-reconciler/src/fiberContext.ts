import { ReactContext } from 'shared/ReactTypes';

// 保存context的栈
const valueStack: any[] = [];

export function pushProvider<T>(context: ReactContext<T>, nextValue: T) {
	valueStack.push(nextValue);
	context._currentValue = nextValue;
}

export function popProvider<T>(context: ReactContext<T>) {
	const currentValue = valueStack[valueStack.length - 1];
	context._currentValue = currentValue;
	valueStack.pop();
}
