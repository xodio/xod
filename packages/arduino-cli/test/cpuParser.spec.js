import path from 'path';
import { assert } from 'chai';

import { getBoardsTxtPath, patchBoardsWithCpu } from '../src/cpuParser';

const tmpDir = path.resolve(__dirname, 'tmp');
const fixturesDir = path.resolve(__dirname, 'fixtures');

const tmp = (...parts) => path.resolve(tmpDir, ...parts);

describe('cpuParser', () => {
  it('getBoardsTxtPath() returns correct path', () => {
    assert.strictEqual(
      getBoardsTxtPath(tmpDir, 'arduino:avr', '1.6.21'),
      tmp('packages', 'arduino', 'hardware', 'avr', '1.6.21', 'boards.txt')
    );
  });
  it('patchBoardsWithCpu() returns list of board objects with cpu options', () => {
    const cores = [{ ID: 'arduino:avr', Installed: '1.6.21' }];
    const boards = [
      { fqbn: 'arduino:avr:uno', name: 'Arduino/Genuino Uno' },
      {
        fqbn: 'arduino:avr:mega',
        name: 'Arduino/Genuino Mega or Mega 2560',
      },
    ];
    const expectedResult = [
      {
        fqbn: 'arduino:avr:uno',
        name: 'Arduino/Genuino Uno',
      },
      {
        fqbn: 'arduino:avr:mega:cpu=atmega2560',
        name: 'Arduino/Genuino Mega or Mega 2560 (ATmega2560 (Mega 2560))',
      },
      {
        fqbn: 'arduino:avr:mega:cpu=atmega1280',
        name: 'Arduino/Genuino Mega or Mega 2560 (ATmega1280)',
      },
    ];

    return patchBoardsWithCpu(fixturesDir, cores, boards).then(res => {
      assert.deepEqual(res, expectedResult);
    });
  });
});
