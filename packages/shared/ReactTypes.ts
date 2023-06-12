export type Ref = { current: any } | ((instance: any) => void);
export type ElementType = any;
export type Key = string | null;
export type Props = {
	[key: string]: any;
	children?: any;
};

export interface ReactElement {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: 'KaSong';
}

export type Action<State> = State | ((prevState: State) => State);

export type ReactProviderType<T> = {
	$$typeof: symbol | number;
	_context: ReactContext<T>;
};

export type ReactContext<T> = {
	$$typeof: symbol | number;
	Consumer: ReactContext<T>;
	Provider: ReactProviderType<T>;
	_currentValue: T;
};
