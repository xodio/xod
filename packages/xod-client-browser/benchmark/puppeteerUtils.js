const getBoundingClientRect = (page, elementHandle) => page.evaluate((el) => {
  // otherwise we'll get an empty object
  const { bottom, height, left, right, top, width, x, y } = el.getBoundingClientRect();
  return { bottom, height, left, right, top, width, x, y };
}, elementHandle);

const getCenterPositon = rect => ({
  x: rect.x + (rect.width / 2),
  y: rect.y + (rect.height / 2),
});

const drag = async (page, from, delta) => {
  // can't use hover with SVGs, see https://github.com/GoogleChrome/puppeteer/issues/1247
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + delta.x, from.y + delta.y);
  await page.mouse.up();
};

module.exports = {
  getBoundingClientRect,
  getCenterPositon,
  drag,
};
