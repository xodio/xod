/* global browser */

/* eslint-disable import/no-extraneous-dependencies */
import puppeteer from 'puppeteer';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
/* eslint-enable import/no-extraneous-dependencies */

import { assert } from 'chai';
import R from 'ramda';
import config from '../webpack.config.test';

import { PORT } from './server.config';

const globalVariables = R.pick(['browser', 'assert'], global);

const startServer = () =>
  new Promise((resolve, reject) => {
    const compiler = webpack(config);
    const server = new WebpackDevServer(compiler);
    // Replace the next line with `compiler.hooks.done.tap('onDone', ...`
    // after upgrading webpack to version >4
    compiler.plugin('done', () => {
      resolve(server);
    });
    server.listen(PORT, 'localhost', err => {
      if (err) {
        console.error(err); // eslint-disable-line no-console
        reject(err);
      }
    });
  });

before(async () => {
  global.server = await startServer();
  global.assert = assert;
  global.browser = await puppeteer.launch({
    args: [
      '--no-sandbox', // @see https://github.com/GoogleChrome/puppeteer/issues/290
    ],
    headless: !process.env.XOD_DEBUG_TESTS,
    slowMo: 10,
    timeout: 10000,
  });
});

after(() => {
  browser.close();
  global.server.close(() => {});

  global.browser = globalVariables.browser;
  global.assert = globalVariables.assert;
});
