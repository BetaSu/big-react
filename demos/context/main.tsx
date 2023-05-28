import { useState, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';

const ctx = createContext(null);

function App() {
	const [num, update] = useState(0);
	return (
		<ctx.Provider value={num}>
			<div onClick={() => update(Math.random())}>
				<Middle />
			</div>
		</ctx.Provider>
	);
}

function Middle() {
	return <Child />;
}

function Child() {
	const val = useContext(ctx);
	return <p>{val}</p>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
