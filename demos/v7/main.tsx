import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
	const [num, updateNum] = useState(0);

	const isOdd = num % 2 === 0;

	const before = [
		<li key={1}>1</li>,
		<li>2</li>,
		<li>3</li>,
		<li key={4}>4</li>
	];
	const after = [<li key={4}>4</li>, <H />, <li>3</li>, <li key={1}>1</li>];

	const listToUse = isOdd ? before : after;

	return (
		<ul
			onClick={(e) => {
				updateNum((num: number) => num + 1);
			}}
		>
			{listToUse}
		</ul>
	);
}

function H() {
	return <li>i am H</li>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
