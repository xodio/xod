import BasePageObject from './BasePageObject';

const SELECTOR = '.IdeCrashReport';

class IdeCrashReport extends BasePageObject {
  async getErrorReport() {
    const textAreaElementHandle = await this.elementHandle.$(
      '.Message textarea'
    );

    const errorReport = await this.page.evaluate(
      el => el.value,
      textAreaElementHandle
    );

    return errorReport;
  }

  async clickClose() {
    const [button] = await this.elementHandle.$x('//button');
    await button.click();
  }
}

IdeCrashReport.findOnPage = async page => {
  const elementHandle = await page.$(SELECTOR);
  if (!elementHandle) return null;
  return new IdeCrashReport(page, elementHandle);
};

IdeCrashReport.waitOnPage = async page => {
  await page.waitFor(SELECTOR, { timeout: 20000 });
  return IdeCrashReport.findOnPage(page);
};

export default IdeCrashReport;
