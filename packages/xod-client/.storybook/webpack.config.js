const fs = require('fs');
const path = require('path');

const pkgpath = subpath => path.resolve(__dirname, '..', subpath);
const assetsPath = pkgpath('src/core/assets');
const fontAwesomePath = pkgpath('../../node_modules/font-awesome');

module.exports = {
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      // until https://github.com/wycats/handlebars.js/issues/1102 is resolved
      handlebars: 'handlebars/dist/handlebars.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: (loader) => [
                require('autoprefixer')(),
              ]
            },
          },
          {
            loader: 'sass-loader',
            options: {
              outputStyle: 'expanded'
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        include: assetsPath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/[path][name].[ext]?[hash:6]',
              context: assetsPath,
            }
          }
        ],
      },
      {
        include: fontAwesomePath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)?(\?\S*)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/font-awesome/[name].[ext]?[hash:6]',
            }
          }
        ],
      },
    ],
  },
};
