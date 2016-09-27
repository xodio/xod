const path = require('path');
const validate = require('webpack-validator');
const merge = require('webpack-merge');

const baseConfig = require('./base.js');

const config = merge.smart(baseConfig, {
  resolve: {
    modulesDirectories: ['node_modules', 'src', 'src/node_modules'],
  },
  module: {
    loaders: [
      {
        test: /.*\.spec\.js$/,
        loaders: [
          'babel?presets[]=es2015',
        ],
      },
      {
        test: /src\/runtime\/.*\.js$/,
        loader: 'babel?presets[]=es2015',
      },
      {
        test: /node_modules\/espruino\/.*\.js$/,
        loader: 'null',
      },
    ],
  },
  externals: [
    {
      'isomorphic-fetch': {
        root: 'isomorphic-fetch',
        commonjs2: 'isomorphic-fetch',
        commonjs: 'isomorphic-fetch',
        amd: 'isomorphic-fetch',
      },
    },
  ],
});

module.exports = validate(config);
