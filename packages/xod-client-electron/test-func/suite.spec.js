
const fsp = require('fsp');
const fse = require('fs-extra');
const os = require('os');
const path = require('path');
const Page = require('./pageObject');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Spectron is hoisted at the root of monorepo
// eslint-disable-next-line import/no-extraneous-dependencies
const Application = require('spectron').Application;

chai.use(chaiAsPromised);
const assert = chai.assert;

const DEBUG = process.env.XOD_DEBUG_TESTS;

describe('IDE', () => {
  let page;
  let app;
  let tmpHomeDir;
  let passed = true;

  before(() => {
    app = new Application({
      path: './node_modules/.bin/electron',
      args: ['.'],
    });

    // With a dirty hack we extract out objects that we’d interact later
    // in tests and tear-down. Impure, but can’t figure out a better solution
    // with Mocha
    return fsp.mkdtempP(path.join(os.tmpdir(), 'xod-test-workspace-'))
      .then((home) => { process.env.HOME = tmpHomeDir = home; })
      .then(() => app.start())
      .then(() => { page = Page.createPageObject(app.client); });
  });

  before(() => {
    chaiAsPromised.transferPromiseness = app.transferPromiseness;
  });

  afterEach(function checkForFailure() {
    if (this.currentTest.state === 'failed') {
      passed = false;
    }
  });

  after(() => {
    if (!passed || DEBUG) {
      app.client.getMainProcessLogs().then((logs) => {
        logs.forEach(console.log); // eslint-disable-line no-console
      });
    }

    fse.removeSync(tmpHomeDir);
    const shouldClose = app && app.isRunning() && (passed || !DEBUG);
    return shouldClose ? app.stop() : Promise.resolve();
  });

  it('opens a window', () =>
    assert.eventually.isTrue(app.browserWindow.isVisible())
  );

  it('has proper title', () =>
    assert.eventually.strictEqual(app.client.getTitle(), 'XOD')
  );

  describe('creating a new patch', () => {
    it('prompts for a name', () =>
      page.clickAddPatch()
        .then(() => page.assertPopupShown('Create new patch'))
    );

    it('closes popup on confirm', () =>
      page.findPopup().setValue('input', 'my-blink')
        .then(() => page.confirmPopup())
        .then(() => page.assertNoPopups())
    );

    it('opens new tab for the new patch', () =>
      page.assertActiveTabHasTitle('my-blink')
    );
  });

  describe('xod/core library', () => {
    it('provides a patch group that is collapsed initially', () =>
      page.assertPatchGroupCollapsed('xod/core')
    );

    it('expands on click', () =>
      page.findPatchGroup('xod/core').click()
        .then(() => page.assertPatchGroupExpanded('xod/core'))
    );

    it('provides clock node', () =>
      page.assertNodeAvailableInBrowser('clock')
    );
  });
});
