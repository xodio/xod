import os from 'os';
import fsp from 'fsp';
import fse from 'fs-extra';
import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

// Spectron is hoisted at the root of monorepo
// eslint-disable-next-line import/no-extraneous-dependencies
import { Application } from 'spectron';

import Page from './pageObject';

const DEBUG = process.env.XOD_DEBUG_TESTS;

// =============================================================================
//
// Prepare new suite
//
// =============================================================================

export default function prepareSuite() {
  chai.use(chaiAsPromised);

  const state = {
    passed: true,
  };

  before(() => {
    const tmpDir = path.join(os.tmpdir(), 'xod-test-workspace-');

    state.app = new Application({
      path: '../../node_modules/.bin/electron',
      args: ['.'],
    });

    // With a dirty hack we extract out objects that we’d interact later
    // in tests and tear-down. Impure, but can’t figure out a better solution
    // with Mocha
    return fsp.mkdtempP(tmpDir)
      .then((home) => {
        process.env.USERDATA_DIR = process.env.HOME = state.tmpHomeDir = home;
      })
      .then(() => state.app.start())
      .then(() => {
        state.page = Page.createPageObject(state.app.client);
        chaiAsPromised.transferPromiseness = state.app.transferPromiseness;
      });
  });

  afterEach(function checkForFailure() {
    if (this.currentTest.state === 'failed') {
      state.passed = false;
    }
  });

  after(() => {
    if (!state.passed || DEBUG) {
      state.app.client.getMainProcessLogs().then((logs) => {
        logs.forEach(console.log); // eslint-disable-line no-console
      });
    }

    const shouldClose = state.app && state.app.isRunning() && (state.passed || !DEBUG);
    return shouldClose
      // TODO: simulating click on 'confirm' is probably cleaner
      ? state.app.electron.ipcRenderer.send('CONFIRM_CLOSE_WINDOW')
        .then(() => fse.remove(state.tmpHomeDir))
      : Promise.resolve();
  });

  return state;
}
