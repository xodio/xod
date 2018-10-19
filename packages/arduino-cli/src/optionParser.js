/**
 * One bright day this module will be burned.
 * See: https://github.com/arduino/arduino-cli/issues/45
 */

import path from 'path';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import promiseAllProperties from 'promise-all-properties';

const PACKAGES_DIR = 'packages';
const HARDWARE_DIR = 'hardware';
const BOARDS_FNAME = 'boards.txt';

/**
 * Types
 *
 * OptionValue :: {
 *   name: String,         // Human-readable name. E.G. "80 MHz"
 *   value: String,        // Option value. E.G. "80"
 * }
 *
 * OptionName :: String    // Human-readable option name. E.G. "CPU Frequency"
 * OptionId :: String      // Option id as is in the `boards.txt`, E.G. "CpuFrequency"
 *
 * Option :: {
 *   optionName: OptionName,
 *   optionId: OptionId,
 *   values: [OptionValue],
 * }
 */

// =============================================================================
//
// Utils
//
// =============================================================================

// :: String -> [String]
export const getLines = R.compose(
  R.reject(R.test(/^(#|$)/)),
  R.map(R.trim),
  R.split(/$/gm)
);

const menuRegExp = /^menu\./;

const optionNameRegExp = /^menu\.([a-zA-Z0-9_]+)=(.+)$/;

const boardOptionRegExp = /^([a-zA-Z0-9_]+)\.menu\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)=(.+)$/;

const osRegExp = /(linux|macosx|windows)/;

// =============================================================================
//
// Parsers
//
// =============================================================================

// :: Path -> FQBN -> String -> Path
export const getBoardsTxtPath = R.curry((dataPath, fqbn, version) => {
  const [packageName, archName] = R.split(':', fqbn);
  return path.resolve(
    dataPath,
    PACKAGES_DIR,
    packageName,
    HARDWARE_DIR,
    archName,
    version,
    BOARDS_FNAME
  );
});

/**
 * Parses human-readable option names from `boards.txt` contents.
 *
 * E.G.
 * `menu.CpuFrequency=CPU Frequency`
 * will become
 * `{ CpuFrequency: 'CPU Frequency' }`
 *
 * :: [String] -> Map OptionId OptionName
 */
export const parseOptionNames = R.compose(
  R.fromPairs,
  R.map(R.pipe(R.match(optionNameRegExp), R.tail)),
  R.filter(R.test(menuRegExp))
);

/**
 * Parses options for boards indexed by board ID ("uno", "wifi_slot" and etc)
 *
 * :: [String] -> Map BoardId (Map OptionId [OptionValue])
 */
export const parseIntermediateOptions = R.compose(
  R.reduce((acc, line) => {
    const boardOption = R.match(boardOptionRegExp, line);
    if (boardOption.length < 5) return acc;
    const [, boardId, optionId, optionVal, optionName] = boardOption;
    const option = { name: optionName, value: optionVal };
    return R.over(R.lensPath([boardId, optionId]), R.append(option), acc);
  }, {}),
  R.reject(R.either(R.test(menuRegExp), R.test(osRegExp)))
);

// :: Map OptionId OptionName -> Map OptionId [OptionValue] -> [Option]
export const convertIntermediateOptions = R.curry((optionNames, intOptions) =>
  R.compose(
    R.values,
    R.mapObjIndexed((val, key) => ({
      optionName: optionNames[key],
      optionId: key,
      values: val,
    }))
  )(intOptions)
);

// :: String -> Map BoardId [Option]
/**
 * Parses boards.txt options into Object, that could be merged with Board objects
 * by board id (last part of FQBN).
 *
 * :: String -> Map BoardId [Option]
 */
export const parseOptions = R.compose(lines => {
  const optionNames = parseOptionNames(lines);
  const options = parseIntermediateOptions(lines);
  return R.map(convertIntermediateOptions(optionNames), options);
}, getLines);

/**
 * Converts { name, fqbn } objects into InstalledBoard objects.
 *
 * If there is no options for the board or it is not installed yet, it will
 * be returned untouched.
 *
 * :: Map BoardId [Option] -> (InstalledBoard | AvailableBoard) -> (InstalledBoard | AvailableBoard)
 */
export const patchBoardWithOptions = R.curry((boardsTxtContent, board) => {
  const options = parseOptions(boardsTxtContent);

  if (!R.has('fqbn', board)) return board;
  const boardId = R.pipe(R.prop('fqbn'), R.split(':'), R.last)(board);
  return R.pipe(R.propOr([], boardId), R.assoc('options', R.__, board))(
    options
  );
});

// =============================================================================
//
// API
//
// =============================================================================

/**
 * Loads `boards.txt` of installed cores and patches Board objects with options.
 *
 * :: Path -> [Core] -> [InstalledBoard | AvailableBoard] -> [InstalledBoard | AvailableBoard]
 */
export const patchBoardsWithOptions = R.curry(
  async (dataPath, cores, boards) => {
    if (!boards) return [];

    // Map CoreID Object
    const boardTxtContentsByCoreId = await R.compose(
      promiseAllProperties,
      R.map(txtPath => fse.readFile(txtPath, 'utf8')),
      R.map(core => getBoardsTxtPath(dataPath, core.ID, core.Installed)),
      R.indexBy(R.prop('ID'))
    )(cores);

    return R.map(board => {
      if (!R.has('fqbn', board)) return board;

      const coreId = R.compose(
        R.join(':'),
        R.init,
        R.split(':'),
        R.prop('fqbn')
      )(board);
      const boardTxtContents = R.propOr('', coreId, boardTxtContentsByCoreId);
      return patchBoardWithOptions(boardTxtContents, board);
    }, boards);
  }
);
