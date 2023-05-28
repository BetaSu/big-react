import { useState, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';

const ctx = createContext(null);

function App() {
	return (
		<ctx.Provider value={0}>
			<ctx.Provider value={1}>
				<Child />
				<ctx.Provider value={2}>
					<Child />
				</ctx.Provider>
			</ctx.Provider>
		</ctx.Provider>
	);
}

function Child() {
	const val = useContext(ctx);
	return <p>{val}</p>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
