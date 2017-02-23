const R = require('ramda');
// TODO: although this is very convinient, we create thght coupling with xod-client-browser package
const clientBrowserConfig = require('../../xod-client-browser/webpack.config');

module.exports = R.omit(['entry', 'output', 'plugins'], clientBrowserConfig);
