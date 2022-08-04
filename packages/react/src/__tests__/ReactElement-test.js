/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactTestUtils;

describe('ReactElement', () => {
	let ComponentFC;
	let originalSymbol;

	beforeEach(() => {
		jest.resetModules();

		// Delete the native Symbol if we have one to ensure we test the
		// unpolyfilled environment.
		originalSymbol = global.Symbol;
		global.Symbol = undefined;

		React = require('react');
		ReactDOM = require('react-dom');
		ReactTestUtils = require('react-dom/test-utils');

		// NOTE: We're explicitly not using JSX here. This is intended to test
		// classic JS without JSX.
		ComponentFC = () => {
			return React.createElement('div');
		};
	});

	afterEach(() => {
		global.Symbol = originalSymbol;
	});

	it('uses the fallback value when in an environment without Symbol', () => {
		expect((<div />).$$typeof).toBe(0xeac7);
	});

	it('returns a complete element according to spec', () => {
		const element = React.createElement(ComponentFC);
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);

		expect(element.props).toEqual({});
	});

	it('allows a string to be passed as the type', () => {
		const element = React.createElement('div');
		expect(element.type).toBe('div');
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({});
	});

	it('returns an immutable element', () => {
		const element = React.createElement(ComponentFC);
		expect(() => (element.type = 'div')).not.toThrow();
	});

	it('does not reuse the original config object', () => {
		const config = { foo: 1 };
		const element = React.createElement(ComponentFC, config);
		expect(element.props.foo).toBe(1);
		config.foo = 2;
		expect(element.props.foo).toBe(1);
	});

	it('does not fail if config has no prototype', () => {
		const config = Object.create(null, { foo: { value: 1, enumerable: true } });
		const element = React.createElement(ComponentFC, config);
		expect(element.props.foo).toBe(1);
	});

	it('extracts key and ref from the config', () => {
		const element = React.createElement(ComponentFC, {
			key: '12',
			ref: '34',
			foo: '56'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('12');
		expect(element.ref).toBe('34');
		expect(element.props).toEqual({ foo: '56' });
	});

	it('extracts null key and ref', () => {
		const element = React.createElement(ComponentFC, {
			key: null,
			ref: null,
			foo: '12'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('null');
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '12' });
	});

	it('ignores undefined key and ref', () => {
		const props = {
			foo: '56',
			key: undefined,
			ref: undefined
		};
		const element = React.createElement(ComponentFC, props);
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '56' });
	});

	it('ignores key and ref warning getters', () => {
		const elementA = React.createElement('div');
		const elementB = React.createElement('div', elementA.props);
		expect(elementB.key).toBe(null);
		expect(elementB.ref).toBe(null);
	});

	it('coerces the key to a string', () => {
		const element = React.createElement(ComponentFC, {
			key: 12,
			foo: '56'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('12');
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '56' });
	});

	// it('preserves the owner on the element', () => {
	// 	let element;

	// 	function Wrapper() {
	// 		element = React.createElement(ComponentFC);
	// 		return element;
	// 	}

	// 	const instance = ReactTestUtils.renderIntoDocument(
	// 		React.createElement(Wrapper)
	// 	);
	// 	expect(element._owner.stateNode).toBe(instance);
	// });

	it('merges an additional argument onto the children prop', () => {
		const a = 1;
		const element = React.createElement(
			ComponentFC,
			{
				children: 'text'
			},
			a
		);
		expect(element.props.children).toBe(a);
	});

	it('does not override children if no rest args are provided', () => {
		const element = React.createElement(ComponentFC, {
			children: 'text'
		});
		expect(element.props.children).toBe('text');
	});

	it('overrides children if null is provided as an argument', () => {
		const element = React.createElement(
			ComponentFC,
			{
				children: 'text'
			},
			null
		);
		expect(element.props.children).toBe(null);
	});

	it('merges rest arguments onto the children prop in an array', () => {
		const a = 1;
		const b = 2;
		const c = 3;
		const element = React.createElement(ComponentFC, null, a, b, c);
		expect(element.props.children).toEqual([1, 2, 3]);
	});

	// // NOTE: We're explicitly not using JSX here. This is intended to test
	// // classic JS without JSX.
	it('allows static methods to be called using the type property', () => {
		function StaticMethodComponent() {
			return React.createElement('div');
		}
		StaticMethodComponent.someStaticMethod = () => 'someReturnValue';

		const element = React.createElement(StaticMethodComponent);
		expect(element.type.someStaticMethod()).toBe('someReturnValue');
	});

	// // NOTE: We're explicitly not using JSX here. This is intended to test
	// // classic JS without JSX.
	it('identifies valid elements', () => {
		function Component() {
			return React.createElement('div');
		}

		expect(React.isValidElement(React.createElement('div'))).toEqual(true);
		expect(React.isValidElement(React.createElement(Component))).toEqual(true);

		expect(React.isValidElement(null)).toEqual(false);
		expect(React.isValidElement(true)).toEqual(false);
		expect(React.isValidElement({})).toEqual(false);
		expect(React.isValidElement('string')).toEqual(false);
		expect(React.isValidElement(Component)).toEqual(false);
		expect(React.isValidElement({ type: 'div', props: {} })).toEqual(false);

		const jsonElement = JSON.stringify(React.createElement('div'));
		expect(React.isValidElement(JSON.parse(jsonElement))).toBe(true);
	});

	// // NOTE: We're explicitly not using JSX here. This is intended to test
	// // classic JS without JSX.
	it('is indistinguishable from a plain object', () => {
		const element = React.createElement('div', { className: 'foo' });
		const object = {};
		expect(element.constructor).toBe(object.constructor);
	});

	it('does not warn for NaN props', () => {
		function Test() {
			return <div />;
		}
		const test = ReactTestUtils.renderIntoDocument(<Test value={+undefined} />);
		expect(test.props.value).toBeNaN();
	});

	// // NOTE: We're explicitly not using JSX here. This is intended to test
	// // classic JS without JSX.
	it('identifies elements, but not JSON, if Symbols are supported', () => {
		// Rudimentary polyfill
		// Once all jest engines support Symbols natively we can swap this to test
		// WITH native Symbols by default.
		const REACT_ELEMENT_TYPE = function () {}; // fake Symbol
		const OTHER_SYMBOL = function () {}; // another fake Symbol
		global.Symbol = function (name) {
			return OTHER_SYMBOL;
		};
		global.Symbol.for = function (key) {
			if (key === 'react.element') {
				return REACT_ELEMENT_TYPE;
			}
			return OTHER_SYMBOL;
		};

		jest.resetModules();

		React = require('react');

		function Component() {
			return React.createElement('div');
		}

		expect(React.isValidElement(React.createElement('div'))).toEqual(true);
		expect(React.isValidElement(React.createElement(Component))).toEqual(true);

		expect(React.isValidElement(null)).toEqual(false);
		expect(React.isValidElement(true)).toEqual(false);
		expect(React.isValidElement({})).toEqual(false);
		expect(React.isValidElement('string')).toEqual(false);

		expect(React.isValidElement(Component)).toEqual(false);
		expect(React.isValidElement({ type: 'div', props: {} })).toEqual(false);

		const jsonElement = JSON.stringify(React.createElement('div'));
		expect(React.isValidElement(JSON.parse(jsonElement))).toBe(false);
	});
});
