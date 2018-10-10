import * as R from 'ramda';
import { tmpdir } from 'os';
import { resolve } from 'path';
import * as fse from 'fs-extra';
import YAML from 'yamljs';

const getDefaultConfig = configDir => ({
  sketchbook_path: resolve(configDir, 'sketchbook'),
  arduino_data: resolve(configDir, 'data'),
});

export const configure = inputConfig => {
  const configDir = fse.mkdtempSync(resolve(tmpdir(), 'arduino-cli'));
  const configPath = resolve(configDir, '.cli-config.yml');
  const config = inputConfig || getDefaultConfig(configDir);
  const yamlString = YAML.stringify(config, 2);

  // Write config
  fse.writeFileSync(configPath, yamlString);

  // Ensure that sketchbook and data directories are exist
  fse.ensureDirSync(config.sketchbook_path);
  fse.ensureDirSync(config.arduino_data);

  return {
    config,
    path: configPath,
  };
};

// :: Path -> [URL] -> Promise [URL] Error
export const addPackageIndexUrls = (configPath, urls) =>
  fse
    .readFile(configPath, { encoding: 'utf8' })
    .then(YAML.parse)
    .then(
      R.over(
        R.lensPath(['board_manager', 'additional_urls']),
        R.pipe(
          R.defaultTo([]),
          R.concat(R.__, urls),
          R.reject(R.isEmpty),
          R.uniq
        )
      )
    )
    .then(cfg => YAML.stringify(cfg, 10, 2))
    .then(data => fse.writeFile(configPath, data))
    .then(R.always(urls));

// :: Path -> URL -> Promise URL Error
export const addPackageIndexUrl = (configPath, url) =>
  addPackageIndexUrls(configPath, [url]).then(R.always(url));
