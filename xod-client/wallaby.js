'use strict';

var webpackConfig = require('./webpack.config.js');
var wallabyWebpack = require('wallaby-webpack');
var webpackPostprocessor = wallabyWebpack();

module.exports = function (wallaby) {
  return {
    files: [
      { pattern: 'app/**/*.jsx', load: false },
      { pattern: 'app/**/*.js', load: false }
    ],

    tests: [
      { pattern: 'test/**/*Spec.js', load: false }
    ],

    compilers: {
      '**/*.jsx': wallaby.compilers.babel(),
      '**/*.js': wallaby.compilers.babel()
    },

    postprocessor: webpackPostprocessor,

    bootstrap: function () {
      window.__moduleBundler.loadTests();
    },

    env: {
      type: 'browser',
      runner: require('phantomjs2-ext').path,
      params: { runner: '--web-security=false' }
    },
    setup: function (wallaby) {
      require("babel-polyfill");
    }
  };
};
