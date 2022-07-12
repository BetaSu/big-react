// @ts-ignore
import ReactDOM from 'react-dom';
// import React from 'react';
import { ReactElement } from 'shared/ReactTypes';

export const renderIntoDocument = (element: ReactElement) => {
	const div = document.createElement('div');
	return ReactDOM.createRoot(div).render(element);
};
