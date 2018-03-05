import BasePageObject from './BasePageObject';

class TranspiledCodePopup extends BasePageObject {
  async getCode() {
    const textarea = await this.elementHandle.$('textarea.Codebox');

    return this.page.evaluate(el => el.value, textarea);
  }
}

TranspiledCodePopup.findOnPage = async page => {
  const elementHandle = await page.$('.CodeboxModalContent');
  if (!elementHandle) return null;

  return new TranspiledCodePopup(page, elementHandle);
};

TranspiledCodePopup.waitOnPage = async page => {
  await page.waitFor('.CodeboxModalContent', { timeout: 10000 });
  return TranspiledCodePopup.findOnPage(page);
};

export default TranspiledCodePopup;
