import { ReactContext } from 'shared/ReactTypes';

// step3: 保存沿途 上一个同类型context value 的栈
const prevContextValueStack: any[] = [];
// step2 保存上一个同类型context value
let prevContextValue: any = null;

// step0: beginWork
export function pushProvider<T>(context: ReactContext<T>, newValue: T) {
	// step4
	prevContextValueStack.push(prevContextValue);

	// step 2
	prevContextValue = context._currentValue;
	// step 1
	context._currentValue = newValue;
}

// step0: completeWork
export function popProvider<T>(context: ReactContext<T>) {
	// Q：用一个全局变量保存上一个同类型context value，在嵌套情况下会不会出错呢？
	// A：不会，beginWork completeWork是配套出现的，
	// 不会出现 a beginWork后，b completeWork
	context._currentValue = prevContextValue;

	// step4
	prevContextValue = prevContextValueStack.pop();
}
