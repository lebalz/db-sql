const { environment } = require('shakapacker');

environment.loaders.append('typescript', {
  test: /\.tsx?$/,
  exclude: /node_modules/,
  loader: 'awesome-typescript-loader'
});

environment.loaders.append('css', {
  test: /\.css/,
  loader: 'style-loader!css-loader'
});

module.exports = environment;
