const webpack = require('webpack');
const createVariants = require('parallel-webpack').createVariants;
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const createConfig = options => {
	const plugins = [
		new webpack.DefinePlugin({ 'global.GENTLY': false }),
		new webpack.optimize.ModuleConcatenationPlugin()
	];

	if (options.minify) plugins.push(new UglifyJSPlugin({ uglifyOptions: { compress: { conditionals: true, booleans: true, loops: true, unused: true, if_return: true }, output: { comments: false }, warnings: true } })); // eslint-disable-line camelcase

	const filename = `./webpack/stickers${options.minify ? '.min' : ''}.js`;

	return {
		entry: './src/index.js',
		output: {
			path: __dirname,
			filename
		},
		plugins
	};
};

module.exports = createVariants({}, { minify: [false, true] }, createConfig);
