import BasePageObject from './BasePageObject';

class Link extends BasePageObject {
}

export default Link;

export const getLinksOfType = async (page, linkType) => {
  const elementHandles = await page.$$(`.Link.${linkType}`);
  return elementHandles.map(eh => new Link(page, eh));
};
