import { Fragment, Suspense, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Cpn } from './Cpn';

// 简单例子 + 没有Suspense catch的情况
function App() {
	return (
		<Suspense fallback={<div>loading...</div>}>
			<Cpn id={0} timeout={1000} />
		</Suspense>
		// <Cpn id={0} timeout={1000} />
	);
}

// 嵌套Suspense
// function App() {
// 	return (
// 		<Suspense fallback={<div>外层...</div>}>
// 			<Cpn id={0} timeout={1000} />
// 			<Suspense fallback={<div>内层...</div>}>
// 				<Cpn id={1} timeout={3000} />
// 			</Suspense>
// 		</Suspense>
// 	);
// }

// 缓存快速失效
// function App() {
// 	const [num, setNum] = useState(0);
// 	return (
// 		<div>
// 			<button onClick={() => setNum(num + 1)}>change id: {num}</button>
// 			<Suspense fallback={<div>loading...</div>}>
// 				<Cpn id={num} timeout={2000} />
// 			</Suspense>
// 		</div>
// 	);
// }

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
