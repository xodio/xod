import * as R from 'ramda';
import path from 'path';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import tar from 'tar';
import bz2 from 'unbzip2-stream';
import { tapP } from 'xod-func-tools';

// =============================================================================
//
// Utils
//
// =============================================================================

// :: Path -> Boolean
const isDir = dir => {
  try {
    return fse.statSync(dir).isDirectory();
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
};

// :: Path -> Promise Boolean Error
const isFile = filePath =>
  fse
    .stat(filePath)
    .then(stat => stat.isFile())
    .catch(err => {
      if (err.code === 'ENOENT') return false;
      return Promise.reject(err);
    });

// =============================================================================
//
// Downloading and extracting utils
//
// =============================================================================

// :: URL -> Path -> Promise Path Error
export const downloadFileFromUrl = R.curry((url, destinationPath) =>
  fetch(url)
    .then(tapP(() => fse.ensureDir(path.dirname(destinationPath))))
    .then(res => {
      const file = fse.createWriteStream(destinationPath);
      return new Promise((resolve, reject) => {
        res.body
          .pipe(file)
          .on('error', reject)
          .on('finish', () => {
            file.close(() => resolve(destinationPath));
          });
      });
    })
);

// :: Path -> Promise Path Error
export const extractBzip2 = archivePath =>
  new Promise((resolve, reject) => {
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
export const extractArchive = (archivePath, strip = 0) => {
  const dir = path.dirname(archivePath);

  return tar
    .x({ file: archivePath, cwd: dir, strip })
    .then(() => fse.remove(archivePath))
    .then(() => dir);
};

// InstallResult :: { path: Path, installed: Boolean, downloaded: Boolean }
// :: URL -> Path -> Path -> Number -> Promise InstallResult Error
export const downloadAndExtract = R.curry((url, unpackDest, strip) => {
  const archiveName = path.basename(url);
  const archivePath = path.join(unpackDest, archiveName);

  let downloaded = false;

  return isFile(archivePath)
    .then(
      isExist =>
        !isExist ? downloadFileFromUrl(url, archivePath) : Promise.resolve()
    )
    .then(() => {
      downloaded = true;
    })
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
});

export const installTool = R.curry((toolsDir, toolName, url) => {
  const toolDir = path.resolve(toolsDir, toolName);
  const installed = isDir(toolDir);

  if (installed) {
    return Promise.resolve({
      path: toolsDir,
      downloaded: false,
      installed: true,
    });
  }

  return downloadAndExtract(url, toolsDir, 0);
});
