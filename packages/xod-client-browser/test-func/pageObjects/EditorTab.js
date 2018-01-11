import BasePageObject from './BasePageObject';

class EditorTab extends BasePageObject {
  async close() {
    const button = await this.elementHandle.$('.tab-close');
    await button.click();
  }

  async getName() {
    const nameContainer = await this.elementHandle.$('.tab-name');
    const name = await this.page.evaluate(
      el => el.textContent,
      nameContainer
    );

    return name;
  }

  // TODO: for later: click (select?), isActive
}

EditorTab.findByName = async (page, tabName) => {
  const elementHandle = await page.xpath(`//*[@class="TabsItem"][.//text()="${tabName}"]`);

  if (!elementHandle) return null;

  return new EditorTab(page, elementHandle);
};

EditorTab.findActive = async (page) => {
  const elementHandle = await page.$('.TabsItem.is-active');

  if (!elementHandle) return null;

  return new EditorTab(page, elementHandle);
};

export default EditorTab;
