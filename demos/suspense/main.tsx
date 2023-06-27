import { useState, useEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

const delay = (t: number) =>
	new Promise((r) => {
		setTimeout(r, t);
	});

const Comp = lazy(() =>
	import('./component').then((res) => {
		return delay(1000).then(() => {
			console.log('ready render Comp');
			return res;
		});
	})
);

function App() {
	const [num, setNum] = useState(0);
	console.log('num', num);
	return (
		<div>
			<button onClick={() => setNum(num + 1)}>click {num}</button>
			<Suspense fallback={<div>loading...</div>}>
				<Comp />
			</Suspense>
			<Child i={num} />
		</div>
	);
}

function Child({ i }) {
	return <p>i am child {i}</p>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
