export type Type = any;
export type Key = any;
export type Ref = { current: any } | ((instance: any) => void) | null;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: string;
}

export type Action<State> = State | ((prevState: State) => State);

export type ReactProviderType<T> = {
	$$typeof: symbol | number;
	_context: ReactContext<T>;
};

export type ReactContext<T> = {
	$$typeof: symbol | number;
	// Consumer: ReactContext<T> | null;
	Provider: ReactProviderType<T> | null;
	_currentValue: T;
};
