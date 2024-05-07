import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { resolvePkgPath, getBaseRollupPlugins, getPackageJSON } from './utils';

const { name, peerDependencies } = getPackageJSON('react-noop-renderer');
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

export default [
	// React-Noop-Renderer
	{
		input: `${pkgPath}/index.ts`,
		external: [...Object.keys(peerDependencies), 'scheduler'],
		output: [
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
	}
];
