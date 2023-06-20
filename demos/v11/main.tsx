import { useState, useEffect, lazy } from 'react';
import { createRoot } from 'react-dom/client';

const Comp = lazy(() => import('./component'));

function App() {
	console.log(lazy);
	const [num, updateNum] = useState(0);
	const len = 8;

	useEffect(() => {
		Comp().then((res) => {
			console.log(res);
		});
	}, []);
	console.log('num', num);
	return (
		<div>
			<Comp />
		</div>
	);
}

function Child({ i }) {
	return <p>i am child {i}</p>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
