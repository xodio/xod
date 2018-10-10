import { assert } from 'chai';

import parseTable from '../src/parseTable';

describe('parseTable()', () => {
  it('returns array with valid JS objects', () => {
    const stdout = `ID             	Installed	Latest	Name
    arduino:avr    	1.6.21   	1.6.21	Arduino AVR Boards
    esp8266:esp8266	2.4.2    	2.4.2 	esp8266           `;

    assert.deepEqual(parseTable(stdout), [
      {
        ID: 'arduino:avr',
        Installed: '1.6.21',
        Latest: '1.6.21',
        Name: 'Arduino AVR Boards',
      },
      {
        ID: 'esp8266:esp8266',
        Installed: '2.4.2',
        Latest: '2.4.2',
        Name: 'esp8266',
      },
    ]);
  });
  it('returns empty array for empty source', () => {
    assert.lengthOf(parseTable(''), 0);
  });
  it('returns some shit for the broken data', () => {
    const stdout = `ID             	Installed	Latest	Name
    arduino:avr    	1.6.21
    esp8266:esp8266	2.4.2    	2.4.2 	esp8266 	some more 	and more `;
    assert.deepEqual(parseTable(stdout), [
      {
        ID: 'arduino:avr',
        Installed: '1.6.21',
      },
      {
        ID: 'esp8266:esp8266',
        Installed: '2.4.2',
        Latest: '2.4.2',
        Name: 'esp8266',
      },
    ]);
  });
});
