import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
	const [num, updateNum] = useState(0);

	const isOdd = num % 2;

	return (
		<h3
			onClick={(e) => {
				updateNum(Math.ceil(Math.random() * 1000));
			}}
		>
			{isOdd ? <Child num={num} /> : <p>点我 点我~~</p>}
		</h3>
	);
}

function Child({ num }: { num: number }) {
	return <div>{num}</div>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
