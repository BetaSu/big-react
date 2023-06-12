import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';

const Context = createContext({});

function App() {
	const [value, setValue] = useState(1);
	return (
		<Context.Provider value={{ value, setValue }}>
			<div>App value = {value}</div>
			<Parent1 />
			<Parent2 />
		</Context.Provider>
	);
}

function Parent1() {
	const context = useContext(Context);
	return (
		<div>
			<button onClick={() => context.setValue(context.value + 1)}>add1</button>
			<div>parent1 value = {context.value}</div>
			<Child1 />
		</div>
	);
}

function Child1() {
	const context = useContext(Context);
	return <div>child1 value = {context.value}</div>;
}

function Parent2() {
	const context = useContext(Context);
	return (
		<Context.Provider value={{ ...context, value: context.value * 2 }}>
			<div>parent2 value = {context.value}</div>
			<Child2 />
		</Context.Provider>
	);
}

function Child2() {
	const context = useContext(Context);
	return <div>child2 value = {context.value}</div>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
