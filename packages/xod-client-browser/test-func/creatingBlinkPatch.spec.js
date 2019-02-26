/* global browser:false, assert:false */

import path from 'path';
import fs from 'fs';

import getPage from './utils/getPage';

import ProjectBrowser from './pageObjects/ProjectBrowser';
import PromptPopup from './pageObjects/PromptPopup';
import EditorTab from './pageObjects/EditorTab';
import Node, { getAllNodes, getSelectedNodes } from './pageObjects/Node';
import { getLinksOfType } from './pageObjects/Link';
import Inspector from './pageObjects/Inspector';
import Menubar from './pageObjects/Menubar';
import TranspiledCodePopup from './pageObjects/TranspiledCodePopup';

const workspacePath = subPath =>
  path.resolve(__dirname, '../../../workspace/', subPath);

describe('creating blink patch', () => {
  let page;
  let projectBrowser;

  before(async () => {
    page = await getPage(browser);
    projectBrowser = await ProjectBrowser.findOnPage(page);
  });

  it('creates a new patch', async () => {
    projectBrowser.clickCreatePatch();

    const popup = await PromptPopup.waitOnPage(page);
    assert.equal(await popup.getTitle(), 'Create new patch');
    await popup.typeText('my-blink');
    await popup.clickConfirm();

    assert.isNull(await PromptPopup.findOnPage(page), 'prompt popup is closed');

    const activeTab = await EditorTab.findActive(page);
    assert.equal(
      await activeTab.getName(),
      'my-blink',
      'tab the new patch is opened'
    );
  });

  // TODO: move this to a separate test?
  it('has xod/core available in project browser', async () => {
    const xodCorePatchGroup = await projectBrowser.findPatchGroup('xod/core');

    assert.isNotNull(xodCorePatchGroup, 'xod/core patch group exists');

    assert.isTrue(
      await xodCorePatchGroup.isCollapsed(),
      'it`s initially collapsed'
    );

    await xodCorePatchGroup.clickOnTrigger();
    assert.isTrue(
      await xodCorePatchGroup.isExpanded(),
      'it`s expanded after click'
    );

    assert.isNotNull(
      await xodCorePatchGroup.findPatchGroupItem('clock'),
      'it provides a clock node'
    );
  });

  it('adds a node to patch', async () => {
    assert.isEmpty(
      await getAllNodes(page),
      'initially patch contains no nodes'
    );

    await projectBrowser.addNodeViaContextMenu('xod/core', 'clock');

    const nodes = await getAllNodes(page);

    assert.equal(nodes.length, 1, 'only a single node is added');
    assert.isTrue(await nodes[0].isSelected(), 'created node is selected');
    assert.equal(
      await nodes[0].getName(),
      'clock',
      'created node has intended type'
    );
  });

  it('drags a node in place', async () => {
    const clockNode = await Node.findByName(page, 'clock');
    await clockNode.drag(150, 10);

    const { x, y } = await clockNode.getBoundingClientRect();
    assert.deepEqual({ x, y }, { x: 400.5, y: 142.5 });
  });

  it('adds rest of the nodes needed for blink patch', async () => {
    // please note that nodes must be added in this specific order,
    // or else the order of implementations in transpiled code is different from fixture
    await projectBrowser.addNodeViaContextMenu('xod/gpio', 'digital-write');
    const [digitalOutputNode] = await getSelectedNodes(page);
    await digitalOutputNode.drag(150, 250);

    await projectBrowser.addNodeViaContextMenu('xod/core', 'flip-flop');
    const [flipFlopNode] = await getSelectedNodes(page);
    await flipFlopNode.drag(150, 150);
  });

  it('creates links between nodes', async () => {
    const clockNode = await Node.findByName(page, 'clock');
    const flipFlopNode = await Node.findByName(page, 'flip-flop');
    const digitalOutputNode = await Node.findByName(page, 'digital-write');

    const clockTickPin = await clockNode.findPinByName('TICK');

    await clockTickPin.click();
    assert.isTrue(
      await clockTickPin.isSelected(),
      'clicking on pin selects it'
    );

    const ffSetPin = await flipFlopNode.findPinByName('SET');
    const ffTglPin = await flipFlopNode.findPinByName('TGL');
    const ffRstPin = await flipFlopNode.findPinByName('RST');

    assert.deepEqual(
      await Promise.all([
        ffSetPin.isAcceptingLinks(),
        ffTglPin.isAcceptingLinks(),
        ffRstPin.isAcceptingLinks(),
      ]),
      [true, true, true],
      'pins that can be linked with selected pin are marked'
    );

    await ffTglPin.click();

    const pulseLinks = await getLinksOfType(page, 'pulse');
    assert.equal(pulseLinks.length, 1, 'link is created');

    // add the rest of the links needed for blibk patch
    const ffMemPin = await flipFlopNode.findPinByName('MEM');
    await ffMemPin.click();
    const doSigPin = await digitalOutputNode.findPinByName('SIG');
    await doSigPin.click();
  });

  it('binds values to outputs in Inspector', async () => {
    const inspector = await Inspector.findOnPage(page);
    const clockNode = await Node.findByName(page, 'clock');
    const digitalOutputNode = await Node.findByName(page, 'digital-write');

    await clockNode.click();
    await inspector.setPinValue('IVAL', '0.25');

    await digitalOutputNode.click();
    await inspector.setPinValue('PORT', 'D13');
  });

  it('shows transpiled code for arduino', async () => {
    const menubar = await Menubar.findOnPage(page);

    await menubar.clickTopLevelItem('Deploy');
    await menubar.clickMenuItem('Show Code for Arduino');

    const codePopup = await TranspiledCodePopup.waitOnPage(page);
    const code = await codePopup.getCode();

    const expectedCode = fs.readFileSync(
      workspacePath('blink/__fixtures__/arduino.cpp'),
      'utf-8'
    );

    assert.equal(
      code,
      expectedCode,
      'transpiled code is equivalent to fixture'
    );
  });
});
