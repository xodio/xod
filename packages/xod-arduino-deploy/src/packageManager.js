import * as R from 'ramda';
import path from 'path';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import tar from 'tar';
import bz2 from 'unbzip2-stream';
import { tapP } from 'xod-func-tools';

import * as Utils from './utils';

// =============================================================================
//
// Promise utils
//
// =============================================================================

// :: Path -> Boolean
const isDir = (dir) => {
  try {
    return fse.statSync(dir).isDirectory();
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
};

// :: Path -> Promise Boolean Error
const isFile = filePath => fse.stat(filePath)
  .then(stat => stat.isFile())
  .catch((err) => {
    if (err.code === 'ENOENT') return false;
    return Promise.reject(err);
  });

// =============================================================================
//
// Downloading and extracting utils
//
// =============================================================================

// :: URL -> Path -> Promise Path Error
export const downloadFileFromUrl = R.curry(
  (url, destinationPath) => fetch(url)
    .then(tapP(() => fse.ensureDir(path.dirname(destinationPath))))
    .then((res) => {
      const file = fse.createWriteStream(destinationPath);
      return new Promise((resolve, reject) => {
        res.body.pipe(file)
          .on('error', reject)
          .on('finish', () => {
            file.close(() => resolve(destinationPath));
          });
      });
    })
);

// :: Path -> Promise Path Error
export const extractBzip2 = archivePath => new Promise(
  (resolve, reject) => {
    const resultPath = archivePath.substr(0, archivePath.length - '.bz2'.length);
    const source = fse.createReadStream(archivePath);
    const target = fse.createWriteStream(resultPath);

    source
      .on('error', reject);

    target
      .on('error', reject)
      .on('finish', () => fse.remove(archivePath).then(() => resolve(resultPath)));

    source.pipe(bz2()).pipe(target);
  }
);

/**
 * Unpacks tar[.gz] into the same directory.
 * Use `strip` argument to cut specified number of leading path elements in the archive.
 * Details: https://github.com/npm/node-tar#tarxoptions-filelist-callback-alias-tarextract
 */
// :: Path -> Number -> Promise Path Error
export const extractArchive = (archivePath, strip = 0) => {
  const dir = path.dirname(archivePath);

  return tar.x({ file: archivePath, cwd: dir, strip })
    .then(() => fse.remove(archivePath))
    .then(() => dir);
};

// InstallResult :: { path: Path, installed: Boolean, downloaded: Boolean }
// :: URL -> Path -> Path -> Number -> Promise InstallResult Error
export const downloadAndExtract = R.curry(
  (url, unpackDest, strip) => {
    const archiveName = path.basename(url);
    const archivePath = path.join(unpackDest, archiveName);

    let downloaded = false;

    return isFile(archivePath)
      .then(isExist => (
        !isExist ? downloadFileFromUrl(url, archivePath) : Promise.resolve()
      ))
      .then(() => { downloaded = true; })
      .then(() => {
        // if its bzip — extract bzip first, and then extract as usual
        if (path.extname(archivePath) === '.bz2') {
          return extractBzip2(archivePath);
        }
        return archivePath;
      })
      .then(tarPath => extractArchive(tarPath, strip))
      .then(() => ({
        path: unpackDest,
        downloaded,
        installed: true,
      }));
  }
);

// =============================================================================
//
// Check for existence of installed architectures and tools
//
// =============================================================================

// :: FQBN -> PackagesDirPath -> Boolean
export const doesHardwareExist = R.compose(
  isDir,
  Utils.getArchitectureDirectory
);

// :: Tool -> ToolsDirPath -> Boolean
export const doesToolExist = R.curry(
  (toolsDir, tool) => R.compose(
    isDir,
    Utils.getToolVersionDirectory
  )(tool.name, tool.version, toolsDir)
);

// :: [Tool] -> ToolsDirPath -> Boolean
export const doesAllToolsExist = R.curry(
  (toolsDir, tools) => R.all(doesToolExist(toolsDir), tools)
);

// :: FQBN -> PackageIndex -> Path -> Boolean
export const doesArchitectureInstalled = R.curry(
  (fqbn, packageIndex, packagesDir) => {
    const toolsDir = Utils.getToolsDirectory(fqbn, packagesDir);
    const isHardwareInstalled = doesHardwareExist(fqbn, packagesDir);
    const isToolsInstalled = R.compose(
      R.all(tool => doesToolExist(toolsDir, tool)),
      Utils.getToolsByFqbn
    )(fqbn, packageIndex);

    return R.and(isHardwareInstalled, isToolsInstalled);
  }
);

// =============================================================================
//
// Install hardware and tools
//
// =============================================================================

// :: FQBN -> PackagesDirPath -> PackageIndex -> Promise InstallResult Error
export const installHardware = R.curry(
  (fqbn, packagesDir, packageIndex) => {
    const architectureDir = Utils.getArchitectureDirectory(fqbn, packagesDir);

    if (doesHardwareExist(fqbn, packagesDir)) {
      return Promise.resolve({
        path: architectureDir,
        downloaded: false,
        installed: true,
      });
    }

    const architecture = Utils.getArchitectureByFqbn(fqbn, packageIndex);
    const url = R.prop('url', architecture);

    return downloadAndExtract(url, architectureDir, 1);
  }
);

// :: FQBN -> PackagesDirPath -> PackageIndex -> Promise InstallResult Error
export const installTools = R.curry(
  (fqbn, packagesDir, packageIndex) => {
    const tools = Utils.getToolsByFqbn(fqbn, packageIndex);
    const toolsDir = Utils.getToolsDirectory(fqbn, packagesDir);

    if (doesAllToolsExist(toolsDir, tools)) {
      return Promise.resolve({
        path: toolsDir,
        downloaded: false,
        installed: true,
      });
    }

    const url = Utils.getToolsUrl(fqbn, packageIndex);

    return downloadAndExtract(url, toolsDir, 0);
  }
);

// :: FQBN -> PackagesDirPath -> PackageIndex ->
//    Promise { hardware: InstallResult, tools: InstallResult } Error
export const installArchitecture = R.curry(
  (fqbn, packagesDir, packageIndex) => Promise.all([
    installHardware(fqbn, packagesDir, packageIndex),
    installTools(fqbn, packagesDir, packageIndex),
  ])
    .then(([hardware, tools]) => ({ hardware, tools }))
);
