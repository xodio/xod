import { SERVER_URL } from '../../tools/staticServer';

export default async function getPage(browser) {
  const page = await browser.newPage();

  await page.goto(SERVER_URL);
  await page.setViewport({ width: 1024, height: 768 });
  await page.waitForSelector('.Workarea');

  return page;
}
