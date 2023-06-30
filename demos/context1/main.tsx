import { useState, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';

const ctx = createContext(null);

function App() {
	return (
		<ctx.Provider value={1}>
			<ctx.Provider value={2}>
				<A />
			</ctx.Provider>
			<A />
		</ctx.Provider>
	);
}

function A() {
	const value = useContext(ctx);
	return <div>A: {value}</div>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
