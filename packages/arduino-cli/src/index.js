import os from 'os';
import * as R from 'ramda';
import { resolve } from 'path';
import { exec, spawn } from 'child-process-promise';
import YAML from 'yamljs';
import { remove } from 'fs-extra';

import {
  saveConfig,
  configure,
  addPackageIndexUrl,
  addPackageIndexUrls,
} from './config';
import { patchBoardsWithOptions } from './optionParser';
import listAvailableBoards from './listAvailableBoards';
import parseProgressLog from './parseProgressLog';

const IS_WIN = os.platform() === 'win32';
const escapeSpacesNonWin = R.unless(() => IS_WIN, R.replace(/\s/g, '\\ '));

/**
 * Initializes object to work with `arduino-cli`
 * @param {String} pathToBin Path to `arduino-cli`
 * @param {Object} config Plain-object representation of `.cli-config.yml`
 */
const ArduinoCli = (pathToBin, config = null) => {
  let { path: configPath, config: cfg } = configure(config);

  const escapedConfigPath = escapeSpacesNonWin(configPath);
  const run = args =>
    exec(`"${pathToBin}" --config-file=${escapedConfigPath} ${args}`).then(
      R.prop('stdout')
    );
  const runWithProgress = async (onProgress, args) => {
    const spawnArgs = R.compose(
      R.concat([`--config-file=${escapedConfigPath}`]),
      R.reject(R.isEmpty),
      R.split(' ')
    )(args);

    const promise = spawn(escapeSpacesNonWin(pathToBin), spawnArgs, {
      stdin: 'inherit',
      shell: true,
    });
    const proc = promise.childProcess;

    proc.stdout.on('data', data => onProgress(data.toString()));
    proc.stderr.on('data', data => onProgress(data.toString()));

    return promise.then(R.prop('stdout'));
  };

  const sketch = name => resolve(cfg.sketchbook_path, name);

  const runAndParseJson = args => run(args).then(JSON.parse);

  const listCores = () =>
    run('core list --format json')
      .then(R.when(R.isEmpty, R.always('{}')))
      .then(JSON.parse)
      .then(R.propOr([], 'Platforms'))
      .then(R.map(R.over(R.lensProp('ID'), R.replace(/(@.+)$/, ''))));

  const listBoardsWith = (listCmd, boardsGetter) =>
    Promise.all([
      listCores(),
      runAndParseJson(`board ${listCmd} --format json`),
    ]).then(([cores, boards]) =>
      patchBoardsWithOptions(cfg.arduino_data, cores, boardsGetter(boards))
    );

  const getConfig = () => run('config dump').then(YAML.parse);

  return {
    dumpConfig: getConfig,
    updateConfig: newConfig => {
      const newCfg = saveConfig(configPath, newConfig);
      configPath = newCfg.path;
      cfg = newCfg.config;
      return cfg;
    },
    listConnectedBoards: () => listBoardsWith('list', R.prop('serialBoards')),
    listInstalledBoards: () => listBoardsWith('listall', R.prop('boards')),
    listAvailableBoards: () => listAvailableBoards(cfg.arduino_data),
    compile: (onProgress, fqbn, sketchName, verbose = false) =>
      runWithProgress(
        onProgress,
        `compile --fqbn ${fqbn} ${verbose ? '--verbose' : ''} ${sketch(
          sketchName
        )}`
      ),
    upload: (onProgress, port, fqbn, sketchName, verbose = false) =>
      runWithProgress(
        onProgress,
        `upload --fqbn ${fqbn} --port ${port} ${
          verbose ? '--verbose' : ''
        } -t ${sketch(sketchName)}`
      ),
    core: {
      download: (onProgress, pkgName) =>
        // TODO:
        // Get rid of `remove` the staging directory when
        // arduino-cli fix issue https://github.com/arduino/arduino-cli/issues/43
        remove(resolve(cfg.arduino_data, 'staging')).then(() =>
          runWithProgress(
            parseProgressLog(onProgress),
            `core download ${pkgName}`
          )
        ),
      install: (onProgress, pkgName) =>
        // TODO:
        // Get rid of `remove` the staging directory when
        // arduino-cli fix issue https://github.com/arduino/arduino-cli/issues/43
        remove(resolve(cfg.arduino_data, 'staging')).then(() =>
          runWithProgress(
            parseProgressLog(onProgress),
            `core install ${pkgName}`
          )
        ),
      list: listCores,
      search: query =>
        run(`core search ${query} --format json`)
          .then(R.prop('Platforms'))
          .then(R.defaultTo([])),
      uninstall: pkgName => run(`core uninstall ${pkgName}`),
      updateIndex: () => run('core update-index'),
      upgrade: onProgress =>
        runWithProgress(parseProgressLog(onProgress), 'core upgrade'),
    },
    version: () => runAndParseJson('version').then(R.prop('version')),
    createSketch: sketchName =>
      run(`sketch new ${sketchName}`).then(
        R.always(resolve(cfg.sketchbook_path, sketchName, `${sketchName}.ino`))
      ),
    addPackageIndexUrl: url => addPackageIndexUrl(configPath, url),
    addPackageIndexUrls: urls => addPackageIndexUrls(configPath, urls),
  };
};

export default ArduinoCli;
