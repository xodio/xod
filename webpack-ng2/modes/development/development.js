var path = require('path');
var webpackMerge = require('webpack-merge');
var sharedConfig = require('../../shared/shared');
var target = require('./development.paths').targets.development;
var sources = require('../../shared/shared.paths').sources;

module.exports = webpackMerge(sharedConfig, {
    entry: {
        client: path.join(sources, 'application', 'client.js')
    },
    resolve: {
        extensions: ['', '.js', 'css', 'json'],
        root: sources,
        modulesDirectories: ['node_modules']
    },
    preLoaders: [{
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: [
            'node_modules/rxjs',
            'node_modules/@angular2-material',
            'node_modules/@angular'
        ]
    }],
    output: {
        path: target,
        filename: '[name].bundle.js',
        sourceMapFilename: '[name].map'
    }
});
