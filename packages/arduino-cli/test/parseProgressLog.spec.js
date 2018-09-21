import { assert } from 'chai';

import { parseProgressMessage } from '../src/parseProgressLog';

describe('Progress messages parser', () => {
  it('common message -> progress 0%', () => {
    const stdout = `

      Hello, world!
    `;
    assert.deepEqual(parseProgressMessage(stdout), {
      percentage: 0,
      estimated: 0,
      message: '      Hello, world!    ',
    });
  });
  it('message with "downloaded" or "installed" keywords -> progress 100%', () => {
    const stdout = 'Some tool is installed perfectly';
    assert.deepEqual(parseProgressMessage(stdout), {
      percentage: 100,
      estimated: 0,
      message: 'Some tool is installed perfectly',
    });
  });
  it('message with progressbar -> progress with parsed data', () => {
    const stdout =
      'arduino:arm-none-eabi-gcc@4.8.3-2014q1 936.11 KiB / 50.09 MiB [>--------------------------]   1.83% 4m32';
    assert.deepEqual(parseProgressMessage(stdout), {
      percentage: 1,
      estimated: '4m32',
      message: null,
    });
  });
  it('message with corrupted progressbar -> progress with parsed data', () => {
    const stdout =
      'arduino:arm-none-eabi-gcc@4.8.3-2014q1 936.11 KiB / 50.09 MiB    1.83% 4m32';
    assert.deepEqual(parseProgressMessage(stdout), {
      percentage: 1,
      estimated: '4m32',
      message: null,
    });
  });
});
