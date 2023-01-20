import { useState, useEffect } from 'react';
import noopRenderer from 'react-noop-renderer';

function App() {
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

const root = noopRenderer.createRoot();
root.render(<App />);

window.root = root;
