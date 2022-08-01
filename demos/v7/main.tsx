import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
	const [num, updateNum] = useState(0);

	const isOdd = num % 2;

	const before = [
		<li key={1}>1</li>,
		<li>2</li>,
		<li>3</li>,
		<li key={4}>4</li>
	];
	const after = [
		<li key={4}>4</li>,
		<li>2</li>,
		<li>3</li>,
		<li key={1}>1</li>
	];

	const listToUse = isOdd ? before : after;

	console.warn('num is: ', num);

	return (
		<ul
			onClick={(e) => {
				updateNum((num: number) => num + 1);
				updateNum((num: number) => num + 2);
				updateNum((num: number) => num + 3);
				updateNum((num: number) => num + 4);
			}}
		>
			{listToUse}
		</ul>
	);
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
