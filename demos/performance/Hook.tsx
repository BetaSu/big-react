import { useState, useContext, createContext, memo } from 'react';

const ctx = createContext(0);

export default function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);

	const addOne = () => update((num) => num + 1);

	return (
		<div>
			<Cpn onClick={addOne} />
			{num}
		</div>
	);
}

const Cpn = memo(function ({ onClick }) {
	console.log('Cpn render');
	return (
		<div onClick={() => onClick()}>
			<Child />
		</div>
	);
});

function Child() {
	console.log('Child render');
	return <p>i am child</p>;
}
