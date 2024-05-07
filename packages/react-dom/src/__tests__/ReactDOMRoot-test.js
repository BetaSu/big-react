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
let Scheduler;
let act;
let useEffect;

describe('ReactDOMRoot', () => {
	let container;

	beforeEach(() => {
		jest.resetModules();
		container = document.createElement('div');
		React = require('react');
		ReactDOM = require('react-dom');
		Scheduler = require('scheduler');
		act = require('jest-react').act;
		useEffect = React.useEffect;
	});

	it('renders children', async () => {
		const root = ReactDOM.createRoot(container);
		await act(async () => {
			root.render(<div>Hi</div>);
		});

		Scheduler.unstable_flushAll();
		expect(container.textContent).toEqual('Hi');
	});

	it('unmounts children', async () => {
		const root = ReactDOM.createRoot(container);
		await act(() => {
			root.render(<div>Hi</div>);
		});
		Scheduler.unstable_flushAll();
		expect(container.textContent).toEqual('Hi');
		await act(() => {
			root.unmount();
		});
		Scheduler.unstable_flushAll();
		expect(container.textContent).toEqual('');
	});

	it('clears existing children', async () => {
		container.innerHTML = '<div>a</div><div>b</div>';
		const root = ReactDOM.createRoot(container);
		await act(async () => {
			root.render(
				<div>
					<span>c</span>
					<span>d</span>
				</div>
			);
		});
		Scheduler.unstable_flushAll();
		expect(container.textContent).toEqual('cd');
		await act(async () => {
			root.render(
				<div>
					<span>d</span>
					<span>c</span>
				</div>
			);
		});
		Scheduler.unstable_flushAll();
		expect(container.textContent).toEqual('dc');
	});

	// it('throws a good message on invalid containers', () => {
	// 	expect(() => {
	// 		ReactDOM.createRoot(<div>Hi</div>);
	// 	}).toThrow('createRoot(...): Target container is not a DOM element.');
	// });

	it('warns when creating two roots managing the same container', () => {
		ReactDOM.createRoot(container);
		expect(() => {
			ReactDOM.createRoot(container);
		}).toThrow(
			'你在之前已经传递给createRoot()的container上调用了ReactDOM.createRoot()'
		);
	});

	it('does not warn when creating second root after first one is unmounted', () => {
		const root = ReactDOM.createRoot(container);
		root.unmount();
		Scheduler.unstable_flushAll();
		ReactDOM.createRoot(container); // No warning
	});

	// TODO 需要先支持并发更新
	// it('opts-in to concurrent default updates', async () => {
	// 	const root = ReactDOM.createRoot(container);

	// 	function Foo({ value }) {
	// 		Scheduler.unstable_yieldValue(value);
	// 		return <div>{value}</div>;
	// 	}

	// 	await act(async () => {
	// 		root.render(<Foo value="a" />);
	// 	});

	// 	expect(container.textContent).toEqual('a');

	// 	await act(async () => {
	// 		root.render(<Foo value="b" />);

	// 		expect(Scheduler).toHaveYielded(['a']);
	// 		expect(container.textContent).toEqual('a');

	// 		expect(Scheduler).toFlushAndYieldThrough(['b']);
	// 		expect(container.textContent).toEqual('a');
	// 		// if (gate((flags) => flags.allowConcurrentByDefault)) {

	// 		// } else {
	// 		// 	expect(container.textContent).toEqual('b');
	// 		// }
	// 	});
	// 	expect(container.textContent).toEqual('b');
	// });

	// it('unmount is synchronous', async () => {
	// 	const root = ReactDOM.createRoot(container);
	// 	await act(async () => {
	// 		root.render('Hi');
	// 	});
	// 	expect(container.textContent).toEqual('Hi');

	// 	await act(async () => {
	// 		root.unmount();
	// 		// Should have already unmounted
	// 		expect(container.textContent).toEqual('');
	// 	});
	// });

	it('throws if an unmounted root is updated', async () => {
		const root = ReactDOM.createRoot(container);
		await act(async () => {
			root.render('Hi');
		});
		expect(container.textContent).toEqual('Hi');

		root.unmount();

		expect(() => root.render("I'm back")).toThrow('不能更新一个卸载的root.');
	});

	// it('warns if root is unmounted inside an effect', async () => {
	// 	const container1 = document.createElement('div');
	// 	const root1 = ReactDOM.createRoot(container1);
	// 	const container2 = document.createElement('div');
	// 	const root2 = ReactDOM.createRoot(container2);

	// 	function App({ step }) {
	// 		useEffect(() => {
	// 			if (step === 2) {
	// 				root2.unmount();
	// 			}
	// 		}, [step]);
	// 		return 'Hi';
	// 	}

	// 	await act(async () => {
	// 		root1.render(<App step={1} />);
	// 	});
	// 	expect(container1.textContent).toEqual('Hi');

	// 	expect(() => {
	// 		ReactDOM.flushSync(() => {
	// 			root1.render(<App step={2} />);
	// 		});
	// 	}).toErrorDev(
	// 		'Attempted to synchronously unmount a root while React was ' +
	// 			'already rendering.'
	// 	);
	// });
});
