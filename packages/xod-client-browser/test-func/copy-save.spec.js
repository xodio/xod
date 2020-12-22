/* global browser:false, assert:false, navigator:false */
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { resolve } from 'path';

import { SERVER_URL } from '../tools/staticServer';
import getPage from './utils/getPage';

import Debugger from './pageObjects/Debugger';

describe('copy & save log', () => {
  const openIdeAndDeploymentPane = async browser => {
    const page = await getPage(browser);
    const debugPanel = await Debugger.findOnPage(page);

    // Open debugger
    assert.isTrue(
      await debugPanel.isCollapsed(),
      'debugger panel is collapsed by default'
    );
    await debugPanel.click();
    assert.isTrue(
      await debugPanel.isOpened(),
      'debugger panel is opened by click'
    );

    return {
      page,
      debugPanel,
    };
  };

  it('copy to clipboard works', async () => {
    // Create BrowserContext with the permission to read the clipboard
    const context = browser.defaultBrowserContext();
    context.clearPermissionOverrides();
    context.overridePermissions(SERVER_URL, [
      'clipboard-write',
      'clipboard-read',
    ]);

    const { page, debugPanel } = await openIdeAndDeploymentPane(context);

    // Click copy button
    const copyBtn = await debugPanel.findCopyLogButton();
    await copyBtn.click();

    const clipboardContent = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    assert.equal(
      clipboardContent,
      'Here you will see output from the compiler, uploader, debugger, and other tools.'
    );
  });
  it('save to file works', async () => {
    const { page, debugPanel } = await openIdeAndDeploymentPane(browser);

    // Allow the Chromium to download the file
    const downloadPath = tmpdir();
    // eslint-disable-next-line no-underscore-dangle
    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath,
    });

    // Click save button
    const saveBtn = await debugPanel.findSaveLogButton();
    await saveBtn.click();
    // Wait a little to ensure that the file downloaded
    await page.waitFor(500);

    // Check the file contents and its existence
    const fileName = 'compiler-log.txt'; // We're saving the log of `compiler` tab
    const filePath = resolve(downloadPath, fileName);
    const fileContent = await fs.readFile(filePath, { encoding: 'utf8' });

    assert.equal(
      fileContent,
      'Here you will see output from the compiler, uploader, debugger, and other tools.'
    );
  });
});
