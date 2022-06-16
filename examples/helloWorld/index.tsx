import React from 'react';
import ReactDOM from 'react-dom';

const jsx = <div>hello world</div>;

const container = document.querySelector('#root');
const root = ReactDOM.createRoot(container);
root.render(jsx);