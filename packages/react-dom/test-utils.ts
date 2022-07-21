// @ts-ignore
import { createRoot } from 'react-dom';
// import React from 'react';
import { ReactElement } from 'shared/ReactTypes';

export const renderIntoDocument = (element: ReactElement) => {
	const div = document.createElement('div');
	return createRoot(div).render(element);
};
