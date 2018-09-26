import os from 'os';
import path from 'path';
import which from 'which';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import arduinoCli from 'arduino-cli';
import * as xd from 'xod-deploy';
import { createError } from 'xod-func-tools';
import * as cpx from 'cpx';

import subscribeIpc from './subscribeIpc';
import { loadWorkspacePath } from './workspaceActions';
import { getPathToBundledWorkspace } from './utils';
import { LIST_BOARDS, UPLOAD_TO_ARDUINO } from '../shared/events';
import {
  compilationBegun,
  CODE_COMPILED,
  BEGIN_COMPILATION_IN_CLOUD,
} from '../shared/messages';
import {
  ARDUINO_LIBRARIES_DIRNAME,
  ARDUINO_CLI_LIBRARIES_DIRNAME,
  ARDUINO_PACKAGES_DIRNAME,
  BUNDLED_ADDITIONAL_URLS,
} from './constants';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: Path -> Path
const getArduinoPackagesPath = dir =>
  path.resolve(dir, ARDUINO_PACKAGES_DIRNAME);

const bundledPackagesDir = R.compose(
  getArduinoPackagesPath,
  getPathToBundledWorkspace
)();

// :: _ -> Promise Path Error
const getArduinoCliPath = () =>
  new Promise((resolve, reject) => {
    if (process.env.ARDUINO_CLI) {
      resolve(process.env.ARDUINO_CLI);
      return;
    }

    which('arduino-cli', (err, cliPath) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(cliPath);
    });
  });

const getLibsDir = p => path.join(p, ARDUINO_LIBRARIES_DIRNAME);

// :: Path -> Path -> Promise Path -> Error
const copy = async (from, to) =>
  new Promise((resolve, reject) => {
    cpx.copy(from, to, err => {
      if (err) return reject(err);
      return resolve(to);
    });
  });

const recWildcard = p => path.join(p, '**');

// :: Path -> Path -> Path -> Promise Path Error
const copyLibraries = async (bundledLibDir, userLibDir, sketchbookLibDir) => {
  await copy(recWildcard(bundledLibDir), sketchbookLibDir);
  await copy(recWildcard(userLibDir), sketchbookLibDir);
  return sketchbookLibDir;
};

const copyPackageIndexes = async wsPackageDir => {
  const filesToCopy = await R.composeP(
    R.filter(R.pipe(path.extname, R.equals('.json'))),
    fse.readdir
  )(bundledPackagesDir);

  return Promise.all(
    R.map(
      fname =>
        fse.copy(
          path.join(bundledPackagesDir, fname),
          path.join(wsPackageDir, fname),
          {
            overwrite: false,
            errorOnExist: false,
          }
        ),
      filesToCopy
    )
  );
};

/**
 * Copy libraries from User workspace and bundled workspace into
 * arduino-cli sketchbook libraries directory.
 * :: ArduinoCli -> Promise Path Error
 */
const copyLibrariesToSketchbook = async cli => {
  const sketchbookLibDir = await R.composeP(
    p => path.join(p, ARDUINO_CLI_LIBRARIES_DIRNAME),
    R.prop('sketchbook_path'),
    cli.dumpConfig
  )();
  const bundledLibPath = getLibsDir(getPathToBundledWorkspace());
  const userLibPath = await loadWorkspacePath().then(getLibsDir);

  return copyLibraries(bundledLibPath, userLibPath, sketchbookLibDir);
};

// =============================================================================
//
// Handlers
//
// =============================================================================

/**
 * Creates a directory to store sketches and libraries for compilation
 * (needed for `arduino-cli`, it can't take libraries from another directory),
 * and store compiled binary files for further upload.
 *
 * :: _ -> Promise Path Error
 */
export const prepareSketchDir = () =>
  fse.mkdtemp(path.resolve(os.tmpdir(), 'xod_temp_sketchbook'));

/**
 * Creates an instance of ArduinoCli.
 *
 * It will try to find out specified in env variable ArduinoCli or
 * find installed one in $PATH vartiable.
 *
 * On instancing it will set paths in the config to the $WS/__packages__
 * and copy bundled `package_index.json` into this directory if it does not
 * exist.
 *
 * :: Path -> Promise ArduinoCli Error
 */
export const create = sketchDir =>
  loadWorkspacePath().then(async wsPath => {
    const arduinoCliPath = await getArduinoCliPath();

    const packagesDirPath = getArduinoPackagesPath(wsPath);

    await copyPackageIndexes(packagesDirPath);

    return arduinoCli(arduinoCliPath, {
      arduino_data: packagesDirPath,
      sketchbook_path: sketchDir,
      board_manager: {
        additional_urls: BUNDLED_ADDITIONAL_URLS,
      },
    });
  });

/**
 * Returns map of installed boards and boards that could be installed:
 * - Installed boards (boards, which are ready for deploy)
 *   { name :: String, fqbn :: String }
 * - Available boards (boards, which packages could be installed)
 *   { name :: String, package :: String, version :: String }
 *
 * :: ArduinoCli -> { installed :: [InstalledBoard], available :: [AvailableBoard] }
 */
