import scrollTo from '../utils/scrollTo';
import BasePageObject from './BasePageObject';
import PatchGroup from './PatchGroup';
import PatchGroupItemContextMenu from './PatchGroupItemContextMenu';

class ProjectBrowser extends BasePageObject {
  async findPatchGroup(title) {
    const [patchGroupElementHandle] = await this.elementHandle.$x(
      `//*[@class="PatchGroup"][.//text()="${title}"]`
    );
    if (!patchGroupElementHandle) return null;
    return new PatchGroup(this.page, patchGroupElementHandle);
  }

  async clickCreatePatch() {
    const newPatchButton = await this.elementHandle.$('.newpatch');
    await newPatchButton.click();
  }

  async clickAddLibrary() {
    const addLibButton = await this.elementHandle.$('.addlib');
    await addLibButton.click();
  }

  async scrollToPatchGroupItem(groupName, itemName) {
    const group = await this.findPatchGroup(groupName);

    if (await group.isCollapsed()) {
      await group.clickOnTrigger();
    }

    const item = await group.findPatchGroupItem(itemName);

    // TODO: check for invariants?

    await scrollTo(
      this.page,
      await this.elementHandle.$('.inner-container'),
      item.elementHandle
    );

    return item;
  }

  async addNodeViaContextMenu(groupName, itemName) {
    const item = await this.scrollToPatchGroupItem(groupName, itemName);

    await item.click();
    await item.rightClickContextMenuTrigger();

    const contextMenu = await PatchGroupItemContextMenu.findOnPage(this.page);
    await contextMenu.clickPlace();
  }
}

ProjectBrowser.findOnPage = async page => {
  const elementHandle = await page.$('.ProjectBrowser');
  return new ProjectBrowser(page, elementHandle);
};

export default ProjectBrowser;
