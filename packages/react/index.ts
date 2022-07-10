import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';

export const useState = <State>(initialState: (() => State) | State) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useState<State>(initialState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};
