import { assert } from 'chai';
import { getUploadConfig } from '../src/uploader';

describe('Uploader', () => {
  it('should get board upload config from endpoint', async () => {
    const res = await getUploadConfig('uno');

    assert.hasAllKeys(res, [
      'tool',
      'cmdTemplate',
      'disableFlushing',
      'touch1200bps',
      'waitForPort',
    ]);
  });
  it('should get 404 error for non existent boardId', () =>
    getUploadConfig('super_mega_non_existent_boardId').catch(err => {
      assert.equal(err.status, 404);
    }));
});
