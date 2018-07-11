import https from 'https';
import http from 'http';
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
// HTTP/HTTPS agents
//
// =============================================================================
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const httpAgent = new http.Agent({});

// =============================================================================
//
// Promise utils
//
// =============================================================================

// :: Path -> Boolean
const isFileSync = filePath => {
  try {
    return fse.statSync(filePath).isFile();
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
};

// :: Path -> Boolean
const isDirSync = dirPath => {
  try {
    return fse.statSync(dirPath).isDirectory();
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
};

// =============================================================================
//
// Downloading and extracting utils
//
// =============================================================================

// :: URL -> Path -> Promise Path Error
export const downloadFileFromUrl = R.curry((url, destinationPath) => {
  const agent = R.startsWith('https', url) ? httpsAgent : httpAgent;

  return fetch(url, { agent })
    .then(tapP(() => fse.ensureDir(path.dirname(destinationPath))))
    .then(res => {
      const partPath = `${destinationPath}.part`;
      const file = fse.createWriteStream(partPath);
      return new Promise((resolve, reject) => {
        res.body
          .pipe(file)
          .on('error', reject)
          .on('finish', () => {
            file.close(() => resolve(partPath));
          });
      });
    })
    .then(partPath => fse.rename(partPath, destinationPath))
    .then(R.always(destinationPath));
});

// :: Path -> Promise Path Error
export const extractBzip2IfNecessary = archivePath =>
  new Promise((resolve, reject) => {
    if (path.extname(archivePath) !== '.bz2') {
      resolve(archivePath);
      return;
    }

    const resultPath = archivePath.substr(
      0,
      archivePath.length - '.bz2'.length
    );
    const source = fse.createReadStream(archivePath);
    const target = fse.createWriteStream(resultPath);

    source.on('error', reject);

    target
      .on('error', reject)
      .on('finish', () =>
        fse.remove(archivePath).then(() => resolve(resultPath))
      );

    source.pipe(bz2()).pipe(target);
  });

/**
 * Unpacks tar[.gz] into the same directory.
 * Use `strip` argument to cut specified number of leading path elements in the archive.
 * Details: https://github.com/npm/node-tar#tarxoptions-filelist-callback-alias-tarextract
 */
// :: Path -> Number -> Promise Path Error
export const extractArchive = (archivePath, strip = 0) =>
  extractBzip2IfNecessary(archivePath).then(tarPath =>
    tar
      .x({ file: tarPath, cwd: path.dirname(tarPath), strip })
      .then(() => fse.remove(tarPath))
  );

// InstallResult :: { path: Path, installed: Boolean, downloaded: Boolean }
// :: URL -> Path -> Path -> Number -> Promise InstallResult Error
export const downloadAndExtract = R.curry((url, unpackDest, strip) => {
  const archiveName = path.basename(url);
  const archivePath = path.join(unpackDest, archiveName);

  return downloadFileFromUrl(url, archivePath)
    .then(() => extractArchive(archivePath, strip))
    .then(() => ({
      path: unpackDest,
      installed: true,
      downloaded: true,
    }));
});

// =============================================================================
//
// Check for existence of installed architectures and tools
//
// =============================================================================

// :: FQBN -> PackagesDirPath -> Boolean
export const doesHardwareExist = R.compose(
  isDirSync,
  Utils.getArchitectureDirectory
);

// :: Tool -> ToolsDirPath -> Boolean
export const doesToolExist = R.curry((toolsDir, tool) =>
  R.compose(isDirSync, Utils.getToolVersionDirectory)(
    tool.name,
    tool.version,
    toolsDir
  )
);

// :: [Tool] -> ToolsDirPath -> Boolean
export const doAllToolsExist = R.curry((toolsDir, tools) =>
  R.all(doesToolExist(toolsDir), tools)
);

// TODO: unused?!
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

// Because we delete archive after extracting it,
// its presence means the last time installation process
// went wrong and we need to start over
const doesStaleArchiveExist = (archiveUrl, unpackDest) => {
  const archiveName = path.basename(archiveUrl);
  const archivePath = path.join(unpackDest, archiveName);

  return isFileSync(archivePath);
};

// =============================================================================
//
// Install hardware and tools
//
// =============================================================================

// :: FQBN -> PackagesDirPath -> PackageIndex -> Promise InstallResult Error
export const installHardware = R.curry((fqbn, packagesDir, packageIndex) => {
  const architectureDir = Utils.getArchitectureDirectory(fqbn, packagesDir);
  const architecture = Utils.getArchitectureByFqbn(fqbn, packageIndex);
  const archiveUrl = R.prop('url', architecture);

  if (
    doesHardwareExist(fqbn, packagesDir) &&
    !doesStaleArchiveExist(archiveUrl, architectureDir)
  ) {
    return Promise.resolve({
      path: architectureDir,
      downloaded: false,
      installed: true,
    });
  }

  return downloadAndExtract(archiveUrl, architectureDir, 1);
});

// :: FQBN -> PackagesDirPath -> PackageIndex -> Promise InstallResult Error
export const installTools = R.curry((fqbn, packagesDir, packageIndex) => {
  const tools = Utils.getToolsByFqbn(fqbn, packageIndex);
  const toolsDir = Utils.getToolsDirectory(fqbn, packagesDir);
  const archiveUrl = Utils.getToolsUrl(fqbn, packageIndex);

  if (
    doAllToolsExist(toolsDir, tools) &&
    !doesStaleArchiveExist(archiveUrl, toolsDir)
  ) {
    return Promise.resolve({
      path: toolsDir,
      downloaded: false,
      installed: true,
    });
  }

  return downloadAndExtract(archiveUrl, toolsDir, 0);
});

// :: Path -> Path -> URL -> Promise InstallResult Error
export const installTool = R.curry((toolsDir, toolName, archiveUrl) => {
  const installedToolDir = path.resolve(toolsDir, toolName);

  if (
    isDirSync(installedToolDir) &&
    !doesStaleArchiveExist(archiveUrl, toolsDir)
  ) {
    return Promise.resolve({
      path: toolsDir,
      downloaded: false,
      installed: true,
    });
  }

  return downloadAndExtract(archiveUrl, toolsDir, 0);
});

// :: FQBN -> PackagesDirPath -> PackageIndex ->
//    Promise { hardware: InstallResult, tools: InstallResult } Error
export const installArchitecture = R.curry((fqbn, packagesDir, packageIndex) =>
  Promise.all([
    installHardware(fqbn, packagesDir, packageIndex),
    installTools(fqbn, packagesDir, packageIndex),
  ]).then(([hardware, tools]) => ({ hardware, tools }))
);
