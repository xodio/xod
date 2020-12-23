import BasePageObject from './BasePageObject';
import hasClass from '../utils/hasClass';
import getBoundingClientRect from '../utils/getBoundingClientRect';
import getCenterPositon from '../utils/getCenterPositon';

class Debugger extends BasePageObject {
  async isCollapsed() {
    return await hasClass(this.page, this.elementHandle, 'isCollapsed');
  }
  async isOpened() {
    return !await this.isCollapsed();
  }
  async click() {
    // see https://github.com/GoogleChrome/puppeteer/issues/1247
    const rect = await getBoundingClientRect(this.page, this.elementHandle);
    const { x, y } = getCenterPositon(rect);
    await this.page.mouse.click(x, y);
  }

  async findCopyLogButton() {
    return await this.elementHandle.$('.copy-log');
  }
  async findSaveLogButton() {
    return await this.elementHandle.$('.save-log');
  }
}

Debugger.findOnPage = async page => {
  const elementHandle = await page.$('.Debugger');
  return new Debugger(page, elementHandle);
};

export default Debugger;
