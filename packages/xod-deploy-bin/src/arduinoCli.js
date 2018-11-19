import os from 'os';
import path from 'path';
import which from 'which';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import arduinoCli from 'arduino-cli';
import { createError } from 'xod-func-tools';
import * as cpx from 'cpx';

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

// :: Boolean -> Promise Path Error
const getArduinoCliPath = (isDev = false) =>
  new Promise((resolve, reject) => {
    const arduinoCliBin =
      os.platform() === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';

    // use bundled binary for electron environment
    if (process.versions.electron && !isDev) {
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
            isDev,
          })
        );
        return;
      }
      resolve(cliPath);
    });
  });

const getLibsDir = p => path.join(p, ARDUINO_LIBRARIES_DIRNAME);

// :: String -> [String]
const parseExtraTxtContent = R.compose(R.reject(R.isEmpty), R.split(/\r\n|\n/));

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

// :: Path -> Path
const getExtraTxtPath = wsPath =>
  path.join(wsPath, ARDUINO_PACKAGES_DIRNAME, ARDUINO_EXTRA_URLS_FILENAME);

// :: Path -> Promise Path Error
const ensureExtraTxt = async wsPath => {
  const extraTxtFilePath = getExtraTxtPath(wsPath);
  const doesExist = await fse.pathExists(extraTxtFilePath);
  if (!doesExist) {
    const bundledUrls = R.join(os.EOL, BUNDLED_ADDITIONAL_URLS);
    await fse.writeFile(extraTxtFilePath, bundledUrls, { flag: 'wx' });
  } else {
    // TODO: For Users on 0.25.0 or 0.25.1 we have to add bundled esp8266
    // into existing `extra.txt`. One day we'll remove this kludge.
    const extraTxtContents = await fse.readFile(extraTxtFilePath, {
      encoding: 'utf8',
    });
    const extraUrls = parseExtraTxtContent(extraTxtContents);
    const newContents = R.compose(
      R.join(os.EOL),
      R.concat(R.__, extraUrls),
      R.difference(BUNDLED_ADDITIONAL_URLS)
    )(extraUrls);
    await fse.writeFile(extraTxtFilePath, newContents);
  }
  return extraTxtFilePath;
};

