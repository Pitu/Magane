import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import license from 'rollup-plugin-license';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import autoPreprocess from 'svelte-preprocess';
import fs from 'fs/promises';
import path from 'path';

const production = !process.env.ROLLUP_WATCH;
const file = path.resolve(__dirname, production ? 'dist' : 'dist-dev', 'magane.plugin.js');
const meta = path.resolve(__dirname, 'src/meta.txt');
const metadata = {
	name: 'MaganeBD',
	displayName: 'MaganeBD',
	description: 'Bringing LINE stickers to Discord in a chaotic way. BetterDiscord edition.',
	updateUrl: 'https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.plugin.js'
};

export default {
	input: 'src/bd-main.js',
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
		!production && {
			name: 'watch-extras',
			buildStart() {
				this.addWatchFile(meta);
			}
		},
		svelte({
			dev: !production,
			emitCss: true,
			preprocess: autoPreprocess(),
			onwarn: (warning, handler) => {
				if (warning.code === 'a11y-click-events-have-key-events') return;
				handler(warning);
			}
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
		license({
			banner: {
				commentStyle: 'regular',
				content: {
					file: meta,
					encoding: 'utf-8'
				},
				data() { return metadata; }
			}
		}),
		{
			name: 'copyDistFile',
			writeBundle: async () => {
				if (!Boolean(process.env.BD_PLUGIN_PATH)) return;
				await fs.copyFile(file, process.env.BD_PLUGIN_PATH);
				console.log(`Copied dist file to ${process.env.BD_PLUGIN_PATH}`);
			}
		}
	],
	watch: {
		clearScreen: false
	}
};
