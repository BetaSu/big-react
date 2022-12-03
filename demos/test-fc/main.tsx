import { useState } from 'react';
import ReactDOM from 'react-dom/client';

console.log(import.meta.hot);

function App() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return <div>{num}</div>;
}

function Child() {
	return <span>big-react</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
