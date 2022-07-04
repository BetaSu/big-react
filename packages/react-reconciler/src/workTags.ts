export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent;

export const FunctionComponent = 0;
export const HostRoot = 3;
export const HostComponent = 5;
