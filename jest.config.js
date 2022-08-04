const { defaults } = require('jest-config');

module.exports = {
	...defaults,
	modulePathIgnorePatterns: ['<rootDir>/.history'],
	moduleDirectories: [
		// 对于 React ReactDOM
		'dist/node_modules',
		// 对于第三方依赖
		...defaults.moduleDirectories,
		// 对于 scheduler react-jest react-test-renderer
		'packages'
	],
	testEnvironment: 'jsdom'
};
