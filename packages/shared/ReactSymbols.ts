const supportSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;

export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for('react.fragment')
	: 0xeacb;

export const REACT_LAZY_TYPE = supportSymbol
	? Symbol.for('react.lazy')
	: 0xead4;

export const REACT_SUSPENSE_TYPE: symbol = supportSymbol
	? Symbol.for('react.suspense')
	: 0xead1;
