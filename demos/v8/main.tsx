import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
	const [num, updateNum] = useState(0);

	return (
		<ul
			onClick={(e) => {
				// 注意观察多次更新只会触发一次render阶段，这就是batchedUpdates（批处理），也是我们基础调度能力的体现
				updateNum((num: number) => num + 1);
				updateNum((num: number) => num + 2);
				updateNum((num: number) => num + 3);
				updateNum((num: number) => num + 4);
			}}
		>
			num值为：{num}
		</ul>
	);
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
