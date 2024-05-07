import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
	const [num, updateNum] = useState(0);

	useEffect(() => {
		console.warn('hello App');

		return () => {
			console.warn('bye bye App');
		};
	});

	return (
		<ul
			onClick={(e) => {
				updateNum((num: number) => num + 1);
			}}
		>
			你好
			{num === 1 ? null : <Child />}
		</ul>
	);
}

function Child() {
	useEffect(() => {
		console.warn('hello child');

		return () => {
			console.warn('bye bye child');
		};
	});
	return <p>i am child.</p>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
