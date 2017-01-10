import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import { toV2 } from '../src/adapter';
import bundleV1 from './fixtures/bundle.v1.json';

chai.use(dirtyChai);

describe('Adapters', () => {
  describe('toV2', () => {
    it('should return an object with keys [authors, description, license, patches]', () => {
      expect(toV2({}))
        .to.be.an('object')
        .and.have.all.keys('authors', 'description', 'license', 'patches');
    });
    it('should return new version that have four patches', () => {
      const patchKeys = [
        '@/main',
        '@/sub/aux',
        'xod/core/and',
        'xod/core/inputNumber',
        'xod/core/pot',
        'xod/core/led',
      ];
      expect(toV2(bundleV1))
        .to.be.an('object')
        .that.have.property('patches')
        .that.have.all.keys(patchKeys);
    });
  });
});
