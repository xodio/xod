const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
/* eslint-enable import/no-extraneous-dependencies */
const baseConfig = require('./webpack.config.js');

const pkgpath = subpath => path.join(__dirname, subpath);

const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: ['react', 'es2015'],
    plugins: ['transform-object-rest-spread'],
  },
};

module.exports = merge.smart(baseConfig, {
  devtool: 'eval-source-map',
  output: {
    publicPath: 'http://localhost:8080/',
  },
  devServer: {
    hot: false,
    host: 'localhost',
    port: 8080,
    contentBase: pkgpath('dist'),
    compress: true,
  },
  module: {
    rules: [
      {
        test: /xod-client\/.+(components|containers)\/.+\.js$/,
        use: [
          {
            loader: 'expose-loader',
            options: {
              exposes: {
                globalName: 'Components.[name]',
                moduleLocalName: 'default',
              },
            },
          },
        ],
      },
      {
        test: /\.jsx$/,
        use: [
          {
            loader: 'expose-loader',
            options: {
              exposes: {
                globalName: 'Components.[name]',
                moduleLocalName: 'default',
                override: true,
              },
            },
          },
          babelLoader,
        ],
      },
    ],
  },
});
