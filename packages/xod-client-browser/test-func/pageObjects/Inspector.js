import BasePageObject from './BasePageObject';
import Input from './Input';

class Inspector extends BasePageObject {
  async setPinValue(pinName, value) {
    const pinInput = new Input(
      this.page,
      await this.elementHandle.$(`.PinWidget[data-pinlabel="${pinName}"] input`)
    );
    await pinInput.type(value);
    await pinInput.pressEnter();
  }

  async getDescriptionElement() {
    return new Input(
      this.page,
      await this.elementHandle.$('.DescriptionWidget textarea')
    );
  }

  async setDescription(value) {
    const input = this.getDescriptionElement();
    await input.type(value);
    await input.pressEnter();
  }
}

Inspector.findOnPage = async page => {
  const elementHandle = await page.$('.Inspector');
  return new Inspector(page, elementHandle);
};

export default Inspector;
