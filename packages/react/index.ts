import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';

import { jsxDEV, isValidElement as isValidElementFn } from './src/jsx';

export const useState = <State>(initialState: (() => State) | State) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useState<State>(initialState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const createElement = jsxDEV;
export const isValidElement = isValidElementFn;
