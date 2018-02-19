import hasClass from '../utils/hasClass';
import getBoundingClientRect from '../utils/getBoundingClientRect';
import getCenterPositon from '../utils/getCenterPositon';
import drag from '../utils/drag';
import BasePageObject from './BasePageObject';
import Pin from './Pin';

class Node extends BasePageObject {
  getId() {
    return this.page.evaluate(
      el => el.id,
      this.elementHandle
    );
  }

  async getName() {
    return this.page.evaluate(
      el => el.textContent,
      await this.elementHandle.$('.nodeLabel')
    );
  }

  getBoundingClientRect() {
    return getBoundingClientRect(this.page, this.elementHandle);
  }

  isSelected() {
    return hasClass(this.page, this.elementHandle, 'is-selected');
  }

  async click() {
    // see https://github.com/GoogleChrome/puppeteer/issues/1247
    const rect = await getBoundingClientRect(this.page, this.elementHandle);
    const { x, y } = getCenterPositon(rect);
    await this.page.mouse.click(x, y);
  }

  drag(x, y) {
    return drag(
      this.page,
      this.elementHandle,
      { x, y }
    );
  }

  async findPinByName(name) {
    const nodeId = await this.getId();
    // generally we should use only `this.elementHandle.$`, but in this case it's unavoidable
    const pinElementHandle = await this.page.$(`#nodePinsOverlay_${nodeId} .PinOverlay[data-label="${name}"]`);

    if (!pinElementHandle) return null;

    return new Pin(this.page, pinElementHandle);
  }
}

Node.findByName = async (page, nodeName) => {
  const elementHandle = await page.$(`.Node[data-label="${nodeName}"]`);
  if (!elementHandle) return null;

  return new Node(page, elementHandle);
};

Node.findById = async (page, nodeId) => {
  const elementHandle = await page.$(`#${nodeId}`);
  if (!elementHandle) return null;

  return new Node(page, elementHandle);
};

export default Node;

export const getAllNodes = async (page) => {
  const elementHandles = await page.$$('.Node');
  return elementHandles.map(eh => new Node(page, eh));
};

export const getSelectedNodes = async (page) => {
  const elementHandles = await page.$$('.Node.is-selected');
  return elementHandles.map(eh => new Node(page, eh));
};
