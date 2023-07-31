import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import command from 'rollup-plugin-command';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import autoPreprocess from 'svelte-preprocess';
import path from 'path';

const production = !process.env.ROLLUP_WATCH;
const file = path.resolve(__dirname, production ? 'dist' : 'dist-dev', 'magane.vencord.js');

export default {
	input: 'src/vencord-main.js',
	output: {
		file,
		format: 'cjs',
		name: 'app',
		// BetterDiscord won't make sourcemaps available to DevTools anyways,
		// and we are not minifying processed output to follow BetterDiscord guidelines,
		// so might as well not generate them altogether.
		sourcemap: false
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
			],
			inject: (cssVariableName, fileId) => {
				// Extract packaga name if available
				const match = fileId.match(/[\/]node_modules[\/](.*?)[\/]/);
				let pkg = '';
				if (match) pkg = `${match[1]}-`;
				// Normalize basename
				const id = pkg + path.basename(fileId).replace(/\./, '_');
				// Arguably hacky.., but cleanest method that I could think of
				return 'if (typeof window.MAGANE_STYLES !== "object") window.MAGANE_STYLES = {};\n' +
					`window.MAGANE_STYLES["${id}"] = ${cssVariableName};`;
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
		production && replace({
			delimiters: ['', ''],
			preventAssignment: false,
			values: {
				'"use strict";': '"use strict"\n__VencordImports__;'
			}
		}),
		!production && replace({
			delimiters: ['', ''],
			preventAssignment: false,
			values: {
				'\'use strict\';': '\'use strict\';\n__VencordImports__;'
			}
		}),
		replace({
			delimiters: ['', ''],
			preventAssignment: false,
			values: {
				'__VencordImports__;': 'import definePlugin from "@utils/types";\nimport { findByPropsLazy, findLazy } from "@webpack";\nimport { Alerts, Toasts } from "@webpack/common";',
				'VencordApi.': '',

				// Svelte syntax, lmao..
				'$$invalidate(0, mountType)': '$$invalidate(0, mountType = MountType.VENCORD)',

				// This is so hacky, lmao
				'var vencordMain = definePlugin({': 'export default definePlugin({',
				'module.exports = vencordMain;': ''
			}
		}),
		Boolean(process.env.VENCORD_PLUGIN_PATH) &&
			command(`cp --force "${file}" "${process.env.VENCORD_PLUGIN_PATH}"`, {
				once: false,
				wait: true
			})
	],
	watch: {
		clearScreen: false
	}
};
