import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';

import { jsx, isValidElement as isValidElementFn } from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useEffect(create, deps);
};

export const useRef: Dispatcher['useRef'] = (initialValue) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useRef(initialValue);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

// 这里应该根据环境区分jsx/jsxDEV，在测试用例中也要区分，当前ReactElement-test.js中使用的是jsx
export const createElement = jsx;
export const isValidElement = isValidElementFn;
