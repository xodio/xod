/* global browser:false, assert:false */

import getPage from './utils/getPage';

import ProjectBrowser from './pageObjects/ProjectBrowser';
import PatchGroupItemContextMenu from './pageObjects/PatchGroupItemContextMenu';
import ConfirmationPopup from './pageObjects/ConfirmationPopup';
import EditorTab from './pageObjects/EditorTab';

it('deletes an open patch', async () => {
  const page = await getPage(browser);
  const projectBrowser = await ProjectBrowser.findOnPage(page);

  const patchGroup = await projectBrowser.findPatchGroup('welcome-to-xod');
  await patchGroup.clickOnTrigger();
  assert.isTrue(
    await patchGroup.isExpanded(),
    'patch group is open'
  );

  const patchGroupItem = await patchGroup.findPatchGroupItem('01-hello');
  await patchGroupItem.click();
  assert.isTrue(
    await patchGroupItem.isSelected(),
    'patch is selected'
  );

  await patchGroupItem.rightClickContextMenuTrigger();

  const contextMenu = await PatchGroupItemContextMenu.findOnPage(page);
  await contextMenu.clickDelete();

  const popup = await ConfirmationPopup.findOnPage(page);
  assert.equal(
    await popup.getTitle(),
    'Delete the patch'
  );
  await popup.clickConfirm();

  assert.isNull(
    await EditorTab.findByName(page, '01-hello'),
    'tab is closed'
  );

  assert.isNull(
    await patchGroup.findPatchGroupItem('01-hello'),
    'patch is not available in project browser'
  );
});
