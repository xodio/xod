import { assert } from 'chai';
import * as WA from '../src/app/workspaceActions';
import * as ERROR_CODES from '../src/app/errorCodes';

describe('validatePath', () => {
  it('should return resolved Promise with same path', () => {
    WA.validatePath('~/xod/').then(path => assert.equals('~/xod/', path));
  });
  it('should return rejected Promise with ERROR_CODE', () => {
    const errCode = ERROR_CODES.INVALID_WORKSPACE_PATH;
    WA.validatePath(null).catch(err => assert.equals(errCode, err.errorCode));
    WA.validatePath('').catch(err => assert.equals(errCode, err.errorCode));
  });
});
