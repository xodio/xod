import hasClass from '../utils/hasClass';
import BasePageObject from './BasePageObject';

class PatchGroupItem extends BasePageObject {
  async click() {
    // Hover before Click is workaround over strange error:
    // https://github.com/GoogleChrome/puppeteer/issues/1769
    await this.elementHandle.hover();
    return this.elementHandle.click();
  }

  async rightClickContextMenuTrigger() {
    const contextMenuTrigger = await this.elementHandle.$('.contextmenu');
    await contextMenuTrigger.click({ button: 'right' });
  }

  isSelected() {
    return hasClass(this.page, this.elementHandle, 'isSelected');
  }
}

export default PatchGroupItem;
