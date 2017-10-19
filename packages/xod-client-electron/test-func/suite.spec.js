import os from 'os';
import fsp from 'fsp';
import fse from 'fs-extra';
import path from 'path';

import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';

// Spectron is hoisted at the root of monorepo
// eslint-disable-next-line import/no-extraneous-dependencies
import { Application } from 'spectron';

import Page from './pageObject';

import { TRIGGER_MAIN_MENU_ITEM } from '../src/testUtils/triggerMainMenu';

chai.use(chaiAsPromised);

const DEBUG = process.env.XOD_DEBUG_TESTS;

const workspacePath = subPath => path.resolve(__dirname, '../../../workspace/', subPath);

describe('IDE', () => {
  let page;
  let app;
  let tmpHomeDir;
  let passed = true;

  before(() => {
    const tmpDir = path.join(os.tmpdir(), 'xod-test-workspace-');

    app = new Application({
      path: './node_modules/.bin/electron',
      args: ['.'],
    });

    // With a dirty hack we extract out objects that we’d interact later
    // in tests and tear-down. Impure, but can’t figure out a better solution
    // with Mocha
    return fsp.mkdtempP(tmpDir)
      .then((home) => { process.env.USERDATA_DIR = process.env.HOME = tmpHomeDir = home; })
      .then(() => app.start())
      .then(() => {
        page = Page.createPageObject(app.client);
        chaiAsPromised.transferPromiseness = app.transferPromiseness;
      });
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

    const shouldClose = app && app.isRunning() && (passed || !DEBUG);
    return shouldClose ?
      app.stop().then(() => fse.removeSync(tmpHomeDir)) :
      Promise.resolve();
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
      page.assertNodeAvailableInProjectBrowser('clock')
    );
  });

  describe('adding nodes to patch', () => {
    it('selects a node in project browser', () =>
      page.scrollToPatchInProjectBrowser('clock')
        .then(() => page.selectPatchInProjectBrowser('clock'))
        .then(() => page.assertPatchSelected('clock'))
    );

    it('adds a node to patch', () =>
      page.clickAddNodeButton('clock')
        .then(() => page.findNode('clock').isVisible())
    );

    it('drags a node in place', () =>
      assert.eventually.deepEqual(
        page.dragNode('clock', 150, 10).getLocation(),
        { x: 387, y: 81 }
      )
    );

    it('adds the rest of the nodes for the blink patch', () =>
      page.addNode('digital-output', 150, 300)
        .then(() => page.addNode('flip-flop', 150, 200))
    );
  });

  describe('creating links between nodes', () => {
    it('activates linking mode when clicking on a pin', () =>
      page.findPin('clock', 'TICK').click()
        .then(() => page.assertPinIsSelected('clock', 'TICK'))
    );

    it('marks pins that can be linked with selected pin', () =>
      Promise.all([
        page.assertPinIsAcceptingLinks('flip-flop', 'SET'),
        page.assertPinIsAcceptingLinks('flip-flop', 'TGL'),
        page.assertPinIsAcceptingLinks('flip-flop', 'RST'),
      ])
    );

    it('connects two compatible pins with a link', () =>
      page.findPin('flip-flop', 'TGL').click()
        .then(() => page.findLink('pulse'))
    );

    it('adds the rest of the links for the blink patch', () =>
      page.findPin('flip-flop', 'MEM').click()
        .then(() => page.findPin('digital-output', 'SIG').click())
    );
  });

  describe('binding values to inputs', () => {
    it('sets clock interval to 0.25', () =>
      page.bindValue('clock', 'IVAL', '0.25')
    );

    it('sets digital-output port to 13', () =>
      page.bindValue('digital-output', 'PORT', '13')
    );
  });

  describe('showing code for arduino', () => {
    const expectedCpp = fsp.readFileSync(
      workspacePath('blink/__fixtures__/arduino.cpp'),
      'utf-8'
    );

    it('shows code', () =>
      app.electron.ipcRenderer.emit(TRIGGER_MAIN_MENU_ITEM, ['Deploy', 'Show Code For Arduino'])
        .then(() => page.getCodeboxValue())
        .then(code => assert.strictEqual(code, expectedCpp, 'Actual and expected C++ don’t match'))
    );
  });
});
