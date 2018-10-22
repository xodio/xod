import os from 'os';
import path from 'path';
import which from 'which';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import arduinoCli from 'arduino-cli';
import * as xd from 'xod-deploy';
import { createError, isAmong } from 'xod-func-tools';
import * as cpx from 'cpx';

import subscribeIpc from './subscribeIpc';
import { loadWorkspacePath } from './workspaceActions';
import { getPathToBundledWorkspace, IS_DEV } from './utils';
import migrateArduinoPackages from './migrateArduinoPackages';
import {
  LIST_BOARDS,
  UPLOAD_TO_ARDUINO,
  UPDATE_INDEXES,
  CHECK_ARDUINO_DEPENDENCY_UPDATES,
  UPGRADE_ARDUINO_DEPENDECIES,
} from '../shared/events';
import {
  compilationBegun,
  CODE_COMPILED,
  BEGIN_COMPILATION_IN_CLOUD,
  UPLOAD_PROCESS_BEGINS,
} from '../shared/messages';
import {
  ARDUINO_LIBRARIES_DIRNAME,
  ARDUINO_CLI_LIBRARIES_DIRNAME,
  ARDUINO_PACKAGES_DIRNAME,
  BUNDLED_ADDITIONAL_URLS,
  ARDUINO_EXTRA_URLS_FILENAME,
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
    const arduinoCliBin =
      os.platform() === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';

    if (!IS_DEV) {
      resolve(path.join(process.resourcesPath, arduinoCliBin));
      return;
    }

    if (process.env.XOD_ARDUINO_CLI) {
      resolve(process.env.XOD_ARDUINO_CLI);
      return;
    }

    which(arduinoCliBin, (err, cliPath) => {
      if (err) {
        reject(
          createError('ARDUINO_CLI_NOT_FOUND', {
            isDev: IS_DEV,
          })
        );
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

// :: Path -> Promise Path Error
const ensureExtraTxt = async wsPath => {
  const extraTxtFilePath = path.join(
    wsPath,
    ARDUINO_PACKAGES_DIRNAME,
    ARDUINO_EXTRA_URLS_FILENAME
  );
  await fse.ensureFile(extraTxtFilePath);
  return extraTxtFilePath;
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

// :: Board -> Board
const patchFqbnWithOptions = board => {
  const selectedOptions = board.selectedOptions || {};
  const options = board.options || [];

  const defaultBoardOptions = R.compose(
    R.mergeAll,
    R.reject(R.isNil),
    R.map(opt => ({
      [opt.optionId]: R.pathOr(null, ['values', 0, 'value'], opt),
    }))
  )(options);
  const defaultBoardOptionKeys = R.keys(defaultBoardOptions);

  // Find out selected board options that equal to default board options.
  //
  // TODO:
  // It's better to use all options that was defined by User to be sure
  // that will be compiled and uploaded as User desires,
  // but arduino-cli@0.3.1 have a problem:
  // https://github.com/arduino/arduino-cli/issues/64
  const equalToDefaultBoardOpionKeys = R.compose(
    R.reduce(
      (acc, [key, val]) =>
        defaultBoardOptions[key] && defaultBoardOptions[key] === val
          ? R.append(key, acc)
          : acc,
      []
    ),
    R.toPairs
  )(selectedOptions);

  // Find out board option keys that does not fit the selected board
  const staleBoardOptionKeys = R.compose(
    R.reject(isAmong(defaultBoardOptionKeys)),
    R.keys
  )(selectedOptions);

  const keysToOmit = R.concat(
    equalToDefaultBoardOpionKeys,
    staleBoardOptionKeys
  );

  // TODO
  // This is a kludge cause arduino-cli 0.3.1
  // can't find out all default board options.
  // So we have to specify at least one option.
  const oneOfDefaultOptions = R.compose(
    R.pick(R.__, defaultBoardOptions),
    R.of,
    R.head
  )(defaultBoardOptionKeys);

  const selectedBoardOptions = R.omit(keysToOmit, selectedOptions);

  return R.compose(
    R.assoc('fqbn', R.__, board),
    R.concat(board.fqbn),
    R.unless(R.isEmpty, R.concat(':')),
    R.join(','),
    R.map(R.join('=')),
    R.toPairs,
    R.when(R.isEmpty, R.always(oneOfDefaultOptions))
  )(selectedBoardOptions);
};

// =============================================================================
//
// Error wrappers
//
// =============================================================================

// :: Error -> RejectedPromise Error
const wrapCompileError = err =>
  Promise.reject(
    createError('COMPILE_TOOL_ERROR', {
      message: err.message,
      code: err.code,
    })
  );

// :: Error -> RejectedPromise Error
const wrapUploadError = err =>
  Promise.reject(
    createError('UPLOAD_TOOL_ERROR', {
      message: err.message,
      code: err.code,
    })
  );

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
 * Prepare `__packages__` directory inside user's workspace if
 * it does not prepared earlier:
 * - copy bundled package index json files
 * - migrate old arduino packages if they are exist
 * - create `extra.txt` file
 *
 * Returns Path to the `__packages__` directory inside user's workspace
 *
 * :: Path -> Promise Path Error
 */
const prepareWorkspacePackagesDir = async wsPath => {
  const packagesDirPath = getArduinoPackagesPath(wsPath);

  await copyPackageIndexes(packagesDirPath);
  await migrateArduinoPackages(wsPath);
  await ensureExtraTxt(wsPath);

  return packagesDirPath;
};
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
export const create = async sketchDir => {
  const wsPath = await loadWorkspacePath();
  const arduinoCliPath = await getArduinoCliPath();
  const packagesDirPath = await prepareWorkspacePackagesDir(wsPath);

  if (!await fse.pathExists(arduinoCliPath)) {
    throw createError('ARDUINO_CLI_NOT_FOUND', {
      path: arduinoCliPath,
      isDev: IS_DEV,
    });
  }

  return arduinoCli(arduinoCliPath, {
    arduino_data: packagesDirPath,
    sketchbook_path: sketchDir,
    board_manager: {
      additional_urls: BUNDLED_ADDITIONAL_URLS,
    },
  });
};

/**
 * Updates path to the `arduino_data` in the arduino-cli `.cli-config.yml`
 * and prepares `__packages__` directory in the user's workspace if needed.
 *
 * We have to call this function when user changes workspace to make all
 * functions provided by this module works properly without restarting the IDE.
 *
 * :: ArduinoCli -> Path -> Promise Object Error
 */
export const switchWorkspace = async (cli, newWsPath) => {
  const oldConfig = await cli.dumpConfig();
  const packagesDirPath = await prepareWorkspacePackagesDir(newWsPath);
  const newConfig = R.assoc('arduino_data', packagesDirPath, oldConfig);
  return cli.updateConfig(newConfig);
};

/**
 * Updates package index json files.
 * Returns log of updating.
 *
 * :: ArduinoCli -> Promise String Error
 */
const updateIndexes = async cli => {
  const urls = await cli
    .dumpConfig()
    .then(R.pathOr([], ['board_manager', 'additional_urls']));

  return R.composeP(
    () => cli.core.updateIndex(),
    cli.addPackageIndexUrls,
    R.reject(isAmong(urls)),
    R.split('\r\n'),
    p => fse.readFile(p, { encoding: 'utf8' }),
    ensureExtraTxt,
    loadWorkspacePath
  )();
};

/**
 * Returns map of installed boards and boards that could be installed:
 * - Installed boards (boards, which are ready for deploy)
 *   { name :: String, fqbn :: String }
 * - Available boards (boards, which packages could be installed)
 *   { name :: String, package :: String, version :: String }
 *
 * :: ArduinoCli -> Promise { installed :: [InstalledBoard], available :: [AvailableBoard] } Error
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
  const uploadLog = await cli
    .upload(
      stdout =>
        onProgress({
          percentage: 60,
          message: stdout,
          tab: 'uploader',
        }),
      payload.port.comName,
      payload.board.fqbn,
      sketchName,
      true
    )
    .catch(wrapUploadError);
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

  const compileLog = await cli
    .compile(
      stdout =>
        onProgress({
          percentage: 40,
          message: stdout,
          tab: 'compiler',
        }),
      payload.board.fqbn,
      sketchName,
      true
    )
    .catch(wrapCompileError);

  onProgress({
    percentage: 50,
    message: UPLOAD_PROCESS_BEGINS,
    tab: 'uploader',
  });

  const uploadLog = await cli
    .upload(
      stdout =>
        onProgress({
          percentage: 60,
          message: stdout,
          tab: 'uploader',
        }),
      payload.port.comName,
      payload.board.fqbn,
      sketchName,
      true
    )
    .catch(wrapUploadError);
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
  const payloadWithUpdatedFqbn = R.over(
    R.lensProp('board'),
    patchFqbnWithOptions,
    payload
  );
  return uploadFn(onProgress, cli, payloadWithUpdatedFqbn);
};

/**
 * Checks arduino packages for updates.
 *
 * :: ArduinoCli -> Promise String Error
 */
const checkUpdates = cli =>
  R.composeP(R.reject(arch => arch.Installed === arch.Latest), cli.core.list)();

/**
 * Updates arduino packages.
 *
 * :: (Object -> _) -> ArduinoCli -> Promise String Error
 */
const upgradeArduinoPackages = (onProgress, cli) =>
  cli.core.upgrade(onProgress);

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

export const subscribeUpdateIndexes = cli => {
  subscribeIpc(() => updateIndexes(cli), UPDATE_INDEXES);
};

export const subscibeCheckUpdates = cli => {
  subscribeIpc(() => checkUpdates(cli), CHECK_ARDUINO_DEPENDENCY_UPDATES);
};

export const subscribeUpgradeArduinoPackages = cli => {
  subscribeIpc(
    (_, _2, onProgress) => upgradeArduinoPackages(onProgress, cli),
    UPGRADE_ARDUINO_DEPENDECIES
  );
};
