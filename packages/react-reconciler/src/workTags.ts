export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof ContextConsumer
	| typeof ContextProvider
	| typeof Fragment;

export const FunctionComponent = 0;
export const HostRoot = 3;
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const ContextConsumer = 9;
export const ContextProvider = 10;
