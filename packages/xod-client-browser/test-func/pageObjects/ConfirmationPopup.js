import BasePageObject from './BasePageObject';

class ConfirmationPopup extends BasePageObject {
  async getTitle() {
    const titleElementHandle = await this.elementHandle.$('.skylight-title');

    const title = await this.page.evaluate(
      el => el.textContent,
      titleElementHandle
    );

    return title;
  }

  async clickConfirm() {
    const button = await this.elementHandle.xpath('//button[.//text()="Confirm"]');
    await button.click();
  }
}

ConfirmationPopup.findOnPage = async (page) => {
  const elementHandle = await page.$('.PopupConfirm');
  if (!elementHandle) return null;
  return new ConfirmationPopup(page, elementHandle);
};

export default ConfirmationPopup;
