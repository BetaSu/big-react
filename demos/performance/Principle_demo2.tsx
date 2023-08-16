import { useState, useContext, createContext, memo } from 'react';

export default function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);

	return (
		<div onClick={() => update(num + 100)}>
			<button
				onClick={(e) => {
					e.stopPropagation();
					update(num + 1);
				}}
			>
				+ 1
			</button>
			<p>num is: {num}</p>
			<ExpensiveSubtree />
		</div>
	);
}

function ExpensiveSubtree() {
	console.log('ExpensiveSubtree render');
	return <p>i am child</p>;
}
