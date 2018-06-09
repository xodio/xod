import BasePageObject from './BasePageObject';

class PatchGroupItemContextMenu extends BasePageObject {
  async _clickItemWithId(itemId) {
    const item = await this.elementHandle.$(
      `.react-contextmenu-item[data-id="${itemId}"]`
    );
    // Hover before Click is workaround over strange error:
    // https://github.com/GoogleChrome/puppeteer/issues/1769
    await item.hover();
    await item.click();
  }

  clickOpen() {
    return this._clickItemWithId('open');
  }
  clickPlace() {
    return this._clickItemWithId('place');
  }
  clickRename() {
    return this._clickItemWithId('rename');
  }
  clickDelete() {
    return this._clickItemWithId('delete');
  }
  clickHelp() {
    return this._clickItemWithId('help');
  }
}

PatchGroupItemContextMenu.findOnPage = async page => {
  const elementHandle = await page.$('.ContextMenu--PatchGroupItem');
  return new PatchGroupItemContextMenu(page, elementHandle);
};

export default PatchGroupItemContextMenu;
