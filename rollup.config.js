import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import command from 'rollup-plugin-command';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import serve from 'rollup-plugin-serve';
import autoPreprocess from 'svelte-preprocess';

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
		!production && Boolean(process.env.BD_PLUGIN_PATH) &&
			command(`touch "${process.env.BD_PLUGIN_PATH}"`, {
				wait: true
			}),
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
