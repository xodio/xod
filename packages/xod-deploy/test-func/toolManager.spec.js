import { assert } from 'chai';
import path from 'path';
import fse from 'fs-extra';

import { installTool } from '../src/toolManager';

const tmpDir = path.resolve(__dirname, '.tmp');
const removeTmpDir = () => fse.remove(tmpDir);

describe('Tool Manager', () => {
  before(removeTmpDir);
  afterEach(removeTmpDir);

  const toolName = 'avrdude/6.3.0-arduino9';
  const url =
    'https://storage.googleapis.com/releases.xod.io/tools/avrdude_darwin.tar.bz2';

  // Installing
  it('installTool() downloads and installs tool', () =>
    installTool(tmpDir, toolName, url)
      .then(res => {
        assert.isTrue(res.installed);
        assert.isTrue(res.downloaded);
      })
      .then(() => installTool(tmpDir, toolName, url))
      .then(res => {
        // already downloaded and installed
        assert.isTrue(res.installed);
        assert.isFalse(res.downloaded);
      }));
});
