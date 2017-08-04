import { assert } from 'chai';
import path from 'path';
import fse from 'fs-extra';

import * as PM from '../src/packageManager';
import packageIndex from '../src/packageIndex.json';

const tmpDir = path.resolve(__dirname, '.tmp');
const packagesDir = path.resolve(tmpDir, 'packages');
const removeTmpDir = () => fse.remove(tmpDir);

describe('Package Manager', () => {
  before(removeTmpDir);
  afterEach(removeTmpDir);

  // Installing
  it('installHardware() downloads and installs not existent hardware', () =>
    PM.installHardware('arduino:avr:uno', packagesDir, packageIndex)
      .then((res) => {
        assert.isTrue(res.installed);
        assert.isTrue(res.downloaded);
      })
      // Call it again to be sure that we won't download and install it again
      .then(() => PM.installHardware('arduino:avr:uno', packagesDir, packageIndex))
      .then((res) => {
        assert.isTrue(res.installed);
        assert.isFalse(res.downloaded);
      })
  );
  it('installTools() downloads and installs all tools', () =>
    PM.installTools('arduino:avr:uno', packagesDir, packageIndex)
      .then((res) => {
        assert.isTrue(res.installed);
        assert.isTrue(res.downloaded);
      })
  );
  it('installArchitecture() downloads and installs hardware and all tools', () =>
    PM.installArchitecture('arduino:sam:arduino_due_x', packagesDir, packageIndex)
      .then((res) => {
        assert.isTrue(res.hardware.installed);
        assert.isTrue(res.tools.installed);
      })
  );
});
