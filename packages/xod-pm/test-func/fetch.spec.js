import { assert } from 'chai';
import * as F from '../src/fetch';
import * as ERR_CODES from '../src/errorCodes';

describe('fetching data', () => {
  const PM_SWAGGER_URL = 'https://pm.xod.io/swagger';

  it('should fetch xod/core library data', () => {
    const requiredKeys = [
      'description',
      'versions',
      'libname',
      'owner',
      'requestParams',
    ];

    return Promise.all([
      F.fetchLibData(PM_SWAGGER_URL, 'xod/core')
        .then(data => assert.containsAllKeys(data, requiredKeys)),
      F.fetchLibData(PM_SWAGGER_URL, 'xod/core@0.14.0')
        .then(data => assert.containsAllKeys(data, requiredKeys)),
      F.fetchLibData(PM_SWAGGER_URL, 'xod/core@v0.14.0')
        .then(data => assert.containsAllKeys(data, requiredKeys)),
      F.fetchLibData(PM_SWAGGER_URL, 'xod/core@latest')
        .then(data => assert.containsAllKeys(data, requiredKeys)),
    ]);
  });
  it('should fetch xod/core xodball', () => {
    const requiredKeys = [
      'description',
      'license',
      'version',
      'authors',
      'name',
      'patches',
    ];
    return Promise.all([
      F.fetchLibXodball(PM_SWAGGER_URL, 'xod/core')
        .then(data => assert.containsAllKeys(data, requiredKeys)),
      F.fetchLibXodball(PM_SWAGGER_URL, 'xod/core@0.14.0')
        .then((data) => {
          assert.containsAllKeys(data, requiredKeys);
          assert.propertyVal(data, 'version', '0.14.0');
        }),
    ]);
  });
  it('should return error with error code "CANT_PARSE_LIBRARY_REQUEST" for bad request', () => Promise.all([
    F.fetchLibData(PM_SWAGGER_URL, 'xod/')
      .catch(err => assert.propertyVal(err, 'errorCode', ERR_CODES.CANT_PARSE_LIBRARY_REQUEST)),
    F.fetchLibXodball(PM_SWAGGER_URL, 'xod/')
      .catch(err => assert.propertyVal(err, 'errorCode', ERR_CODES.CANT_PARSE_LIBRARY_REQUEST)),
  ]));
  it('should return error with error code "CANT_FIND_LIB_VERSION" for request of unexisting version', () =>
    F.fetchLibData(PM_SWAGGER_URL, 'xod/core@999.99.999')
      .catch(err => assert.propertyVal(err, 'errorCode', ERR_CODES.CANT_FIND_LIB_VERSION))
  );
});
