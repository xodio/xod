import * as R from 'ramda';
import { resolve } from 'path';
import { promisifyChildProcess } from 'promisify-child-process';
import crossSpawn from 'cross-spawn';
import YAML from 'yamljs';
import { remove } from 'fs-extra';

import { saveConfig, configure, setPackageIndexUrls } from './config';
import { patchBoardsWithOptions } from './optionParser';
import listAvailableBoards from './listAvailableBoards';
import parseProgressLog from './parseProgressLog';

const spawn = (bin, args, options) =>
  promisifyChildProcess(crossSpawn(bin, args, options), {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

const noop = () => {};

/**
 * Initializes object to work with `arduino-cli`
 * @param {String} pathToBin Path to `arduino-cli`
 * @param {Object} config Plain-object representation of `.cli-config.yml`
 */
const ArduinoCli = (pathToBin, config = null) => {
  const configureVal = configure(config);
  let configPath = configureVal.path;
  let cfg = configureVal.config;
  const configDir = configureVal.dir;
  let runningProcesses = [];

  const appendProcess = proc => {
    runningProcesses = R.append(proc, runningProcesses);
  };
  const deleteProcess = proc => {
    runningProcesses = R.reject(R.equals(proc), runningProcesses);
  };

  const runWithProgress = async (onProgress, args) => {
    const spawnArgs = R.compose(
      R.concat([`--config-file`, configDir]),
      R.reject(R.isEmpty)
    )(args);
    const proc = spawn(pathToBin, spawnArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    proc.stdout.on('data', data => onProgress(data.toString()));
    proc.stderr.on('data', data => onProgress(data.toString()));
    proc.on('exit', () => deleteProcess(proc));

    appendProcess(proc);

    return proc.then(R.prop('stdout'));
  };

  const sketch = name => resolve(cfg.directories.user, name);

  const runAndParseJson = args => runWithProgress(noop, args).then(JSON.parse);

  const listCores = () =>
    runWithProgress(noop, ['core', 'list', '--format=json'])
      .then(R.when(R.isEmpty, R.always('[]')))
      .then(JSON.parse);

  const listBoardsWith = (listCmd, boardsGetter) =>
    Promise.all([
      listCores(),
      runAndParseJson(['board', listCmd, '--format=json']),
    ]).then(([cores, boards]) =>
      patchBoardsWithOptions(cfg.directories.data, cores, boardsGetter(boards))
    );

  const getConfig = () =>
    runWithProgress(noop, ['config', 'dump']).then(YAML.parse);

  return {
    killProcesses: () => {
      R.forEach(proc => {
        proc.kill('SIGTERM');
        deleteProcess(proc);
      }, runningProcesses);
      return true;
    },
    getRunningProcesses: () => runningProcesses,
    dumpConfig: getConfig,
    updateConfig: newConfig => {
      const newCfg = saveConfig(configPath, newConfig);
      configPath = newCfg.path;
      cfg = newCfg.config;
      return cfg;
    },
    listConnectedBoards: () => listBoardsWith('list', R.prop('serialBoards')),
    listInstalledBoards: () => listBoardsWith('listall', R.prop('boards')),
    listAvailableBoards: () =>
      listAvailableBoards(getConfig, cfg.directories.data),
    compile: (onProgress, fqbn, sketchName, verbose = false) =>
      runWithProgress(onProgress, [
        'compile',
        `--fqbn=${fqbn}`,
        verbose ? '--verbose' : '',
        sketch(sketchName),
      ]),
    upload: (onProgress, port, fqbn, sketchName, verbose = false) =>
      runWithProgress(onProgress, [
        'upload',
        `--fqbn=${fqbn}`,
        `--port=${port}`,
        verbose ? '--verbose' : '',
        '-t',
        sketch(sketchName),
      ]),
    core: {
      download: (onProgress, pkgName) =>
        // TODO:
        // Get rid of `remove` the staging directory when
        // arduino-cli fix issue https://github.com/arduino/arduino-cli/issues/43
        remove(resolve(cfg.directories.data, 'staging')).then(() =>
          runWithProgress(parseProgressLog(onProgress), [
            'core',
            'download',
            pkgName,
          ])
        ),
      install: (onProgress, pkgName) =>
        // TODO:
        // Get rid of `remove` the staging directory when
        // arduino-cli fix issue https://github.com/arduino/arduino-cli/issues/43
        remove(resolve(cfg.directories.data, 'staging')).then(() =>
          runWithProgress(parseProgressLog(onProgress), [
            'core',
            'install',
            pkgName,
          ])
        ),
      list: listCores,
      search: query =>
        runWithProgress(noop, ['core', 'search', query, '--format=json'])
          .then(R.prop('Platforms'))
          .then(R.defaultTo([])),
      uninstall: pkgName =>
        runWithProgress(noop, ['core', 'uninstall', pkgName]),
      updateIndex: () => runWithProgress(noop, ['core', 'update-index']),
      upgrade: onProgress =>
        runWithProgress(parseProgressLog(onProgress), ['core', 'upgrade']),
    },
    version: () =>
      runAndParseJson(['version', '--format=json']).then(
        R.prop('VersionString')
      ),
    createSketch: sketchName =>
      runWithProgress(noop, ['sketch', 'new', sketch(sketchName)]).then(
        R.always(resolve(cfg.directories.user, sketchName, `${sketchName}.ino`))
      ),
    setPackageIndexUrls: urls => setPackageIndexUrls(configPath, urls),
  };
};

export default ArduinoCli;
