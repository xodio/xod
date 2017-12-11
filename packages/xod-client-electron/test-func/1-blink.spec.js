import fsp from 'fsp';
import path from 'path';

import { assert } from 'chai';

import prepareSuite from './prepare';

import { TRIGGER_MAIN_MENU_ITEM } from '../src/testUtils/triggerMainMenu';

const workspacePath = subPath => path.resolve(__dirname, '../../../workspace/', subPath);

describe('IDE: Blink project', () => {
  const ide = prepareSuite();

  it('opens a window', () =>
    assert.eventually.isTrue(ide.app.browserWindow.isVisible())
  );

  it('has proper title', () =>
    assert.eventually.strictEqual(ide.app.client.getTitle(), 'XOD')
  );

  it('IDE loaded and rendered', () => ide.page.rendered());

  describe('deleting opened patch', () => {
    const patchGroup = 'welcome-to-xod';
    const patchName = '01-hello';

    it('expands a patch group with the opened patch in located', () =>
      ide.page.findPatchGroup(patchGroup).click()
        .then(() => ide.page.assertPatchGroupExpanded(patchGroup))
    );

    it('deletes the patch', () =>
      ide.page.deletePatch(patchName)
        .then(() => ide.page.assertNodeUnavailableInProjectBrowser(patchName))
        .then(() => ide.page.assertTabWithTitleDoesNotExist(patchName))
        .then(() => ide.page.assertNoPatchesAreOpen())
        // close patch group to restore initial state
        .then(() => ide.page.findPatchGroup(patchGroup).click())
    );
  });

  describe('creating a new patch', () => {
    it('prompts for a name', () =>
      ide.page.clickAddPatch()
        .then(() => ide.page.assertPopupShown('Create new patch'))
    );

    it('closes popup on confirm', () =>
      ide.page.findPopup().setValue('input', 'my-blink')
        .then(() => ide.page.confirmPopup())
        .then(() => ide.page.assertNoPopups())
    );

    it('opens new tab for the new patch', () =>
      ide.page.assertActiveTabHasTitle('my-blink')
    );
  });

  describe('xod/core library', () => {
    it('provides a patch group that is collapsed initially', () =>
      ide.page.assertPatchGroupCollapsed('xod/core')
    );

    it('expands on click', () =>
      ide.page.findPatchGroup('xod/core').click()
        .then(() => ide.page.assertPatchGroupExpanded('xod/core'))
    );

    it('provides clock node', () =>
      ide.page.assertNodeAvailableInProjectBrowser('clock')
    );
  });

  describe('adding nodes to patch', () => {
    it('selects a node in project browser', () =>
      ide.page.scrollToPatchInProjectBrowser('clock')
        .then(() => ide.page.selectPatchInProjectBrowser('clock'))
        .then(() => ide.page.assertPatchSelected('clock'))
    );

    it('adds a node to patch', () =>
      ide.page.clickAddNodeButton('clock')
        .then(() => ide.page.findNode('clock').isVisible())
    );

    it('drags a node in place', () =>
      assert.eventually.deepEqual(
        ide.page.dragNode('clock', 150, 10).getLocation(),
        { x: 387, y: 81 }
      )
    );

    it('adds the rest of the nodes for the blink patch', () =>
      ide.page.addNode('digital-output', 150, 300)
        .then(() => ide.page.addNode('flip-flop', 150, 200))
    );
  });

  describe('creating links between nodes', () => {
    it('activates linking mode when clicking on a pin', () =>
      ide.page.findPin('clock', 'TICK').click()
        .then(() => ide.page.assertPinIsSelected('clock', 'TICK'))
    );

    it('marks pins that can be linked with selected pin', () =>
      Promise.all([
        ide.page.assertPinIsAcceptingLinks('flip-flop', 'SET'),
        ide.page.assertPinIsAcceptingLinks('flip-flop', 'TGL'),
        ide.page.assertPinIsAcceptingLinks('flip-flop', 'RST'),
      ])
    );

    it('connects two compatible pins with a link', () =>
      ide.page.findPin('flip-flop', 'TGL').click()
        .then(() => ide.page.findLink('pulse'))
    );

    it('adds the rest of the links for the blink patch', () =>
      ide.page.findPin('flip-flop', 'MEM').click()
        .then(() => ide.page.findPin('digital-output', 'SIG').click())
    );
  });

  describe('binding values to inputs', () => {
    it('sets clock interval to 0.25', () =>
      ide.page.bindValue('clock', 'IVAL', '0.25')
    );

    it('sets digital-output port to 13', () =>
      ide.page.bindValue('digital-output', 'PORT', '13')
    );
  });

  describe('showing code for arduino', () => {
    const expectedCpp = fsp.readFileSync(
      workspacePath('blink/__fixtures__/arduino.cpp'),
      'utf-8'
    );

    it('shows code', () =>
      ide.app.electron.ipcRenderer.emit(TRIGGER_MAIN_MENU_ITEM, ['Deploy', 'Show Code For Arduino'])
        .then(() => ide.page.getCodeboxValue())
        .then(code => assert.strictEqual(code, expectedCpp, 'Actual and expected C++ don’t match'))
    );
    it('closes show code popup', () =>
      ide.page.closePopup()
    );
  });

  describe('deleting a patch', () => {
    it('deletes "my-blink" patch', () =>
      ide.page.findPatchGroup('welcome-to-xod').click()
        .then(() => ide.page.assertPatchGroupExpanded('welcome-to-xod'))
        .then(() => ide.page.deletePatch('my-blink'))
        .then(() => ide.page.assertNodeUnavailableInProjectBrowser('my-blink'))
        .then(() => ide.page.assertTabWithTitleDoesNotExist('my-blink'))
    );
  });
});
