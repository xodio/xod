import * as R from 'ramda';
import { tmpdir } from 'os';
import { resolve } from 'path';
import * as fse from 'fs-extra';
import YAML from 'yamljs';

export const ADDITIONAL_URLS_PATH = ['board_manager', 'additional_urls'];

const getDefaultConfig = configDir => ({
  directories: {
    user: resolve(configDir, 'sketchbook'),
    data: resolve(configDir, 'data'),
  },
});

const stringifyConfig = cfg => YAML.stringify(cfg, 10, 2);

// :: Path -> Object -> { config: Object, path: Path }
export const saveConfig = (configPath, config) => {
  const yamlString = YAML.stringify(config, 2);

  // Write config
  fse.writeFileSync(configPath, yamlString);

  // Ensure that sketchbook and data directories are exist
  fse.ensureDirSync(config.directories.user);
  fse.ensureDirSync(config.directories.data);

  return {
    config,
    path: configPath,
  };
};

// :: Object -> { config: Object, path: Path }
export const configure = inputConfig => {
  const configDir = fse.mkdtempSync(resolve(tmpdir(), 'arduino-cli'));
  const configPath = resolve(configDir, 'arduino-cli.yaml');
  const config = inputConfig || getDefaultConfig(configDir);
  const saved = saveConfig(configPath, config);
  return { config: saved.config, path: saved.path, dir: configDir };
};

// :: Path -> [URL] -> Promise [URL] Error
export const setPackageIndexUrls = (configPath, urls) =>
  fse
    .readFile(configPath, { encoding: 'utf8' })
    .then(YAML.parse)
    .then(R.assocPath(ADDITIONAL_URLS_PATH, urls))
    .then(stringifyConfig)
    .then(data => fse.writeFile(configPath, data))
    .then(R.always(urls));