const copyPackageIndexes = async (wsBundledPath, wsPackageDir) => {
  const bundledPackagesDir = await getArduinoPackagesPath(wsBundledPath);
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
 * :: ArduinoCli -> Path -> Path -> Promise Path Error
 */
const copyLibrariesToSketchbook = async (cli, wsBundledPath, ws) => {
  const sketchbookLibDir = await R.composeP(
    p => path.join(p, ARDUINO_CLI_LIBRARIES_DIRNAME),
    R.prop('sketchbook_path'),
    cli.dumpConfig
  )();
  const bundledLibPath = getLibsDir(wsBundledPath);
  const userLibPath = getLibsDir(ws);

  return copyLibraries(bundledLibPath, userLibPath, sketchbookLibDir);
};

// :: Board -> Board
export const patchFqbnWithOptions = board => {
  const selectedOptions = board.selectedOptions || {};
  const options = board.options || [];

  const defaultBoardOptions = R.compose(
    R.reject(R.isNil),
    R.mergeAll,
    R.map(opt => ({
      [opt.optionId]: R.pathOr(null, ['values', 0, 'value'], opt),
    }))
  )(options);

  // :: StrMap OptionId [OptionValue]
  const boardPossibleOptionValuesById = R.compose(
    R.map(R.compose(R.pluck('value'), R.prop('values'))),
    R.indexBy(R.prop('optionId'))
  )(options);

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

  // Find out board option keys that does not fit the selected board:
  // a. no optionId for this board
  //    E.G. arduino:avr:mega has no options `debugLevel` and it will be ommited
  // b. no optionValue for this board
  //    E.G. previously user uploaded on Arduino Nano with `cpu=atmega328old`,
  //         but now he tries to upload onto Arduino Mega, which has optionId
  //         `cpu`, but does not have `atmega328old` option
  // :: [OptionId]
  const staleBoardOptionKeys = R.compose(
    R.reduce(
      (acc, [optionId, optionValue]) =>
        boardPossibleOptionValuesById[optionId] &&
        R.contains(optionValue, boardPossibleOptionValuesById[optionId])
          ? acc
          : R.append(optionId, acc),
      []
    ),
    R.toPairs
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
    R.head,
    R.keys
  )(defaultBoardOptions);

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
export const wrapUploadError = err =>
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
 * - create `extra.txt` file
 *
 * Returns Path to the `__packages__` directory inside user's workspace
 *
 * :: Path -> Path -> Promise Path Error
 */
export const prepareWorkspacePackagesDir = async (wsBundledPath, wsPath) => {
  const packagesDirPath = getArduinoPackagesPath(wsPath);

  await copyPackageIndexes(wsBundledPath, packagesDirPath);
  await ensureExtraTxt(wsPath);

  return packagesDirPath;
};

/**
 * Copies URLs to additional package index files from `extra.txt` into
 * `arduino-cli` config file.
 *
 * :: Path -> ArduinoCli -> Promise [URL] Error
 */
const syncAdditionalPackages = async (wsPath, cli) => {
  const extraTxtPath = getExtraTxtPath(wsPath);
  const extraTxtContent = await fse.readFile(extraTxtPath, {
    encoding: 'utf8',
  });
  const urls = parseExtraTxtContent(extraTxtContent);
  return cli.setPackageIndexUrls(urls);
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
 * :: Path -> Path -> Path -> Boolean -> Promise ArduinoCli Error
 */
export const createCli = async (
  wsBundledPath,
  wsPath,
  sketchDir,
  isDev = false
) => {
  const arduinoCliPath = await getArduinoCliPath(isDev);
  const packagesDirPath = await prepareWorkspacePackagesDir(
    wsBundledPath,
    wsPath
  );

  if (!await fse.pathExists(arduinoCliPath)) {
    throw createError('ARDUINO_CLI_NOT_FOUND', {
      path: arduinoCliPath,
      isDev,
    });
  }

  const cli = arduinoCli(arduinoCliPath, {
    arduino_data: packagesDirPath,
    sketchbook_path: sketchDir,
  });

  await syncAdditionalPackages(wsPath, cli);

  return cli;
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
  const result = cli.updateConfig(newConfig);
  await syncAdditionalPackages(newWsPath, cli);
  return result;
};

/**
 * It updates package index files or throw an error.
 * Function for internal use only.
 *
 * Needed as a separate function to avoid circular function dependencies:
 * `listBoards` and `updateIndexes`
 *
 * It could fail when:
 * - no internet connection
 * - host not found
 *
 * :: Path -> ArduinoCli -> Promise _ Error
 */
const updateIndexesInternal = (wsPath, cli) =>
  cli.core.updateIndex().catch(err => {
    throw createError('UPDATE_INDEXES_ERROR_NO_CONNECTION', {
      pkgPath: getArduinoPackagesPath(wsPath),
      // `arduino-cli` outputs everything in stdout
      // so we have to extract only errors from stdout:
      error: R.replace(/^(.|\s)+(?=Error:)/gm, '', err.stdout),
    });
  });

/**
 * Returns map of installed boards and boards that could be installed:
 * - Installed boards (boards, which are ready for deploy)
 *   { name :: String, fqbn :: String }
 * - Available boards (boards, which packages could be installed)
 *   { name :: String, package :: String, version :: String }
 *
 * :: Path -> ArduinoCli -> Promise { installed :: [InstalledBoard], available :: [AvailableBoard] } Error
 */
export const listBoards = async (wsPath, cli) => {
  await syncAdditionalPackages(wsPath, cli);

  return Promise.all([
    cli.listInstalledBoards().catch(err => {
      const errContents = JSON.parse(err.stdout);
      const normalizedError = new Error(errContents.Cause);
      normalizedError.code = err.code;
      throw normalizedError;
    }),
    cli.listAvailableBoards(),
  ])
    .then(res => ({
      installed: res[0],
      available: res[1],
    }))
    .catch(async err => {
      if (R.propEq('code', 6, err)) {
        // Catch error produced by arduino-cli, but actually it's not an error:
        // When User added a new URL into `extra.txt` file it causes that
        // arduino-cli tries to read new JSON but it's not existing yet
        // so it fails with error "no such file or directory"
        // To avoid this and make a good UX, we'll force call `updateIndexes`
        return updateIndexesInternal(wsPath, cli).then(() => listBoards(cli));
      }

      throw createError('UPDATE_INDEXES_ERROR_BROKEN_FILE', {
        pkgPath: getArduinoPackagesPath(wsPath),
        error: err.message,
      });
    });
};

/**
 * Updates package index json files.
 * Returns a list of just added URLs
 *
 * :: Path -> ArduinoCli -> Promise [URL] Error
 */
export const updateIndexes = async (wsPath, cli) => {
  const addedUrls = await syncAdditionalPackages(wsPath, cli);

  await updateIndexesInternal(wsPath, cli);

  // We have to call `listBoards` to be sure
  // all new index files are valid, because `updateIndex`
  // only downloads index files without validating
  // Bug reported: https://github.com/arduino/arduino-cli/issues/81
  await listBoards(wsPath, cli);

  return addedUrls;
};

/**
 * Saves code into arduino-cli sketchbook directory.
 *
 * :: ArduinoCli -> String -> Promise { sketchName: String, sketchPath: Path } Error
 */
export const saveSketch = async (cli, code) => {
  const sketchName = `xod_${Date.now()}_sketch`;
  const sketchPath = await cli.createSketch(sketchName);
  await fse.writeFile(sketchPath, code);
  return { sketchName, sketchPath };
};

const compilationBegun = boardName =>
  `Begin compiling code for the board ${boardName}`;

const UPLOAD_PROCESS_BEGINS = 'Uploading compiled code to the board...';

/**
 * Compiles sketch
 *
 * payload object:
 * {
 *  board: {
 *    name: String,
 *    fqbn: String,
 *  },
 *  code: String,
 *  ws: Path,
 *  wsBundledPath: Path,
 * }
 * :: (Object -> _) -> ArduinoCli -> CompilePayload -> Promise { sketchName: String, sketchPath: Path, compileLog: String } Error
 */
export const compile = async (onProgress, cli, payload) => {
  onProgress({
    percentage: 0,
    message: compilationBegun(payload.board.name),
    tab: 'compiler',
  });

  const { sketchName, sketchPath } = await saveSketch(cli, payload.code);

  onProgress({
    percentage: 10,
    message: '',
    tab: 'compiler',
  });

  await copyLibrariesToSketchbook(cli, payload.wsBundledPath, payload.ws);

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

  return {
    sketchName,
    sketchPath,
    compileLog,
  };
};

/**
 * Compiles and uploads sketch through USB.
 *
 * payload object:
 * {
 *  board: {
 *    name: String,
 *    fqbn: String,
 *  },
 *  code: String,
 *  port: {
 *    comName: String,
 *  }
 *  ws: Path,
 *  wsBundledPath: Path,
 * }
 * :: (Object -> _) -> ArduinoCli -> UploadPayload -> Promise { sketchName: String, sketchPath: Path, uploadLog: String } Error
 */
export const uploadThroughUSB = async (onProgress, cli, payload) => {
  const { sketchName, sketchPath, compileLog } = await compile(
    onProgress,
    cli,
    payload
  );

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

  return {
    sketchName,
    sketchPath,
    uploadLog: [compileLog, uploadLog].join('\r\n'),
  };
};

/**
 * Checks arduino packages for updates.
 *
 * :: ArduinoCli -> Promise String Error
 */
export const checkUpdates = cli =>
  R.composeP(R.reject(arch => arch.Installed === arch.Latest), cli.core.list)();

/**
 * Updates arduino packages.
 *
 * :: (Object -> _) -> ArduinoCli -> Promise String Error
 */
export const upgradeArduinoPackages = (onProgress, cli) =>
  cli.core.upgrade(onProgress);
