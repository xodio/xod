import BasePageObject from './BasePageObject';

class Input extends BasePageObject {
  async evaluate(fn) {
    await this.page.evaluate(fn, this.elementHandle);
  }

  async focus() {
    await this.evaluate(input => {
      // eslint-disable-next-line no-param-reassign
      input.focus();
    });
  }
  async type(value) {
    await this.page.evaluate(input => {
      // eslint-disable-next-line no-param-reassign
      input.value = '';
    }, this.elementHandle);
    return await this.elementHandle.type(value);
  }
  async pressEnter() {
    return await this.elementHandle.press('Enter');
  }
  async getValue() {
    return await this.page.evaluate(input => input.value, this.elementHandle);
  }
}

export default Input;
