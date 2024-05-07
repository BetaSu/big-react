import reactConfig from './react.config';
import reactDOMConfig from './react-dom.config';
import reactNoopConfig from './react-noop-renderer.config';

export default () => {
	return [...reactConfig, ...reactDOMConfig, ...reactNoopConfig];
};