export const listBoards = async cli =>
  Promise.all([cli.listInstalledBoards(), cli.listAvailableBoards()]).then(
    res => ({
      installed: res[0],
      available: res[1],
    })
  );

/**
 * Saves code into arduino-cli sketchbook directory.
 *
 * :: ArduinoCli -> String -> Promise { sketchName: String, sketchPath: Path } Error
 */
const saveSketch = async (cli, code) => {
  const sketchName = `xod_${Date.now()}_sketch`;
  const sketchPath = await cli.createSketch(sketchName);
  await fse.writeFile(sketchPath, code);
  return { sketchName, sketchPath };
};

/**
 * Compiles code in the cloud and saves artifacts
 * in the same directory which contains sketch.
 *
 * :: FQBN -> String -> Path -> Promise Path Error
 */
const compileAndSaveBinaryInCloud = (fqbn, code, sketchPath) => {
  const pioId = xd.getPioBoardId(fqbn);
  const sketchDir = path.dirname(sketchPath);
  const sketchNameWithoutExt = R.replace(
    path.extname(sketchPath),
    '',
    path.basename(sketchPath)
  );

  return xd
    .compile(pioId, code)
    .then(xd.saveCompiledBinary(sketchDir))
    .then(filePath => {
      const fqbnToFilename = R.replace(/:/g, '.', fqbn);
      const fileExt = path.extname(filePath);
      const newFilename = `${sketchNameWithoutExt}.${fqbnToFilename}${fileExt}`;
      const newPath = path.resolve(sketchDir, newFilename);
      return fse.rename(filePath, newPath).then(R.always(newPath));
    });
};

const uploadThroughCloud = async (onProgress, cli, payload) => {
  onProgress({
    percentage: 0,
    message: compilationBegun(payload.board.name),
    tab: 'compiler',
  });
  const { sketchName, sketchPath } = await saveSketch(cli, payload.code);
  onProgress({
    percentage: 10,
    message: BEGIN_COMPILATION_IN_CLOUD,
    tab: 'compiler',
  });
  if (!xd.canCompile(payload.board.fqbn)) {
    return Promise.reject(
      createError('CLOUD_COMPILE_UNSPUPPORTED', {
        boardName: payload.board.name,
      })
    );
  }
  await compileAndSaveBinaryInCloud(
    payload.board.fqbn,
    payload.code,
    sketchPath
  );
  onProgress({
    percentage: 40,
    message: CODE_COMPILED,
    tab: 'compiler',
  });
  const uploadLog = await cli.upload(
    stdout =>
      onProgress({
        percentage: 100,
        message: stdout,
        tab: 'uploader',
      }),
    payload.port.comName,
    payload.board.fqbn,
    sketchName,
    false
  );
  onProgress({
    percentage: 100,
    message: '',
    tab: 'uploader',
  });

  return uploadLog;
};

/**
 * Compiles and uploads sketch through USB.
 *
 * :: (Object -> _) -> ArduinoCli -> UploadPayload -> Promise String Error
 */
const uploadThroughUSB = async (onProgress, cli, payload) => {
  onProgress({
    percentage: 0,
    message: compilationBegun(payload.board.name),
    tab: 'compiler',
  });
  const { sketchName } = await saveSketch(cli, payload.code);
  onProgress({
    percentage: 10,
    message: '',
    tab: 'compiler',
  });

  await copyLibrariesToSketchbook(cli);

  onProgress({
    percentage: 20,
    message: '',
    tab: 'compiler',
  });

  const compileLog = await cli.compile(
    stdout =>
      onProgress({
        percentage: 40,
        message: stdout,
        tab: 'compiler',
      }),
    payload.board.fqbn,
    sketchName,
    false
  );

  const uploadLog = await cli.upload(
    stdout =>
      onProgress({
        percentage: 100,
        message: stdout,
        tab: 'uploader',
      }),
    payload.port.comName,
    payload.board.fqbn,
    sketchName,
    false
  );
  onProgress({
    percentage: 100,
    message: '',
    tab: 'uploader',
  });
  return [compileLog, uploadLog].join('\r\n');
};

/**
 * Begins upload pipeline.
 * It have a branch:
 * - if `payload.cloud` is `true` it will upload through cloud
 * - otherwise it will upload through USB
 *
 * Returns Promise with an upload log. TODO: Is it right?
 *
 * :: (Object -> _) -> ArduinoCli -> UploadPayload -> Promise String Error
 */
export const upload = (onProgress, cli, payload) => {
  const uploadFn = payload.cloud ? uploadThroughCloud : uploadThroughUSB;
  return uploadFn(onProgress, cli, payload);
};

// =============================================================================
//
// Subscribers
//
// =============================================================================
export const subscribeListBoards = cli => {
  subscribeIpc(() => listBoards(cli), LIST_BOARDS);
};

export const subscribeUpload = cli => {
  subscribeIpc(
    (_, payload, onProgress) => upload(onProgress, cli, payload),
    UPLOAD_TO_ARDUINO
  );
};
