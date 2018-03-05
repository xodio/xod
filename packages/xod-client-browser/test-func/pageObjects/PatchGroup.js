import BasePageObject from './BasePageObject';
import PatchGroupItem from './PatchGroupItem';

class PatchGroup extends BasePageObject {
  async _getTrigger() {
    return this.elementHandle.$('.PatchGroup__trigger');
  }

  async _getTriggerClassList() {
    const trigger = await this._getTrigger();
    const classList = await this.page.evaluate(
      el => Array.from(el.classList),
      trigger
    );
    return classList;
  }

  async isCollapsed() {
    const classList = await this._getTriggerClassList();
    return classList.includes('is-closed');
  }

  async isExpanded() {
    const classList = await this._getTriggerClassList();
    return classList.includes('is-open');
  }

  async clickOnTrigger() {
    const trigger = await this._getTrigger();
    await trigger.click();
  }

  async findPatchGroupItem(title) {
    const elementHandle = await this.elementHandle.$(
      `.PatchGroupItem[data-id="${title}"]`
    );
    if (!elementHandle) return null;
    return new PatchGroupItem(this.page, elementHandle);
  }
}

export default PatchGroup;
