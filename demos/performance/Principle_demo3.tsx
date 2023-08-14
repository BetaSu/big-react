import { useState, useContext, createContext, useMemo } from 'react';

export default function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);

	return (
		<div onClick={() => update(num + 100)}>
			<p>num is: {num}</p>
			<ExpensiveChild />
		</div>
	);
}

function ExpensiveChild() {
	console.log('ExpensiveChild render');
	return <p>i am child</p>;
}
