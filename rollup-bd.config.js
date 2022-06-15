import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import command from 'rollup-plugin-command';
import license from 'rollup-plugin-license';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import autoPreprocess from 'svelte-preprocess';

import { name } from './package.json';
import path from 'path';

const production = !process.env.ROLLUP_WATCH;
const file = path.resolve(__dirname, production ? 'dist' : 'dist-dev', 'magane.plugin.js');
const meta = path.resolve(__dirname, 'src/bd-meta.txt');

export default {
	input: 'src/bd-main.js',
	output: {
		exports: 'auto',
		file,
		format: 'cjs',
		name: 'app',
		// BetterDiscord won't make sourcemaps available to DevTools anyways,
		// and we are not minifying processed output to follow BetterDiscord guidelines,
		// so might as well not generate them altogether.
		sourcemap: false
	},
	plugins: [
		!production && {
			name: 'watch-extras',
			buildStart() {
				this.addWatchFile(meta);
			}
		},
		svelte({
			dev: !production,
			emitCss: true,
			preprocess: autoPreprocess()
		}),
		postcss({
			extensions: ['.css', '.scss'],
			inject: (cssVariableName, fileId) => {
				// Extract packaga name if available
				const match = fileId.match(/[\/]node_modules[\/](.*?)[\/]/);
				let prepend = '';
				if (match) prepend = `${match[1]}-`;
				// Normalize basename
				const id = path.basename(fileId).replace(/\./, '_');
				return `BdApi.injectCSS("${name}-${prepend}${id}", ${cssVariableName})`;
			}
		}),
		resolve({
			browser: true
		}),
		commonjs(),
		production && terser({
			ecma: 2017,
			compress: {
				keep_classnames: true,
				keep_fnames: true,
				passes: 1
			},
			mangle: false,
			output: {
				beautify: true,
				keep_numbers: true,
				indent_level: 4
			}
		}),
		production && replace({
			delimiters: ['', ''],
			preventAssignment: false,
			values: {
				'    ': '\t'
			}
		}),
		license({
			banner: {
				commentStyle: 'regular',
				content: {
					file: meta,
					encoding: 'utf-8'
				}
			}
		}),
		Boolean(process.env.BD_PLUGIN_PATH) &&
			command(`/usr/bin/cp --force "${file}" "${process.env.BD_PLUGIN_PATH}"`, {
				wait: true
			})
	],
	watch: {
		clearScreen: false
	}
};
