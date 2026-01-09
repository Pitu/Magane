import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import license from 'rollup-plugin-license';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import autoPreprocess from 'svelte-preprocess';
import fs from 'fs/promises';
import path from 'path';

const production = !process.env.ROLLUP_WATCH;
const metadata = {
	name: 'MaganeVencord',
	displayName: 'MaganeVencord',
	description: 'Bringing LINE stickers to Discord in a chaotic way. Vencord edition.',
	version: require('./package.json').version,
	updateUrl: 'https://raw.githubusercontent.com/Pitu/Magane/master/dist/maganevencord'
};

const PACKAGE_URL = 'https://raw.githubusercontent.com/Pitu/Magane/refs/heads/master/package.json';
const GITHUB_URL = 'https://github.com/Pitu/Magane';

const nativeFile = path.resolve(__dirname, 'src/vencord-native.ts');
const meta = path.resolve(__dirname, 'src/meta.txt');

const dist = path.resolve(__dirname, production ? 'dist' : 'dist-dev', 'maganevencord');
const outputFileName = 'index.ts';
const outputFile = path.resolve(dist, outputFileName);

export default {
	input: 'src/vencord-main.js',
	output: {
		file: outputFile,
		format: 'cjs',
		name: 'app',
		// BetterDiscord won't make sourcemaps available to DevTools anyways,
		// and we are not minifying processed output to follow BetterDiscord guidelines,
		// so might as well not generate them altogether.
		sourcemap: false
	},
	plugins: [
		{
			name: 'init',
			buildStart() {
				if (process.env.VENCORD_PLUGIN_PATH && /\.(js|ts$)/i.test(process.env.VENCORD_PLUGIN_PATH)) {
					throw new Error('VENCORD_PLUGIN_PATH requires directory path. e.g., /path/to/Vencord/src/userplugins/maganevencord.');
				}
			}
		},
		!production && {
			name: 'watchExtras',
			buildStart() {
				this.addWatchFile(meta);
				this.addWatchFile(nativeFile);
			}
		},
		svelte({
			dev: !production,
			emitCss: true,
			preprocess: autoPreprocess({
				replace: [
					[/VencordApi\./g, ''],
					['mountType = mountType;', 'mountType = MountType.VENCORD;'],
					['const VERSION = null;', `const VERSION = '${metadata.version}';`],
					['const UPDATE_URL = null;', `const UPDATE_URL = '${metadata.updateUrl}';`],
					['const PACKAGE_URL = null;', `const PACKAGE_URL = '${PACKAGE_URL}';`],
					['const GITHUB_URL = null;', `const GITHUB_URL = '${GITHUB_URL}';`]
				]
			}),
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
			ecma: 2021,
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
			name: 'vencordImports',
			generateBundle: (options, bundle, isWrite) => {
				bundle[outputFileName].code = bundle[outputFileName].code.replace(
					/(['"]use strict['"];)/,
					'$1\n\n' +
					'import definePlugin from "@utils/types";\n' +
					'import { findByPropsLazy, findLazy } from "@webpack";\n' +
					'import { Alerts, Toasts } from "@webpack/common";\n' +
					'import { Notices } from "@api/index";\n' +
					'import { ApngBlendOp, ApngDisposeOp, parseAPNG } from "@utils/apng";\n' +
					'import { applyPalette, GIFEncoder, quantize } from "gifenc";'
				);
			}
		},
		{
			name: 'copyDistFile',
			writeBundle: async () => {
				// Copy native file to dist directory.
				fs.copyFile(nativeFile, path.resolve(dist, 'native.ts'));

				if (!Boolean(process.env.VENCORD_PLUGIN_PATH)) return;

				fs.mkdir(process.env.VENCORD_PLUGIN_PATH, { recursive: true });

				const indexDest = path.resolve(process.env.VENCORD_PLUGIN_PATH, 'index.ts');
				await fs.copyFile(outputFile, indexDest);
				console.log(`Copied index file to ${indexDest}`);

				if (!process.env.VENCORD_SKIP_NATIVE) {
					const nativeDest = path.resolve(process.env.VENCORD_PLUGIN_PATH, 'native.ts');
					await fs.copyFile(nativeFile, nativeDest);
					console.log(`Copied native file to ${nativeDest}`);
				}
			}
		}
	],
	watch: {
		clearScreen: false
	}
};
