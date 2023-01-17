import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		replace({
			__LOG__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: path.resolve(__dirname, '../packages/react')
			},
			{
				find: 'react-dom',
				replacement: path.resolve(__dirname, '../packages/react-dom')
			},
			{
				find: 'react-reconciler',
				replacement: path.resolve(__dirname, '../packages/react-reconciler')
			},
			{
				find: 'react-noop-renderer',
				replacement: path.resolve(__dirname, '../packages/react-noop-renderer')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					__dirname,
					'../packages/react-noop-renderer/src/hostConfig.ts'
					// '../packages/react-dom/src/hostConfig.ts'
				)
			}
		]
	},
	optimizeDeps: {
		// force: true
		exclude: ['react', 'react-dom']
	}
});
