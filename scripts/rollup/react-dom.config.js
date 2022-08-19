import alias from '@rollup/plugin-alias';
import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import path from 'path';

const { name, peerDependencies } = getPackageJSON('react-dom');
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

const basePlugins = getBaseRollupPlugins({
	typescript: {
		tsconfigOverride: {
			compilerOptions: {
				baseUrl: path.resolve(pkgPath, '../'),
				paths: {
					hostConfig: [`./${name}/src/hostConfig.ts`]
				}
			}
		}
	}
});

// include: ['react-dom.d.ts']

export default [
	// react-dom
	{
		input: `${pkgPath}/index.ts`,
		external: Object.keys(peerDependencies),
		output: [
			{
				file: `${pkgDistPath}/client.js`,
				name: 'client.js',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/index.js`,
				name: 'index.js',
				format: 'umd'
			}
		],
		plugins: [
			...basePlugins,
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: { react: version },
					main: 'index.js'
				})
			})
		]
	},
	// react-test-utils
	{
		input: `${pkgPath}/test-utils.ts`,
		external: ['react', 'react-dom'],
		output: [
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'test-utils.js',
				format: 'umd'
			}
		],
		plugins: basePlugins
	}
];
