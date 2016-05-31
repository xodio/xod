var precss = require('precss');
var autoprefixer = require('autoprefixer');
var postcssImport = require('postcss-import');
var webpack = require("webpack");

module.exports = {
    postcss: function () {
        return [
            precss,
            autoprefixer,
            postcssImport({
                addDependencyTo: webpack
            })
        ];
    }
};
