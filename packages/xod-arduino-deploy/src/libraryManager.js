import * as R from 'ramda';
import * as fse from 'fs-extra';
import path from 'path';
import { Maybe } from 'ramda-fantasy';

import {
  foldMaybeWith,
  createError,
  allPromises,
  then,
  explodeMaybe,
  tapP,
} from 'xod-func-tools';

import download from './download';
import { unpackZip } from './unpack';
import createProgress from './progress';
import MSG from './messages';

// :: URL -> String
const getProjectNameFromGithubUrl = R.match(/github.com\/.+\/(.+)\/{0,1}/);

// :: URL -> URL
const getGithubArchiveUrl = R.compose(
  R.concat(R.__, '/archive/master.zip'),
  R.when(R.pipe(R.tail, R.equals('/')), R.init)
);

/**
 * Arduino-builder does not work with directory names containing symbols
 * other than A-Za-z0-9_.
 * So the library root directory have to be renamed:
 * - Replace all hyphens with underscores
 * - Remove all symbols not in A-Za-z0-9_
 *
 * :: String -> String
 */
const normalizeLibraryName = R.compose(
  R.replace(/[^A-Za-z0-9_]/g, ''),
  R.replace(/-/g, '_')
);

// :: Path -> String -> Promise Boolean Error
const checkLibraryInstalled = R.curry((libsPath, libName) =>
  R.compose(fse.pathExists, path.resolve)(libsPath, libName)
);

// =============================================================================
//
// API
//
// =============================================================================

/**
 * Returns the normalized library name from a URL wrapped with `Maybe`.
 * Works only with URLs on the master branch of the GitHub repository.
 * If the URL is incorrect or the repository name can't be normalized at all
 * (contains only forbidden characters) it returns Nothing.
 *
 * :: URL -> Maybe String
 */
export const getLibraryNameFromUrl = R.compose(
  R.chain(
    R.compose(
      R.ifElse(R.isEmpty, Maybe.Nothing, Maybe.of),
      normalizeLibraryName
    )
  ),
  Maybe,
  R.nth(1),
  getProjectNameFromGithubUrl
);

/**
 * Checks whether libraries already installed in the specified path.
 * Accepts a function as the first argument to notify someone about progress
 * (see `ProgressData` type in the `progress.js`).
 *
 * Returns `Promise` with the map of check results indexed by library URLs.
 * Returns rejected `Promise` either on a normalization library name error or
 * on an FS permission error.
 *
 * Example of the resulting map:
 * {
 *   'https://github.com/arduino-libraries/Stepper': true, // means it's installed
 *   'https://github.com/arduino-libraries/GSM': false,    // means it's missing
 * }
 *
 * :: (ProgressData -> _) -> Path -> [URL] -> Promise (Map URL Boolean) Error
 */
export const checkLibrariesInstalledByUrls = R.curry(
  (onProgress, libsPath, libUrls) => {
    const progress = createProgress(libUrls.length);
    return R.compose(
      then(R.zipObj(libUrls)),
      allPromises,
      R.map(url =>
        R.compose(
          foldMaybeWith(
            () => Promise.reject(createError('CANT_GET_LIBRARY_NAME', { url })),
            libName =>
              checkLibraryInstalled(libsPath, libName).then(
                R.tap(isInstalled =>
                  onProgress(
                    progress(
                      isInstalled
                        ? MSG.LIBRARY_EXIST({ libName }).note // eslint-disable-line new-cap
                        : MSG.LIBRARY_MISSING({ libName }).note // eslint-disable-line new-cap
                    )
                  )
                )
              )
          ),
          getLibraryNameFromUrl
        )(url)
      )
    )(libUrls);
  }
);

/**
 * Installs libraries in the specified path from the list of URLs.
 * Accepts a function as the first argument to notify someone about progress
 * (see `ProgressData` type in the `progress.js`).
 *
 * Returns `Promise` with the list of normalized names of installed libraries.
 * Returns rejected `Promise` on a normalization library name error,
 * on an FS permission error or on a connection/server error.
 *
 * :: (ProgressData -> _) -> Path -> [URL] -> Promise [String] Error
 */
export const installLibrariesByUrls = R.curry(
  (onProgress, libsPath, libUrls) => {
    const startFrom = libUrls.length; // because `check` uses first 3 steps
    const steps = libUrls.length * 3; // check, download, unpack
    const progress = createProgress(steps, startFrom);
    const progressCheckInstalled = R.pipe(progress.wrap, onProgress);

    return R.composeP(
      allPromises,
      R.map(urlToInstall => {
        const libName = R.pipe(
          getLibraryNameFromUrl,
          explodeMaybe('IMPOSIBLE ERROR') // because `checkLibrariesInstalledByUrls` already checked all URLs
        )(urlToInstall);
        const archiveUrl = getGithubArchiveUrl(urlToInstall);
        const libraryDir = path.resolve(libsPath, libName);
        const archivePath = path.resolve(libsPath, `${libName}.zip`);
        return download(archiveUrl, archivePath)
          .then(
            R.tap(() =>
              // eslint-disable-next-line new-cap
              onProgress(progress(MSG.LIBRARY_DOWNLOADED({ libName }).note))
            )
          )
          .then(unpackZip)
          .then(unpackedDir =>
            fse.rename(path.resolve(libsPath, unpackedDir), libraryDir)
          )
          .then(tapP(() => fse.remove(archivePath)))
          .then(
            R.tap(() =>
              // eslint-disable-next-line new-cap
              onProgress(progress(MSG.LIBRARY_INSTALLED({ libName }).note))
            )
          )
          .then(() => libName);
      }),
      R.keys,
      R.filter(R.not),
      checkLibrariesInstalledByUrls(progressCheckInstalled)
    )(libsPath, libUrls);
  }
);
