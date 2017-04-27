import R from 'ramda';
import {
  resolvePath,
  // writeFile,
  // isDirectoryExists,
  // isFileExists,
} from 'xod-fs';
import {
  notEmpty,
} from 'xod-func-tools';

import rejectWithCode, * as ERROR_CODES from './errorCodes';
import * as settings from './settings';
import { DEFAULT_WORKSPACE_PATH } from './constants';

// =============================================================================
//
// Unpure things
//
// =============================================================================

// :: () -> String
export const getWorkspacePath = R.compose(
  settings.getWorkspacePath,
  settings.load
);

// =============================================================================
//
// Utils
//
// =============================================================================

// :: Path -> Promise Path Error
export const validatePath = path => Promise.resolve(path)
  .then(R.unless(
    R.allPass([
      R.is(String),
      notEmpty,
    ]),
    () => Promise.reject(new Error(`Invalid path: '${path}'`))
  ))
  .then(resolvePath)
  .catch(rejectWithCode(ERROR_CODES.INVALID_WORKSPACE_PATH));

// :: () -> Promise.Resolved String
export const getHomeDir = () => Promise.resolve(DEFAULT_WORKSPACE_PATH);

// =============================================================================
//
// Compositions of steps to get coherent workspace
//
// =============================================================================

export default {};
