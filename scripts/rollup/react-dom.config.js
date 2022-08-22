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
		// 注意区分peerDependencies、dependencies、以及external参数
		// peerDependencies一定属于external，因为它的代码不会打入React-DOM
		// dependencies中：
		//  "react-reconciler": "workspace:*" 不属于external，因为他的代码需要打入React-DOM
		//  "scheduler": "..." 属于external，因为他的代码不需要打入React-DOM
		external: [...Object.keys(peerDependencies), 'scheduler'],
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
				baseContents: ({ name, description, version, dependencies }) => ({
					name,
					description,
					version,
					// 根据上述external处注释，要注意包源码和打包产物中依赖的区别
					peerDependencies: { react: version },
					dependencies: {
						scheduler: dependencies.scheduler
					},
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
