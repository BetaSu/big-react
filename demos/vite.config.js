import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		replace({
			__DEV__: process.env.NODE_ENV !== 'production'
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
			}
		]
	},
	optimizeDeps: {
		exclude: ['react', 'react-dom']
	}
});
