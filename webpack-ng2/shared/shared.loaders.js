module.exports = [{
  test: /\.json$/,
  loader: 'json-loader'
}, {
  test: /\.styl$/,
  loader: 'raw-loader!postcss-loader!stylus-loader'
}, {
  test: /\.html$/,
  loader: 'raw-loader'
}];
