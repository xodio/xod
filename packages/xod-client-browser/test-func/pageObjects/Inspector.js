import BasePageObject from './BasePageObject';

class Inspector extends BasePageObject {
  async setPinValue(pinName, value) {
    const inputElementHandle = await this.elementHandle.$(
      `.PinWidget[title="${pinName}"] input`
    );
    await this.page.evaluate(input => {
      // eslint-disable-next-line no-param-reassign
      input.value = '';
    }, inputElementHandle);
    await inputElementHandle.type(value);
    await inputElementHandle.press('Enter');
  }
}

Inspector.findOnPage = async page => {
  const elementHandle = await page.$('.Inspector');
  return new Inspector(page, elementHandle);
};

export default Inspector;
