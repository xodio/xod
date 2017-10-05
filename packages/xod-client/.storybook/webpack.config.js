const fs = require('fs');
const path = require('path');
const autoprefixer = require('autoprefixer');

const pkgpath = subpath => path.resolve(__dirname, '..', subpath);
const assetsPath = pkgpath('src/core/assets');
const fontAwesomePath = pkgpath('../../node_modules/font-awesome');

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
        test: /\.css$/,
        loaders: [
          'style',
          'css',
        ],
      },
      {
        include: assetsPath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)?$/,
        loaders: [
          `file?name=assets/[path][name].[ext]?[hash:6]&context=${assetsPath}`,
        ],
      },
      {
        include: fontAwesomePath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)?(\?\S*)?$/,
        loaders: [
          'file?name=assets/font-awesome/[name].[ext]?[hash:6]',
        ],
      },
    ],
  },
  postcss: function postCssPlugins() { return [autoprefixer]; },
};
