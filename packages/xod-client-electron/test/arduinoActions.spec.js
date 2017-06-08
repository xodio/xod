import { assert } from 'chai';

import { listBoardsFromIndex } from '../src/app/arduinoActions';

describe('Arduino actions', () => {
  it('listBoardsFromIndex should return correct array of boards', () => {
    const boards = listBoardsFromIndex({
      packages: [
        {
          name: 'arduino',
          platforms: [
            {
              architecture: 'avr',
              version: '1.6.2',
              boards: [
                { name: 'Arduino Uno' },
                { name: 'Arduino Nano' },
              ],
            },
            {
              architecture: 'avr',
              version: '1.6.19',
              boards: [
                { name: 'Arduino Uno' },
                { name: 'Arduino Nano' },
              ],
            },
            {
              architecture: 'sam',
              version: '1.6.11',
              boards: [{ name: 'Arduino Due' }],
            },
          ],
        },
        {
          name: 'Intel',
          platforms: [
            {
              architecture: 'arc32',
              version: '1.6.4+1.14',
              boards: [{ name: 'Arduino 101' }],
            },
            {
              architecture: 'arc32',
              version: '1.6.4+1.0',
              boards: [{ name: 'Arduino 101' }],
            },
          ],
        },
      ],
    });
    assert.deepEqual(boards, [
      { board: 'Arduino Uno', package: 'arduino', architecture: 'avr', version: '1.6.19' },
      { board: 'Arduino Nano', package: 'arduino', architecture: 'avr', version: '1.6.19' },
      { board: 'Arduino Due', package: 'arduino', architecture: 'sam', version: '1.6.11' },
      { board: 'Arduino 101', package: 'Intel', architecture: 'arc32', version: '1.6.4+1.14' },
    ]);
  });
});
