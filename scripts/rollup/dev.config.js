import reactPkg from './packages/react/package.json';
import typescript from 'rollup-plugin-typescript2';
import path from 'path';

const tsConfig = {tsConfig: 'tsconfig.json'};
const pkgPath = path.resolve(__dirname, './packages');
const distPath = path.resolve(__dirname, './dist');

export default [
  {
		input: `${pkgPath}/react/${reactPkg.module}`,
		output: { 
      file: `${distPath}/react.js`, 
      format: 'es' 
    },
    plugins: [
      typescript(tsConfig)
    ]
	}
]