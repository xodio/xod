import R from 'ramda';
import { exec } from 'child-process-promise';
import compareVersion from 'compare-versions';
import { def } from './types';

import arduinoOfflineIndex from './arduinoPackageIndex.json';

// =============================================================================
//
// Shell utils
//
// =============================================================================

/**
 * Function that executes shell command and unifies result.
 * @type {Function}
 * @param {String} cmd Command to execute in shell
 * @returns {Promise.Resolved<ExecResult>} Promise resolved with unified {@link ExecResult}
 */
export const unifyExec = cmd => exec(cmd)
  .then(r => ({ code: r.childProcess.exitCode, stdout: r.stdout, stderr: r.stderr }))
  .catch(r => ({ code: r.code, stdout: r.stdout, stderr: r.stderr }));

/**
 * Function that resolvs/rejects Promise depending on code number
 * @type {Function}
 * @param {ExecResult} execResult {@link ExecResult}
 * @returns {Promise<String, String>} Promise resolved with `stdout` or rejected with `stderr`
 */
export const processExecResult = (execResult) => {
  const { code, stdout, stderr } = execResult;
  if (code === 0) { return Promise.resolve(stdout); }
  return Promise.reject(new Error(stderr));
};


// =============================================================================
//
// Sort PAVs by Version
//
// =============================================================================

const getSplittedVersion = def(
  'getSplittedVersion :: PAV -> [String]',
  R.compose(
    R.split('+'),
    R.prop('version')
  )
);

export const sortByVersion = def(
  'sortByVersion :: [PAV] -> [PAV]',
  R.sort((a, b) => {
    const aV = getSplittedVersion(a);
    const bV = getSplittedVersion(b);

    let result = compareVersion(aV[0], bV[0]);
    if (result === 0 && aV.length === 2 && bV.length === 2) {
      result = compareVersion(aV[1], bV[1]);
    } else if (aV.length > bV.length) {
      return 1;
    } else if (bV.length > aV.length) {
      return 0;
    }
    return result;
  })
);

// =============================================================================
//
// Arduino Packages Index utils
//
// =============================================================================

/**
 * Returns a preloaded Arduino Package Index.
 */
export const getArduinoPackagesOfflineIndex = () => arduinoOfflineIndex;

/**
 * Get all Board names from official Arduino package index by PAV.
 */
const getBoardsByPAV = def(
  'getBoardsByPAV :: PAV -> ArduinoPackageIndex -> [BoardName]',
  (pav, index) => R.compose(
    R.map(R.prop('name')),
    R.prop('boards'),
    R.find(
      R.both(
        R.propEq('architecture', pav.architecture),
        R.propEq('version', pav.version)
      )
    ),
    R.prop('platforms'),
    R.find(R.propEq('name', pav.package)),
    R.prop('packages')
  )(index)
);

/**
 * Lists the processed [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json},
 * optimized for {@link PAV} selection.
 */
export const listPAVs = def(
  'listPAVs :: ArduinoPackageIndex -> StrMap [PAV]',
  R.compose(
    R.groupBy(pav => `${pav.package}:${pav.architecture}`),
    R.chain(({ name, platforms }) =>
      platforms.map(({ architecture, version }) => ({
        package: name,
        architecture,
        version,
      }))
    ),
    R.prop('packages')
  )
);

/**
 * Returns a list of Boards, parsed from Arduino Package Index JSON.
 */
export const listBoardsFromIndex = def(
  'listBoardsFromIndex :: ArduinoPackageIndex -> [Board]',
  index => R.compose(
    R.chain(R.compose(
      R.sortBy(R.prop('board')),
      pav => R.compose(
        R.map(R.assoc('board', R.__, pav)),
        getBoardsByPAV(R.__, index)
      )(pav),
      R.last,
      sortByVersion
    )),
    R.values,
    listPAVs
  )(index)
);

/**
 * Picks Board Identifier from Map of available boards.
 * To get Map of available boards use `loadPAVBoards`.
 */
export const pickBoardIdentifierByBoardName = def(
  'pickBoardIdentifierByBoardName :: BoardName -> Map BoardIdentifier Object -> BoardIdentifier',
  (boardName, boardMap) => R.compose(
    R.head,
    R.keys,
    R.pickBy(R.propEq('name', boardName))
  )(boardMap)
);
