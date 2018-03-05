import getBoundingClientRect from './getBoundingClientRect';
import getCenterPositon from './getCenterPositon';

export default async function drag(page, elementHandle, delta) {
  // can't use hover with SVGs, see https://github.com/GoogleChrome/puppeteer/issues/1247
  const rect = await getBoundingClientRect(page, elementHandle);
  const startingPosition = getCenterPositon(rect);

  await page.mouse.move(startingPosition.x, startingPosition.y);
  await page.mouse.down();
  await page.mouse.move(
    startingPosition.x + delta.x,
    startingPosition.y + delta.y
  );
  await page.mouse.up();
}
