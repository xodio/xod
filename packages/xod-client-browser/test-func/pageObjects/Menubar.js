import BasePageObject from './BasePageObject';

class Menubar extends BasePageObject {
  async clickTopLevelItem(title) {
    const item = await this.elementHandle.xpath(
      `//*[@class="Menubar-submenu-title"][.//text()="${title}"]`
    );
    await item.click();
  }

  async clickMenuItem(title) {
    const item = await this.page.xpath(
      `//*[@class="Menubar-clickable-item"][starts-with(text(), "${title}")]`
    );
    await item.click();
  }
}

Menubar.findOnPage = async page => {
  const elementHandle = await page.$('.Menubar-root');
  return new Menubar(page, elementHandle);
};

export default Menubar;
