const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
const webpack = require('webpack');
/* eslint-enable import/no-extraneous-dependencies */
const getBaseConfig = require('xod-client/webpack.config');

const pkgpath = subpath => path.resolve(__dirname, subpath);

module.exports = merge.smart(getBaseConfig(__dirname), {
  target: 'electron-renderer',
  entry: [
    pkgpath('src/view/styles/main.scss'),
  ],
  output: {
    filename: 'bundle.js',
    path: pkgpath('src-babel'),
    publicPath: '',
  },
  externals: {
    // Webpack can’t package native modules
    // keep them external
    bindings: 'commonjs bindings',
    serialport: 'commonjs serialport',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.XOD_HM_DEF': JSON.stringify(process.env.XOD_HM_DEF || false),

      'process.env.XOD_HOSTNAME': JSON.stringify(process.env.XOD_HOSTNAME || 'xod.io'),
      'process.env.XOD_SITE_DOMAIN': JSON.stringify('https://xod.io/'),
      'process.env.XOD_FORUM_DOMAIN': JSON.stringify('https://forum.xod.io/'),
      'process.env.XOD_UTM_SOURCE': JSON.stringify('ide-desktop'),
    }),
  ],
});
