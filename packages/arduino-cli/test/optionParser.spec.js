import path from 'path';
import { assert } from 'chai';
import fse from 'fs-extra';

import {
  getBoardsTxtPath,
  getLines,
  parseOptionNames,
  parseIntermediateOptions,
  convertIntermediateOptions,
  parseOptions,
  patchBoardsWithOptions,
} from '../src/optionParser';

const fixtureDir = path.resolve(__dirname, 'fixtures');

// =============================================================================
//
// Test data
//
// =============================================================================

const espOptionNames = {
  UploadSpeed: 'Uplo@d Speed (Скорость загрузки)',
  CpuFrequency: 'CPU Frequency 123,-_[]():@we$ome',
};

const espOptions = {
  UploadSpeed: [
    {
      name: '115200',
      value: '115200',
    },
    {
      name: '9600',
      value: '9600',
    },
    {
      name: '57600',
      value: '57600',
    },
    {
      name: '921600',
      value: '921600',
    },
  ],
  CpuFrequency: [
    {
      name: '80 MHz (!@#$$%^&*()[]_-+,./)',
      value: '80',
    },
    {
      name: '160 MHz',
      value: '160',
    },
  ],
};

const uploadSpeedOptions = {
  optionName: 'Uplo@d Speed (Скорость загрузки)',
  optionId: 'UploadSpeed',
  values: [
    {
      name: '115200',
      value: '115200',
    },
    {
      name: '9600',
      value: '9600',
    },
    {
      name: '57600',
      value: '57600',
    },
    {
      name: '921600',
      value: '921600',
    },
  ],
};
const cpuFrequencyOptions = {
  optionName: 'CPU Frequency 123,-_[]():@we$ome',
  optionId: 'CpuFrequency',
  values: [
    {
      name: '80 MHz (!@#$$%^&*()[]_-+,./)',
      value: '80',
    },
    {
      name: '160 MHz',
      value: '160',
    },
  ],
};

const boards = [
  {
    name: 'Generic ESP8266 Module',
    fqbn: 'esp8266:esp8266:generic',
  },
  {
    name: 'Amperka WiFi Slot',
    fqbn: 'esp8266:esp8266:wifi_slot',
  },
  {
    name: 'Arduino Due',
    fqbn: 'arduino:sam:due',
  },
  {
    name: 'Arduino/Genuino Uno (not installed)',
    package: 'arduino:avr',
    packageName: 'Arduino AVR Boards',
    version: '1.6.21',
  },
  {
    name: 'Generic Fictional Board',
    fqbn: 'fictional:fake:generic',
  },
  {
    name: 'Another Fictional Board',
    fqbn: 'fictional:fake:another_one',
  },
];

const expectedBoards = [
  {
    name: 'Generic ESP8266 Module',
    fqbn: 'esp8266:esp8266:generic',
    options: [cpuFrequencyOptions, uploadSpeedOptions],
    disableRts: true,
  },
  {
    name: 'Amperka WiFi Slot',
    fqbn: 'esp8266:esp8266:wifi_slot',
    options: [cpuFrequencyOptions, uploadSpeedOptions],
    disableRts: true,
  },
  {
    name: 'Arduino Due',
    fqbn: 'arduino:sam:due',
    options: [],
    disableRts: false,
  },
  {
    name: 'Arduino/Genuino Uno (not installed)',
    package: 'arduino:avr',
    packageName: 'Arduino AVR Boards',
    version: '1.6.21',
  },
  {
    name: 'Generic Fictional Board',
    fqbn: 'fictional:fake:generic',
    options: [cpuFrequencyOptions, uploadSpeedOptions],
    disableRts: true,
  },
  {
    name: 'Another Fictional Board',
    fqbn: 'fictional:fake:another_one',
    options: [cpuFrequencyOptions, uploadSpeedOptions],
    disableRts: true,
  },
];

// =============================================================================
//
// Specs
//
// =============================================================================

describe('Option Parser', () => {
  let espBoardsTxtContent;
  let espBoardsTxtLines;
  before(async () => {
    const buf = await fse.readFile(
      getBoardsTxtPath(fixtureDir, 'esp8266:esp8266', '2.4.2')
    );
    espBoardsTxtContent = buf.toString();
    espBoardsTxtLines = getLines(espBoardsTxtContent);
  });

  it('Parses human-readable option names', () => {
    assert.deepEqual(parseOptionNames(espBoardsTxtLines), espOptionNames);
  });

  it('Parses options for each board into intermediate object', () => {
    assert.deepEqual(parseIntermediateOptions(espBoardsTxtLines), {
      generic: espOptions,
      wifi_slot: espOptions,
    });
  });

  it('Converts parsed intermediate options into final Option list', () => {
    assert.sameDeepMembers(
      convertIntermediateOptions(espOptionNames, espOptions),
      [uploadSpeedOptions, cpuFrequencyOptions]
    );
  });

  it('Parses options into final object, that should be merged into boards', () => {
    const res = parseOptions(espBoardsTxtContent);
    assert.hasAllKeys(res, ['generic', 'wifi_slot']);
    assert.sameDeepMembers(res.generic, [
      uploadSpeedOptions,
      cpuFrequencyOptions,
    ]);
    assert.sameDeepMembers(res.wifi_slot, [
      uploadSpeedOptions,
      cpuFrequencyOptions,
    ]);
  });

  it('Correctly loads boards.txt and patches all boards', () =>
    patchBoardsWithOptions(
      fixtureDir,
      [
        { ID: 'esp8266:esp8266', Installed: '2.4.2' },
        { ID: 'fictional:fake', Installed: '1.2.3' },
      ],
      boards
    ).then(res => assert.sameDeepMembers(res, expectedBoards)));
});
