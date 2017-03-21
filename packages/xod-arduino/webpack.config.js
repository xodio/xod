const path = require('path');

const pkgpath = subpath => path.join(__dirname, subpath);

module.exports = {
  devtool: 'source-map',
  entry: pkgpath('src/index.js'),
  output: {
    path: pkgpath('dist'),
    libraryTarget: 'umd',
    library: 'xod-arduino',
    filename: 'index.js',
    umdNamedDefine: true,
  },
  target: 'node',
  externals: [
    'xod-core',
    'fs',
  ],
  resolve: {
    modulesDirectories: [
      'node_modules',
      pkgpath('node_modules'),
      pkgpath('node_modules/xod-core/node_modules'),
    ],
    extensions: ['', '.js'],
    alias: {
      handlebars: 'handlebars/dist/handlebars.min.js',
    },
  },
  module: {
    loaders: [
      {
        include: pkgpath('src'),
        test: /\.js$/,
        loader: 'babel?presets[]=es2015',
      },
      {
        include: pkgpath('platform'),
        test: /\.cpp$/,
        loader: 'raw',
      },
    ],
  },
};
