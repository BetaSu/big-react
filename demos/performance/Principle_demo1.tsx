import { useState, useContext, createContext, memo } from 'react';

export default function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);

	return (
		<div>
			<button onClick={() => update(num + 1)}>+ 1</button>
			<p>num is: {num}</p>
			<ExpensiveChild />
		</div>
	);
}

function ExpensiveChild() {
	console.log('ExpensiveChild render');
	return <p>i am child</p>;
}
