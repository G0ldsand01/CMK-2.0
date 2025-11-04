module.exports = {
	plugins: [
		require('autoprefixer'),
		require('cssnano')({
			preset: [
				'default',
				{
					discardComments: {
						removeAll: true,
					},
					minifySelectors: false, // Disable minify-selectors to avoid parsing errors
				},
			],
		}),
	],
};
