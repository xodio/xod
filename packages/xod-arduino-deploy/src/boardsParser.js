import * as R from 'ramda';
import path from 'path';
import fse from 'fs-extra';

import * as Utils from './utils';

// =============================================================================
//
// Utils
//
// =============================================================================

/**
 * Parses Arduino's `.txt` definition file. Like `boards.txt` or `platform.txt`.
 *
 * In the reduce function we have to store value of `A.menu.cpu.B` into special
 * property to avoid breaking it with associating other properties.
 * E.G.
 * `nano.menu.cpu.atmega328 = ATmega328`
 * stores String 'ATmega328' by the path `menu.cpu.atmega328`
 * but then config has next lines:
 * `nano.menu.cpu.atmega328.upload.speed = 12800`
 * so our string will be converted into object in which will be associated
 * object `upload` with property `speed`.
 * As a result we have something like this:
 * ```
 *   {
 *     menu: {
 *       cpu: {
 *         atmega328: {
 *           0: 'A',
 *           1: 'T',
 *           2: 'm',
 *           ...
 *           upload: {
 *             speed: '12800'
 *           }
 *         }
 *       }
 *     }
 *   }
 * ```
 * To prevent it we'll store `nano.menu.cpu.atmega328 = ATmega328` into
 * special property `cpuName` and then we have:
 * ```
 * {
 *   atmega328: {
 *     cpuName: 'ATmega328',
 *     upload: {
 *       speed: '12800'
 *     }
 *   }
 * }
 * ```
 */
// :: String -> Object
const parseTxtConfig = R.compose(
  R.reduce(
    (acc, [tokens, value]) => R.compose(
      R.assocPath(R.__, value, acc),
      R.when(
        R.both(
          R.propEq(1, 'menu'),
          R.compose(R.equals(4), R.length)
        ),
        R.append('cpuName')
      )
    )(tokens),
    {}
  ),
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
export const loadBoards = R.curry(
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

// :: FQBN -> Map boardIdentifier BoardPrefs -> BoardPrefs
const getBoardPrefsByFqbn = R.curry(
  (fqbn, boardPrefsMap) => {
    const pabc = Utils.parseFQBN(fqbn);
    const getCpuPrefs = R.pathOr({}, ['menu', 'cpu', pabc.cpu]);

    return R.compose(
      R.omit('menu'),
      boardPrefs => R.compose(
        R.mergeDeepLeft(boardPrefs),
        getCpuPrefs
      )(boardPrefs),
      R.prop(pabc.boardIdentifier)
    )(boardPrefsMap);
  }
);

/**
 * Loads board preferences from boards.txt and returns only preferences for specified board.
 */
// :: FQBN -> Path -> Promise BoardPrefs Error
export const loadBoardPrefs = R.curry(
  (fqbn, packagesDir) => {
    const architectureDir = Utils.getArchitectureDirectory(fqbn, packagesDir);
    return loadBoards(architectureDir).then(getBoardPrefsByFqbn(fqbn));
  }
);

// BoardInfo :: {
//   name: String,
//   package: String,
//   architecture: String,
//   boardIdentifier: String,
// }

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
