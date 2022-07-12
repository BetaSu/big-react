const { defaults } = require('jest-config');

module.exports = {
	...defaults,
	modulePathIgnorePatterns: ['<rootDir>/.history'],
	moduleDirectories: [...defaults.moduleDirectories, 'dist/node_modules'],
	testEnvironment: 'jsdom'
};
