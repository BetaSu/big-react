import reactDomConfig from './react-dom.config';
import noopRendererConfig from './react-noop-renderer.config';
import reactConfig from './react.config';

export default () => {
	return [...reactConfig, ...reactDomConfig, ...noopRendererConfig];
};
