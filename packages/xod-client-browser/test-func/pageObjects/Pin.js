import hasClass from '../utils/hasClass';
import getBoundingClientRect from '../utils/getBoundingClientRect';
import getCenterPositon from '../utils/getCenterPositon';
import BasePageObject from './BasePageObject';

class Pin extends BasePageObject {
  isSelected() {
    return hasClass(this.page, this.elementHandle, 'is-selected');
  }

  isAcceptingLinks() {
    return hasClass(this.page, this.elementHandle, 'is-accepting-links');
  }

  async click() {
    // see https://github.com/GoogleChrome/puppeteer/issues/1247
    const rect = await getBoundingClientRect(this.page, this.elementHandle);
    const { x, y } = getCenterPositon(rect);
    await this.page.mouse.click(x, y);
  }
}

export default Pin;
