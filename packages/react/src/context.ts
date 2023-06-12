import { REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from 'shared/ReactSymbols';
import { ReactContext } from 'shared/ReactTypes';

export function createContext<T>(defaultValue: T): ReactContext<T> {
	const context = {
		$$typeof: REACT_CONTEXT_TYPE,
		_currentValue: defaultValue
	} as ReactContext<T>;

	context.Provider = {
		$$typeof: REACT_PROVIDER_TYPE,
		_context: context
	};

	context.Consumer = context;

	return context;
}
