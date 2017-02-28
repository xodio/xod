const fs = require('fs');
const path = require('path');
const autoprefixer = require('autoprefixer');

const pkgpath = subpath => path.join(__dirname, subpath);

module.exports = {
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css',
          'postcss',
          'sass?outputStyle=expanded',
        ],
      },
      {
        test: /assets\/.*\.(jpe?g|png|gif|svg|ttf|eot|svg|woff|woff2)?$/,
        loaders: [
          `file?name=assets/[path][name].[ext]?[hash:6]&context=${pkgpath('./src/core/assets')}`,
        ],
      },
      {
        test: /node_modules\/font-awesome\/.*\.(jpe?g|png|gif|svg|ttf|eot|svg|woff|woff2)(\?\S*)?$/,
        loaders: [
          'file?name=assets/font-awesome/[name].[ext]?[hash:6]',
        ],
      },
      {
        include: pkgpath('node_modules/font-awesome'),
        test: /\.css$/,
        loaders: [
          'style',
          'css',
        ],
      },
    ],
  },
  postcss: function postCssPlugins() { return [autoprefixer]; },
};
