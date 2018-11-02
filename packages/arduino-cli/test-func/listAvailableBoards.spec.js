import path from 'path';
import { assert } from 'chai';
import listAvailableBoards from '../src/listAvailableBoards';

const fixturesDir = path.join(__dirname, 'fixtures');

describe('listAvailableBoards()', () => {
  const boards = [
    {
      name: 'Generic ESP8266 Module',
      version: '2.1.0',
      package: 'esp8266:esp8266',
      packageName: 'esp8266',
    },
    {
      name: 'Olimex MOD-WIFI-ESP8266(-DEV)',
      version: '2.1.0',
      package: 'esp8266:esp8266',
      packageName: 'esp8266',
    },
    {
      name: 'NodeMCU 0.9 (ESP-12 Module)',
      version: '2.1.0',
      package: 'esp8266:esp8266',
      packageName: 'esp8266',
    },
    {
      name: 'Arduino Yún',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino/Genuino Uno',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Uno WiFi',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Diecimila',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Nano',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino/Genuino Mega',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino MegaADK',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Leonardo',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Leonardo Ethernet',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino/Genuino Micro',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Esplora',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Mini',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Ethernet',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Fio',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino BT',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino LilyPadUSB',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Lilypad',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Pro',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino ATMegaNG',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Robot Control',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Robot Motor',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Gemma',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Adafruit Circuit Playground',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Yún Mini',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino Industrial 101',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Linino One',
      version: '1.6.21',
      package: 'arduino:avr',
      packageName: 'Arduino AVR Boards',
    },
    {
      name: 'Arduino/Genuino Zero',
      version: '1.6.2',
      package: 'arduino:samd',
      packageName: 'Arduino SAMD Boards (32-bits ARM Cortex-M0+)',
    },
    {
      name: 'littleBits w6 Arduino module',
      version: '1.0.0',
      package: 'littleBits:avr',
      packageName: 'littleBits Arduino AVR Modules',
    },
  ];

  it('Lists boards parsed from two package index files', () =>
    listAvailableBoards(
      () => ({
        board_manager: {
          additional_urls: ['http://test.com/package_esp8266com_index.json'],
        },
      }),
      fixturesDir
    ).then(res => assert.sameDeepMembers(res, boards)));
});
