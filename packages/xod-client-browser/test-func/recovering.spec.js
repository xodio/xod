/* global browser:false, assert:false */

import getPage from './utils/getPage';

import ProjectBrowser from './pageObjects/ProjectBrowser';
import PromptPopup from './pageObjects/PromptPopup';
import IdeCrashReport from './pageObjects/IdeCrashReport';
import { getAllNodeIds, getSelectedNodes } from './pageObjects/Node';

it('Recovers on IDE crash', async () => {
  const page = await getPage(browser);

  // Recovering of the IDE recreates all components,
  // so we have to find this element again after recovering finished
  let projectBrowser = await ProjectBrowser.findOnPage(page);

  // Create a new patch
  projectBrowser.clickCreatePatch();

  const popup = await PromptPopup.waitOnPage(page);
  await popup.typeText('test-recover');
  await popup.clickConfirm();

  // Mock the `render` method of Link to emulate a React Error
  await page.evaluate(() => {
    window.Components.Link.prototype.render = function erroredRender() {
      throw new Error('CATCH ME');
    };
  });

  // Add first node
  await projectBrowser.addNodeViaContextMenu('xod/core', 'clock');
  const [clockNode] = await getSelectedNodes(page);
  await clockNode.drag(150, 150);

  // Add second node
  await projectBrowser.addNodeViaContextMenu('xod/core', 'flip-flop');
  const [flipFlopNode] = await getSelectedNodes(page);
  await flipFlopNode.drag(150, 250);

  // Begin linking: click on first pin
  const clockTickPin = await clockNode.findPinByName('TICK');
  await clockTickPin.click();
  // It will create a Link, which render method are broken for the test
  // So the IDE should catch the Error and recover to the previous state

  // Test that state recovered and error has been shown
  const crashReport = await IdeCrashReport.waitOnPage(page);
  const report = await crashReport.getErrorReport();

  // Report contains a lot of data, so we'll check only first two rows
  const expectedFirstRowsOfReport = [
    '# ERROR',
    "Error: A cross-origin error was thrown. React doesn't have access to the actual error object in development. See https://fb.me/react-crossorigin-error for more information.",
  ].join('\n');
  assert.equal(report.split('\n', 2).join('\n'), expectedFirstRowsOfReport);

  // Test that report can be closed
  await crashReport.clickClose();
  assert.isNull(
    await IdeCrashReport.findOnPage(page),
    'Crash report element is closed'
  );

  // Test that state was recovered correctly (the patch has placed nodes)
  const expectedNodesOnPatch = [
    await clockNode.getId(),
    await flipFlopNode.getId(),
  ];
  assert.sameMembers(
    await getAllNodeIds(page),
    expectedNodesOnPatch,
    'The patch should contain the same nodes after recovering'
  );

  // Renew the `projectBrowser` page object
  projectBrowser = await ProjectBrowser.findOnPage(page);

  // Test that IDE still works (add one more node)
  await projectBrowser.addNodeViaContextMenu('xod/gpio', 'digital-write');
  const [digitalWrite] = await getSelectedNodes(page);
  await digitalWrite.drag(150, 350);

  // Test that the third node was added successfully
  assert.sameMembers(
    await getAllNodeIds(page),
    [...expectedNodesOnPatch, await digitalWrite.getId()],
    'The patch should contain the same nodes after recovering'
  );
});
