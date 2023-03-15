import { useTransition } from 'react';

export default function TabButton({ children, isActive, onClick }) {
	if (isActive) {
		return <b>{children}</b>;
	}
	return (
		<button
			onClick={() => {
				onClick();
			}}
		>
			{children}
		</button>
	);
}
