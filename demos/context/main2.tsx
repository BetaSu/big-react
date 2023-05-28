import { useState, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';

const ctx = createContext(null);
const ctx1 = createContext(null);

function App() {
	const [num, update] = useState(0);
	return (
		<ctx.Provider value={num}>
			<ctx1.Provider value={num + ' hello'}>
				<div onClick={() => update((n) => n + 1)}>
					<Middle />
				</div>
			</ctx1.Provider>
		</ctx.Provider>
	);
}

function Middle() {
	return <Child />;
}

function Child() {
	const val = useContext(ctx);
	const val1 = useContext(ctx1);
	return (
		<>
			<p>{val}</p>
			<p>{val1}</p>
		</>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
