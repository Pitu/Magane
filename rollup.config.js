import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import serve from 'rollup-plugin-serve';
import autoPreprocess from 'svelte-preprocess';
import fs from 'fs/promises';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: production ? 'dist/magane.min.js' : 'dist-dev/magane.js'
	},
	plugins: [
		svelte({
			dev: !production,
			emitCss: true,
			preprocess: autoPreprocess()
		}),
		postcss({
			extensions: ['.css', '.scss'],
			plugins: [
				postcssPresetEnv()
			]
		}),
		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		}),
		commonjs(),
		!production && serve({
			host: 'localhost',
			port: 10001,
			contentBase: [
				'dist',
				'dist-dev'
			],
			headers: {
				'Cache-Control': 'no-store'
			}
		}),
		!production && livereload('public'),
		{
			name: 'utimesPluginFile',
			writeBundle: async () => {
				if (production || !Boolean(process.env.BD_PLUGIN_PATH)) return;
				// Updating timestamps of the plugin file will notify BetterDiscord to automatically reload it
				const now = new Date();
				await fs.utimes(process.env.BD_PLUGIN_PATH, now, now);
				console.log(`Updated timestamps of ${process.env.BD_PLUGIN_PATH}`);
			}
		},
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
