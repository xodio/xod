import hasClass from '../utils/hasClass';
import BasePageObject from './BasePageObject';

class PatchGroupItem extends BasePageObject {
  click() {
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
