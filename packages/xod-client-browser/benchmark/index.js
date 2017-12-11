const path = require('path');
const puppeteer = require('puppeteer');

const { startServer, stopServer, PORT } = require('./staticServer');
const { getBoundingClientRect, getCenterPositon, drag } = require('./puppeteerUtils');

const getTracingResultsPath = name => path.resolve(__dirname, `./tracing-results/${name}.json`);

const waitForSelectingMode = page => page.waitFor('.PatchWrapper-container.selecting');
const pinSelector = (nodeId, pinName) => `#nodePinsOverlay_${nodeId} .PinOverlay[title=${pinName}]`;

const width = 1300;
const height = 850;
(async () => {
  await startServer();

  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=${width},${height}`],
  });

  // setup
  const page = await browser.newPage();

  // @see https://reactjs.org/blog/2016/11/16/react-v15.4.0.html#profiling-components-with-chrome-timeline
  // note that it will work only for non-production builds
  await page.goto(`http://localhost:${PORT}/?react_perf`);
  await page.setViewport({ width, height });
  await page.waitForSelector('.Workarea');

  // create a new patch
  const patchName = 'my-test-patch';
  await page.click('.ProjectBrowser button[title="Add patch"]');
  await page.type('.PopupPrompt input[type=text]', patchName);
  await page.click('.PopupPrompt button[type=submit]');

  // open a patch group in project browser
  const libname = 'xod/core';
  await page.click(`.patch-group-trigger[title="${libname}"]`);
  await page.waitFor(400); // wait for an animation to finish

  const nodeToAdd = 'add';
  // select a patch in project browser
  await page.click(`.PatchGroupItem[title="${nodeToAdd}"] .PatchGroupItem__label`);
  await page.waitFor('.PatchGroupItem.isSelected');

  // placing nodes
  const COLS = 14;
  const ROWS = 5;
  const nodeIds = [];

  // TODO: specify categories for tarcing?
  // @see https://github.com/GoogleChrome/puppeteer/blob/5e154dc835fcacdec6e680a695630352dae959dc/lib/Tracing.js#L36-L55
  // TODO: User Timing API to marks placed here like this:
  //    await page.evaluate(() => { window.performance.mark('added_node'); });
  // show up in JSON, but are not visible when viewing profile in Chrome
  await page.tracing.start({ path: getTracingResultsPath('adding_first_nodes') });
  for (let col = COLS; col >= 0; col -= 1) {
    if (col === 0) {
      await page.tracing.start({ path: getTracingResultsPath('adding_last_nodes') });
    }

    for (let row = ROWS; row >= 0; row -= 1) {
      // press 'add node' button
      await page.click('.PatchGroupItem.isSelected .add-node');

      await page.waitForSelector('.Node.is-selected');
      const nodeElementHandle = await page.$('.Node.is-selected');
      const createdNodeId = await page.evaluate(el => el.id, nodeElementHandle);
      nodeIds.push(createdNodeId);

      // move a node
      const nodeRect = await getBoundingClientRect(page, nodeElementHandle);
      await nodeElementHandle.dispose(); // when we begin dragging original DOM element disappears
      await drag(page, getCenterPositon(nodeRect), { x: nodeRect.width * col, y: 102 * row });
      await waitForSelectingMode(page);
      await page.keyboard.press('Escape');
    }

    if (col === COLS) {
      await page.tracing.stop(); // adding_first_nodes.json
    }
  }
  await page.tracing.stop(); // adding_last_nodes.json

  // linking placed nodes
  for (let idx = nodeIds.length - 1; idx > 0; idx -= 1) {
    if (idx === ROWS) {
      await page.tracing.start({ path: getTracingResultsPath('linking_last_nodes') });
    }

    const currentId = nodeIds[idx];
    const prevId = nodeIds[idx - 1];

    const yPinElementHandle = await page.$(pinSelector(currentId, 'Y'));
    const sumPinElementHandle = await page.$(pinSelector(prevId, 'SUM'));

    const yPinPosition = getCenterPositon(await getBoundingClientRect(page, yPinElementHandle));
    const sumPinPosition = getCenterPositon(await getBoundingClientRect(page, sumPinElementHandle));

    await page.mouse.move(yPinPosition.x, yPinPosition.y);
    await page.mouse.down();
    await page.mouse.move(sumPinPosition.x, sumPinPosition.y);
    await page.mouse.up();

    await yPinElementHandle.dispose();
    await sumPinElementHandle.dispose();

    await waitForSelectingMode(page);
  }
  await page.tracing.stop(); // linking_last_nodes.json

  await browser.close();
  await stopServer();
  process.exit(0);
})();
