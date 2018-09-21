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
    (acc, [tokens, value]) =>
      R.compose(
        R.assocPath(R.__, value, acc),
        R.when(
          R.both(R.propEq(1, 'menu'), R.compose(R.equals(4), R.length)),
          R.append('cpuName')
        )
      )(tokens),
    {}
  ),
  R.map(R.compose(R.zipWith(R.call, [R.split('.'), R.identity]), R.split('='))),
  R.reject(R.test(/^(#|$)/)),
  R.map(R.trim),
  R.split(/$/gm)
);

// :: Path -> Promise Object Error
const readBoardsTxt = boardsTxtPath =>
  R.pipeP(() => fse.readFile(boardsTxtPath, 'utf8'), parseTxtConfig)();

/**
 * Returns a patched list of boards, where could be added/replaced some
 * boards with FQBN and Names included cpu options.
 * E.G.
 * `Arduino/Geuino Uno` will be left untouched.
 * But one item `Arduino/Genuino Mega or Mega 2560` will be replaced
 * with two new items:
 * `Arduino/Genuino Mega or Mega 2560 (ATmega2560 (Mega 2560))` with FQBN `arduino:avr:mega:cpu=atmega2560`
 * `Arduino/Genuino Mega or Mega 2560 (ATmega1280)` with FQBN `arduino:avr:mega:cpu=atmega1280`
 *
 * Other fields of boards will be untouched and cloned between the same items.
 *
 * Core :: { ID:: String, Installed:: String }
 * :: Path -> [Core] -> Nullable [{fqbn, name}] -> Promise [{fqbn, name}] Error
 */
export const patchBoardsWithCpu = R.curry(async (dataPath, cores, boards) => {
  if (!boards) return [];

  // Map CoreID Object
  const coreBoardPrefs = await R.compose(
    promiseAllProperties,
    R.map(txtPath => readBoardsTxt(txtPath)),
    R.map(core => getBoardsTxtPath(dataPath, core.ID, core.Installed)),
    R.indexBy(R.prop('ID'))
  )(cores);

  // Map CoreId [{FQBN, Board Name}]
  const boardsByCoreId = R.compose(
    R.groupBy(R.pipe(R.prop('fqbn'), R.split(':'), R.take(2), R.join(':'))),
    R.reject(R.propSatisfies(R.isEmpty, 'fqbn')) // reject "unknown" boards
  )(boards);

  const patchedBoards = R.mapObjIndexed((boardList, coreId) =>
    R.compose(
      R.unnest,
      R.map(board => {
        const boardKey = R.pipe(R.prop('fqbn'), R.split(':'), R.last)(board);
        const cpuOptions = R.path(
          [coreId, boardKey, 'menu', 'cpu'],
          coreBoardPrefs
        );
        return !cpuOptions
          ? [board]
          : R.reduce((acc, cpuOpt) => {
              const newBoard = R.evolve(
                {
                  name: name => `${name} (${cpuOpt.cpuName})`,
                  fqbn: fqbn => `${fqbn}:cpu=${cpuOpt.build.mcu}`,
                },
                board
              );
              return R.append(newBoard, acc);
            }, [])(R.values(cpuOptions));
      })
    )(boardList)
  )(boardsByCoreId);

  return R.pipe(R.values, R.unnest)(patchedBoards);
});
