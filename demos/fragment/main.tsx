import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
	const [num, update] = useState(0);
	function onClick() {
		update(num + 1);
	}

	const arr =
		num % 2 === 0
			? [<li key="a">a</li>, <li key="b">b</li>, <li key="d">d</li>]
			: [<li key="d">d</li>, <li key="c">c</li>, <li key="b">b</li>];

	return (
		<ul onClick={onClick}>
			<></>
			{arr}
		</ul>
	);
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
