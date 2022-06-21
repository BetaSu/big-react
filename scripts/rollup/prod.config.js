import reactPkg from '../../packages/react/package.json';
import typescript from 'rollup-plugin-typescript2';
import path from 'path';
import resolve from '@rollup/plugin-babel';
import babel from '@rollup/plugin-babel';

const tsConfig = { tsConfig: 'tsconfig.json' };
const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist');

export default [
	{
		input: `${pkgPath}/react/${reactPkg.module}`,
		output: {
			file: `${distPath}/react.js`,
			format: 'es'
		},
		plugins: [
			typescript(tsConfig),
			resolve(),
			babel({ babelHelpers: 'bundled' })
		]
	}
];
