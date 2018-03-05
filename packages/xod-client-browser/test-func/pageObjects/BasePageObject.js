export default class BasePageObject {
  constructor(page, elementHandle) {
    // mostly for page.evaluate
    this.page = page;

    if (elementHandle == null) {
      throw new Error(
        'trying to create a page object with a null root element handle'
      );
    }

    this.elementHandle = elementHandle;
  }
}
