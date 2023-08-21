const supportSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;

export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for('react.fragment')
	: 0xeaca;

export const REACT_CONTEXT_TYPE = supportSymbol
	? Symbol.for('react.context')
	: 0xeacc;

export const REACT_PROVIDER_TYPE = supportSymbol
	? Symbol.for('react.provider')
	: 0xeac2;

export const REACT_SUSPENSE_TYPE = supportSymbol
	? Symbol.for('react.suspense')
	: 0xead1;

export const REACT_LAZY_TYPE = supportSymbol
	? Symbol.for('react.lazy')
	: 0xead4;

export const REACT_MEMO_TYPE = supportSymbol
	? Symbol.for('react.memo')
	: 0xead3;
