/**
 * Module provides one function, that searches and reads all package_*_index.json
 * files and get all board names from them.
 * We need this function, because `arduino-cli board listall` shows only
 * boards of already installed packages.
 *
 * Function accepts a path to the directory with `package_*_index.json` files
 * and returns a Promise with a list of objects like this:
 * {
 *   name: 'Arduino Nano',
 *   package: 'arduino:avr',
 *   version: '1.6.12'
 * }
 */

import path from 'path';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import versionCompare from 'tiny-version-compare';

// AvailableBoard :: { name :: String, package :: String }

/**
 * Finds all package index json files in the specified directory.
 * Returns a promise with a list of full paths to the json files.
 *
 * :: Path -> Promise [Path] Error
 */
const findPackageIndexFiles = dir =>
  R.composeP(
    R.map(fname => path.join(dir, fname)),
    R.filter(R.test(/^package_(.*_)?index.json$/)),
    fse.readdir
  )(dir);

/**
 * Reads package index json files, take all package object from them and
 * returns one list of packages.
 *
 * :: [Path] -> Promise [Object] Error
 */
const readPackages = R.composeP(R.unnest, R.pluck('packages'), x =>
  Promise.all(R.map(fse.readJson, x))
);

const sortByVersion = R.sort(
  R.useWith(versionCompare, [R.prop('version'), R.prop('version')])
);

// :: [Object] -> [AvailableBoard]
const getAvailableBoards = R.compose(
  R.unnest,
  R.map(pkg =>
    R.compose(
      R.unnest,
      R.values,
      R.map(arch =>
        R.compose(
          R.map(
            R.compose(
              R.assoc('packageName', arch.name),
              R.assoc('package', `${pkg.name}:${arch.architecture}`),
              R.assoc('version', arch.version)
            )
          ),
          R.prop('boards')
        )(arch)
      ),
      R.map(R.pipe(sortByVersion, R.last)),
      R.groupBy(R.prop('architecture')),
      R.prop('platforms')
    )(pkg)
  )
);

/**
 * Reads all package index json files in the specified directory
 * and returns a promise with a list of Available Boards.
 *
 * :: Path -> Promise [AvailableBoard] Error
 */
export default R.composeP(
  getAvailableBoards,
  readPackages,
  findPackageIndexFiles
);
