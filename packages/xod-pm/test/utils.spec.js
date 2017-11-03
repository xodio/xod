import { assert } from 'chai';
import { Maybe } from 'ramda-fantasy';

import {
  parseLibQuery,
  prependVIfNeeded,
  defaultToLatest,
  rejectUnexistingVersion,
  getLibVersion,
} from '../src/utils';

import * as ERR_CODES from '../src/errorCodes';

describe('Utils', () => {
  describe('parseLibQuery()', () => {
    it('returns Maybe LibParams for valid requests', () => {
      const suite = (request, expectedLibParams) => {
        it(request, () => {
          const res = parseLibQuery(request);
          assert.isTrue(Maybe.isJust(res));
          assert.deepEqual(res.getOrElse(null), expectedLibParams);
        });
      };

      suite(
        'xod/common-hardware',
        {
          owner: 'xod',
          name: 'common-hardware',
          version: 'latest',
        }
      );
      suite(
        'xod/common-hardware@latest',
        {
          owner: 'xod',
          name: 'common-hardware',
          version: 'latest',
        }
      );
      suite(
        'xod/common-hardware@0.15.0',
        {
          owner: 'xod',
          name: 'common-hardware',
          version: 'v0.15.0',
        }
      );
      suite(
        'xod/common-hardware@v0.15.0',
        {
          owner: 'xod',
          name: 'common-hardware',
          version: 'v0.15.0',
        }
      );
    });
    it('returns Maybe.Nothing for invalid requests', () => {
      assert.isTrue(Maybe.isNothing(parseLibQuery('')));
      assert.isTrue(Maybe.isNothing(parseLibQuery('xod')));
      assert.isTrue(Maybe.isNothing(parseLibQuery('xod//')));
    });
  });

  it('prependVIfNeeded() returns correct values', () => {
    assert.isUndefined(prependVIfNeeded(undefined));
    assert.isNull(prependVIfNeeded(null));
    assert.strictEqual(prependVIfNeeded(''), '');
    assert.strictEqual(prependVIfNeeded('0.15.0'), 'v0.15.0');
    assert.strictEqual(prependVIfNeeded('v0.15.0'), 'v0.15.0');
  });

  it('defaultToLatest() returns correct values', () => {
    assert.strictEqual(defaultToLatest(undefined), 'latest');
    assert.strictEqual(defaultToLatest(null), 'latest');
    assert.strictEqual(defaultToLatest(''), 'latest');
    assert.strictEqual(defaultToLatest('0.15.0'), '0.15.0');
  });

  describe('rejectUnexistingVersion()', () => {
    it('returns resolved Promise for existing version or "latest" request', () => {
      const req = version => ({ owner: 'xod', name: 'core', version });
      const fixture = {
        versions: [
          '0.15.0',
          '0.14.0',
        ],
      };

      return Promise.all([
        rejectUnexistingVersion(req('0.15.0'), fixture)
        .then(res => assert.equal(res, fixture)),
        rejectUnexistingVersion(req('0.14.0'), fixture)
        .then(res => assert.equal(res, fixture)),
        rejectUnexistingVersion(req('latest'), fixture)
        .then(res => assert.equal(res, fixture)),
      ]);
    });

    it('rejectUnexistingVersion() returns rejected Promise for unexisting version', () => {
      const req = version => ({ owner: 'xod', name: 'core', version });
      const fixture = {
        versions: [
          '0.15.0',
          '0.14.0',
        ],
      };

      return rejectUnexistingVersion(req('0.16.0'), fixture)
      .catch(err => assert.propertyVal(err, 'errorCode', ERR_CODES.CANT_FIND_LIB_VERSION));
    });
  });

  describe('getLibVersion()', () => {
    const libData = reqVersion => (
      {
        versions: ['v0.15.0', 'v0.14.0', 'v0.13.0'],
        requestParams: { version: reqVersion },
      }
    );

    it('should return founded version', () => {
      assert.strictEqual(
        getLibVersion(libData('latest')),
        'v0.15.0'
      );
      assert.strictEqual(
        getLibVersion(libData('v0.14.0')),
        'v0.14.0'
      );
    });
    it('should return null for unexisting version', () => {
      assert.isNull(
        getLibVersion(libData('v0.0.1'))
      );
      assert.isNull(
        getLibVersion(libData(''))
      );
    });
  });
});
