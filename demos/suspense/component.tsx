import { useState, useEffect } from 'react';

export default function Comp() {
	const [v, setv] = useState(1);
	useEffect(() => {
		console.log('acomp, ', v);
	}, [v]);
	return (
		<div
			onClick={() => {
				console.log('acomp, click');
				setv(v + 1);
			}}
		>
			async component - {v}
		</div>
	);
}
