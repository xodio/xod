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
import { parse } from 'url';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import versionCompare from 'tiny-version-compare';

import { ADDITIONAL_URLS_PATH } from './config';

const ORIGINAL_PACKAGE_INDEX_FILE = 'package_index.json';

// AvailableBoard :: { name :: String, package :: String }

/**
 * Returns a list of paths to the additional package index files.
 *
 * Gets filenames of additional package index files from arduino cli config
 * by parsing URLs and joins filenames with path to packages directory.
 *
 * :: (() -> Promise Object Error) -> Path -> Promise [Path] Error
 */
const getPackageIndexFiles = async (getConfig, packagesDir) => {
  const config = await getConfig();
  const urls = R.pathOr([], ADDITIONAL_URLS_PATH, config);
  const filepaths = R.compose(
    R.map(fname => path.join(packagesDir, fname)),
    R.append(ORIGINAL_PACKAGE_INDEX_FILE),
    R.map(R.compose(R.last, R.split('/'), R.prop('pathname'), parse))
  )(urls);
  return filepaths;
};

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
 * :: (() -> Promise Object Error) -> Path -> Promise [AvailableBoard] Error
 */
export default R.composeP(
  getAvailableBoards,
  readPackages,
  getPackageIndexFiles
);
