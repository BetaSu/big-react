import { useState, useEffect } from 'react';
import * as ReactNoop from 'react-noop-renderer';

const root = ReactNoop.createRoot();

function Parent() {
	return (
		<>
			<Child />
			<div>hello world</div>
		</>
	);
}

function Child() {
	return 'Child';
}

root.render(<Parent />);

window.root = root;
