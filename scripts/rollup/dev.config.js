import reactDomConfig from './react-dom.config';
import reactConfig from './react.config';

export default () => {
	return [...reactConfig, ...reactDomConfig];
};
