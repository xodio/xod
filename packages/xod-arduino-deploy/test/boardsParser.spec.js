import path from 'path';
import { assert } from 'chai';

import * as BP from '../src/boardsParser';


describe('BoardsParser', () => {
  const fixture = p => path.resolve(__dirname, 'fixtures', p);
  const packagesDir = fixture('packages');

  it('loadBoardPrefs() returns correct BoardPrefs', async () => {
    const mkr1000 = await BP.loadBoardPrefs('arduino:samd:mkr1000', packagesDir);
    const nano168 = await BP.loadBoardPrefs('arduino:avr:nano:cpu=atmega168', packagesDir);

    assert.nestedPropertyVal(mkr1000, 'name', 'Arduino/Genuino MKR1000');
    assert.nestedPropertyVal(mkr1000, 'build.mcu', 'cortex-m0plus');
    assert.nestedPropertyVal(mkr1000, 'upload.tool', 'bossac');

    assert.nestedPropertyVal(nano168, 'name', 'Arduino Nano');
    assert.nestedPropertyVal(nano168, 'cpuName', 'ATmega168');
    assert.nestedPropertyVal(nano168, 'build.mcu', 'atmega168');
    assert.nestedPropertyVal(nano168, 'upload.tool', 'avrdude');
    assert.nestedPropertyVal(nano168, 'upload.speed', '19200');
  });
});
