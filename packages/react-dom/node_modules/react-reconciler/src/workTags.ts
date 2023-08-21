export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment
	| typeof ContextProvider
	| typeof SuspenseComponent
	| typeof OffscreenComponent
	| typeof LazyComponent
	| typeof MemoComponent;

export const FunctionComponent = 0;
export const HostRoot = 3;

export const HostComponent = 5;
// <div>123</div>
export const HostText = 6;
export const Fragment = 7;
export const ContextProvider = 8;

export const SuspenseComponent = 13;
export const OffscreenComponent = 14;

export const LazyComponent = 16;
export const MemoComponent = 15;
