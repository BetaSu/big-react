export type Ref = any;
export type ElementType = any;
export type Key = string | null;
export type Props = {
	[key: string]: any;
};

export interface ReactElement {
	$$typeof: symbol;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
}
