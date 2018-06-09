/* global browser, assert */

// eslint-disable-next-line import/no-extraneous-dependencies
import puppeteer from 'puppeteer';
import { assert } from 'chai';
import R from 'ramda';

const { startServer, stopServer } = require('../tools/staticServer');

const globalVariables = R.pick(['browser', 'assert'], global);

before(async () => {
  await startServer();

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
  stopServer();

  global.browser = globalVariables.browser;
  global.assert = globalVariables.assert;
});
