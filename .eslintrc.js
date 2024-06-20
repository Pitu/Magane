module.exports = {
	'extends': 'aqua/svelte',
	'env': {
		browser: true,
		node: true,
		es2021: true,
	},
	'rules': {
		'comma-dangle': 'off',
		'import/order': 'off',
		'semi': 'error'
	},
	'overrides': [
		{
			files: [
				'*.config.js',
			],
			env: {
				browser: false,
			},
		},
	],
	'ignorePatterns': [
		'dist/',
		'dist-dev/',
	],
	'settings': {
		'svelte3/ignore-warnings': ({ code }) => code === 'a11y-click-events-have-key-events',
	}
};
