import R from 'ramda';
import { assert } from 'chai';
import { getProjectName } from 'xod-project';
import * as F from '../src/fetch';
import * as ERR_CODES from '../src/errorCodes';

describe('fetching data', () => {
  const PM_SWAGGER_URL = 'https://pm.xod.io/swagger';

  describe('fetchLibData()', () => {
    it('returns Promise with  xod/core library data', () => {
      const requiredKeys = [
        'description',
        'versions',
        'libname',
        'owner',
        'requestParams',
      ];

      return Promise.all([
        F.fetchLibData(PM_SWAGGER_URL, 'xod/core').then(data =>
          assert.containsAllKeys(data, requiredKeys)
        ),
        F.fetchLibData(PM_SWAGGER_URL, 'xod/core@0.14.0').then(data =>
          assert.containsAllKeys(data, requiredKeys)
        ),
        F.fetchLibData(PM_SWAGGER_URL, 'xod/core@v0.14.0').then(data =>
          assert.containsAllKeys(data, requiredKeys)
        ),
        F.fetchLibData(PM_SWAGGER_URL, 'xod/core@latest').then(data =>
          assert.containsAllKeys(data, requiredKeys)
        ),
      ]);
    });
    it('returns error with error code "CANT_PARSE_LIBRARY_REQUEST" for bad request', () =>
      F.fetchLibData(PM_SWAGGER_URL, 'xod/').catch(err =>
        assert.propertyVal(
          err,
          'errorCode',
          ERR_CODES.CANT_PARSE_LIBRARY_REQUEST
        )
      ));
    it('returns error with error code "CANT_FIND_LIB_VERSION" for request of unexisting version', () =>
      F.fetchLibData(PM_SWAGGER_URL, 'xod/core@999.99.999').catch(err =>
        assert.propertyVal(err, 'errorCode', ERR_CODES.CANT_FIND_LIB_VERSION)
      ));
  });
  describe('fetchLibrary()', () => {
    it('returns Promise with  xod/core xodball', () => {
      const requiredKeys = [
        'description',
        'license',
        'version',
        'authors',
        'name',
        'patches',
      ];
      return Promise.all([
        F.fetchLibrary(PM_SWAGGER_URL, 'xod/core').then(data =>
          assert.containsAllKeys(data, requiredKeys)
        ),
        F.fetchLibrary(PM_SWAGGER_URL, 'xod/core@0.14.0').then(data => {
          assert.containsAllKeys(data, requiredKeys);
          assert.propertyVal(data, 'version', '0.14.0');
        }),
      ]);
    });
    it('returns rejected Promise with error code "CANT_PARSE_LIBRARY_REQUEST" for bad request', () =>
      F.fetchLibrary(PM_SWAGGER_URL, 'xod/').catch(err =>
        assert.propertyVal(
          err,
          'errorCode',
          ERR_CODES.CANT_PARSE_LIBRARY_REQUEST
        )
      ));
    it('returns rejected Promise with error code "CANT_GET_LIB_XODBALL" for unknown library', () =>
      F.fetchLibrary(PM_SWAGGER_URL, 'xod/nonexisting').catch(err =>
        assert.propertyVal(err, 'errorCode', ERR_CODES.CANT_GET_LIB_XODBALL)
      ));
  });

  describe('fetchLibsWithDependencies()', () => {
    it('returns Promise with xod/common-hardware and its dependencies', () =>
      F.fetchLibsWithDependencies(
        PM_SWAGGER_URL,
        [],
        ['xod/common-hardware']
      ).then(projectsMap => {
        assert.sameMembers(
          R.compose(R.map(getProjectName), R.values)(projectsMap),
          ['bits', 'common-hardware', 'core', 'gpio', 'i2c', 'math', 'units']
        );
      }));
    it('returns rejected Promise with error code "CANT_PARSE_LIBRARY_REQUEST" for bad request', () =>
      F.fetchLibsWithDependencies(PM_SWAGGER_URL, [], ['xod/']).catch(err =>
        assert.propertyVal(
          err,
          'errorCode',
          ERR_CODES.CANT_PARSE_LIBRARY_REQUEST
        )
      ));
    it('returns rejected Promise with error code "CANT_GET_LIB_XODBALL" for unknown library', () =>
      F.fetchLibsWithDependencies(
        PM_SWAGGER_URL,
        [],
        ['xod/nonexisting']
      ).catch(err =>
        assert.propertyVal(err, 'errorCode', ERR_CODES.CANT_GET_LIB_XODBALL)
      ));
  });
});
