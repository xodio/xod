module.exports = [{
    test: /\.json$/,
    loader: 'json-loader'
}, {
    test: /\.css$/,
    loader: 'style-loader!css-loader?modules&importLoaders=1!postcss-loader?parser=postcss-js!babel'
}];
