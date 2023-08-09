import { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';

function delay(promise) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(promise);
		}, 2000);
	});
}

const Cpn = lazy(() => import('./Cpn').then((res) => delay(res)));

function App() {
	return (
		<Suspense fallback={<div>loading</div>}>
			<Cpn />
		</Suspense>
	);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
