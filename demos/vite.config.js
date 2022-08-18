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
				find: 'scheduler',
				replacement: path.resolve(__dirname, '../packages/scheduler')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					__dirname,
					'../packages/react-dom/src/hostConfig.ts'
				)
			}
		]
	},
	optimizeDeps: {
		// force: true
		include: ['scheduler'],
		exclude: ['react', 'react-dom']
	}
});
