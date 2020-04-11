const { environment } = require('@rails/webpacker')

environment.loaders.append('typescript', {
  test: /\.tsx?$/,
  exclude: /node_modules/,
  loader: 'awesome-typescript-loader'
});

module.exports = environment
