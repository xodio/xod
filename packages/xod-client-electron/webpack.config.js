const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
const webpack = require('webpack');
/* eslint-enable import/no-extraneous-dependencies */
const getBaseConfig = require('xod-client/webpack.config');

const pkgpath = subpath => path.resolve(__dirname, subpath);

module.exports = merge.smart(getBaseConfig(__dirname), {
  target: 'electron-renderer',
  node: {
    __dirname: false,
    __filename: false,
  },
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
    // Workaround to remove iconv warning:
    // "Critical dependency: the request of a dependency is an expression"
    // See: https://github.com/andris9/encoding/issues/16
    new webpack.NormalModuleReplacementPlugin(/iconv-loader$/, 'node-noop'),
    // Disable warnings produced by `ws` that used in the `xod-deploy`
    // It happens, cause `ws` is server-side only package
    // But webpack bundles client-side code
    // And `ws` should be never used on client-size (use native `WebSocket`)
    new webpack.IgnorePlugin(/bufferutil|utf-8-validate/),
  ],
});
