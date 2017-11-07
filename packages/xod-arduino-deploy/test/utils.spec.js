import path from 'path';
import { assert } from 'chai';

import * as Utils from '../src/utils';
import packageIndex from '../src/packageIndex.json';

describe('Utils', () => {
  it('parseFQBN() returns { package, architecture, boardIdentifier, cpu }', () => {
    assert.deepEqual(Utils.parseFQBN('arduino:avr:uno'), {
      package: 'arduino',
      architecture: 'avr',
      boardIdentifier: 'uno',
      cpu: '',
    });
    assert.deepEqual(Utils.parseFQBN('arduino:avr:nano:cpu=atmega328'), {
      package: 'arduino',
      architecture: 'avr',
      boardIdentifier: 'nano',
      cpu: 'atmega328',
    });
  });
  it('getToolVersion() returns version', () => {
    const version = Utils.getToolVersion(
      'arduino:samd:arduino_zero_native',
      'bossac',
      packageIndex
    );
    assert.equal(
      version,
      '1.7.0',
      'Should return proper version of a tool from packageIndex'
    );
  });
  it('getToolsByFqbn() returns a list of tools', () => {
    const tools = Utils.getToolsByFqbn(
      'arduino:samd:arduino_zero_native',
      packageIndex
    );
    assert.lengthOf(tools, 6);
  });

  it('getArchitectureDirectory() returns correct path', () => {
    const dir = Utils.getArchitectureDirectory('arduino:avr:uno', '/xod/');
    assert.strictEqual(dir, path.normalize('/xod/arduino/hardware/avr'));
  });
  it('getToolsDirectory() returns correct path', () => {
    const dir = Utils.getToolsDirectory('arduino:avr:uno', '/xod/');
    assert.strictEqual(dir, path.normalize('/xod/arduino/tools'));
  });
  it('getToolVersionDirectory() returns correct path', () => {
    const dir = Utils.getToolVersionDirectory(
      'avrdude',
      '1.0.0-arduino1',
      '/xod/arduino/tools/'
    );
    assert.strictEqual(
      dir,
      path.normalize('/xod/arduino/tools/avrdude/1.0.0-arduino1')
    );
  });
  it('listBoardsFromIndex() returns flat list of board objects', () => {
    const boards = Utils.listBoardsFromIndex(packageIndex);
    assert.isArray(boards);
    assert.isNotEmpty(boards);
    assert.hasAllKeys(boards[0], [
      'name',
      'package',
      'architecture',
      'version',
      'cpuName',
      'cpuId',
      'pio',
    ]);
  });
});
