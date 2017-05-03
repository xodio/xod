const path = require('path');

const pkgpath = subpath => path.join(__dirname, subpath);

module.exports = {
  entry: pkgpath('src/index.js'),
  target: 'node',
  output: {
    path: pkgpath('dist'),
    libraryTarget: 'commonjs2',
    library: 'xod-espruino-upload',
    filename: 'index.js',
  },
  externals: {
    serialport: true,
  },
  resolve: {
    modulesDirectories: [
      'node_modules',
      pkgpath('node_modules'),
    ],
    extensions: ['', '.js'],
  },
  module: {
    loaders: [
      {
        include: pkgpath('src'),
        test: /\.js$/,
        loader: 'babel?presets[]=es2015',
      },
      {
        include: pkgpath('node_modules/espruino/espruino'),
        test: /\.js$/,
        loaders: [
          //'globals-loader?./src/shame.js',
          'exports?Espruino',
          'imports?$=jquery',
        ],
      },
      {
        include: pkgpath('node_modules/espruino'),
        test: /\.js$/,
        loaders: [
          //'globals-loader?./src/shame.js',
          'imports?Espruino=espruino/espruino,$=jquery',
        ],
      },
    ],
  },
};
