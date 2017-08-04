import { assert } from 'chai';
import path from 'path';
import { composeCommand } from '../src/uploader';
import { isWindows } from '../src/utils';
import { loadBoardPrefs } from '../src/boardsParser';

const winExt = (isWindows) ? '.exe' : '';

describe('Uploader', () => {
  const fixture = p => path.resolve(__dirname, 'fixtures', p);
  const packagesDir = fixture('packages');
  const artifactsDir = fixture('artifacts');

  it('composeCommand() for `arduino:samd:arduino_zero_native` (bossac)', async () => {
    const fqbn = 'arduino:samd:arduino_zero_native';
    const boardPrefs = await loadBoardPrefs(fqbn, packagesDir);
    const cmd = composeCommand(
      '/tmp/test.cpp',
      'arduino:samd:arduino_zero_native',
      packagesDir,
      artifactsDir,
      boardPrefs,
      '/dev/cu.usbmodem1411'
    );

    const execCmd = path.normalize(`${packagesDir}/arduino/tools/bossac/1.7.0/bossac${winExt}`);
    const binaryFile = path.join(artifactsDir, 'test.cpp.bin');

    assert.strictEqual(cmd, `"${execCmd}" --port=/dev/cu.usbmodem1411 -U true -e -w -b "${binaryFile}" -R`);
  });
  it('composeCommand() for `arduino:samd:mzero_pro_bl_dbg` (openocd-withbootsize)', async () => {
    const fqbn = 'arduino:samd:mzero_pro_bl_dbg';
    const boardPrefs = await loadBoardPrefs(fqbn, packagesDir);
    const cmd = composeCommand(
      '/tmp/test.cpp',
      fqbn,
      packagesDir,
      artifactsDir,
      boardPrefs,
      '/dev/cu.usbmodem1411'
    );

    const execCmd = path.normalize(`${packagesDir}/arduino/tools/openocd/0.9.0-arduino6-static/bin/openocd${winExt}`);
    const scripts = path.normalize(`${packagesDir}/arduino/tools/openocd/0.9.0-arduino6-static/share/openocd/scripts`);
    const config = path.normalize(`${packagesDir}/arduino/hardware/samd/variants/arduino_mzero/openocd_scripts/arduino_zero.cfg`);
    const binaryFile = path.join(artifactsDir, 'test.cpp.bin');

    assert.strictEqual(cmd, `"${execCmd}" -s "${scripts}" -f "${config}" -c "telnet_port disabled; program ${binaryFile} verify reset 0x4000; shutdown"`);
  });
  it('composeCommand() for `arduino:samd:tian` (avrdude)', async () => {
    const fqbn = 'arduino:samd:tian';
    const boardPrefs = await loadBoardPrefs(fqbn, packagesDir);
    const cmd = composeCommand(
      '/tmp/test.cpp',
      'arduino:samd:tian',
      packagesDir,
      artifactsDir,
      boardPrefs,
      '/dev/cu.usbmodem1411'
    );

    const execCmd = path.normalize(`${packagesDir}/arduino/tools/avrdude/6.3.0-arduino9/bin/avrdude${winExt}`);
    const config = path.normalize(`${packagesDir}/arduino/tools/avrdude/6.3.0-arduino9/etc/avrdude.conf`);
    const binaryFile = path.join(artifactsDir, 'test.cpp.hex');

    assert.strictEqual(cmd, `"${execCmd}" -C "${config}" -p atmega2560 -c wiring -P /dev/cu.usbmodem1411 -b 57600 "-Uflash:w:${binaryFile}:i"`);
  });
});
