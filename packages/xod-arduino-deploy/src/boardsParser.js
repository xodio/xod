import R from 'ramda';
import path from 'path';
import fse from 'fs-extra';

import * as Utils from './utils';

// =============================================================================
//
// Utils
//
// =============================================================================

/** Parses Arduino's `.txt` definition file. Like `boards.txt` or `platform.txt` */
// :: String -> Object
const parseTxtConfig = R.compose(
  R.reduce((txtConfig, [tokens, value]) => R.assocPath(tokens, value, txtConfig), {}),
  R.map(R.compose(
    R.zipWith(R.call, [R.split('.'), R.identity]),
    R.split('=')
  )),
  R.reject(R.test(/^(#|$)/)),
  R.map(R.trim),
  R.split(/$/mg)
);

/** Returns a parsed boards.txt from specified platform directory. */
// :: Path -> Promise (StrMap BoardPrefs) Error
const loadBoards = R.curry(
  platformDir => R.pipeP(
    () => Promise.resolve(path.resolve(
      platformDir,
      'boards.txt'
    )),
    filePath => fse.readFile(filePath, 'utf8'),
    parseTxtConfig
  )()
);

// =============================================================================
//
// Load board preferences
//
// =============================================================================

/**
 * Loads board preferences from boards.txt and returns only preferences for specified board.
 */
// :: FQBN -> Path -> Promise BoardPrefs Error
export const loadBoardPrefs = R.curry(
  (fqbn, packagesDir) => {
    const pab = Utils.parseFQBN(fqbn);
    const architectureDir = Utils.getArchitectureDirectory(fqbn, packagesDir);
    return loadBoards(architectureDir).then(R.prop(pab.boardIdentifier));
  }
);

// BoardInfo :: { name: String, package: String, architecture: String, boardIdentifier: String}
// :: FQBN -> Path -> [BoardInfo]
export const loadPABs = R.curry(
  (fqbn, packagesDir) => {
    const pab = Utils.parseFQBN(fqbn);
    const architectureDir = Utils.getArchitectureDirectory(fqbn, packagesDir);
    return loadBoards(architectureDir).then(R.compose(
      R.values,
      R.mapObjIndexed(
        (boardData, boardKey) => ({
          name: boardData.name,
          package: pab.package,
          architecture: pab.architecture,
          boardIdentifier: boardKey,
        })
      )
    ));
  }
);

export default loadBoardPrefs;
