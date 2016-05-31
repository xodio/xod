module.exports = function () {
    return {
        files: [
            '**/*.js',
            '!**/*.spec.js'
        ],
        tests: [
            'webpack-ng2/**/*.spec.js'
        ],
        testFramework: 'jasmine',
        preprocessors: {
            '**/*.js': file => require('babel-core').transform(file.content, {sourceMap: true, filename: file.path})
        },
        env: {
            type: 'node',
            params: {
                runner: '--harmony --harmony_arrow_functions'
            }
        }
    };
};
