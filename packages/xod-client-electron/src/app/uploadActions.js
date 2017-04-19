import R from 'ramda';
import fs from 'fs';
import { resolve } from 'path';
import { writeFile, isDirectoryExists, isFileExists } from 'xod-fs';
import { foldEither, notEmpty } from 'xod-func-tools';
import { transpileForArduino } from 'xod-arduino';
import * as xab from 'xod-arduino-builder';

import { getArduinoIDE, getArduinoPackages } from './settings';
import { getPlatformSpecificPaths } from './utils';
import { DEFAULT_ARDUINO_IDE_PATH, DEFAULT_ARDUINO_PACKAGES_PATH } from './constants';

// TODO: Replace types with constants (after removing webpack from this package)
// TODO: Move messages to somewhere

const throwError = R.curry((defaultObject, err) => Promise.reject(
  R.merge(defaultObject, { code: 1, message: err.message })
));

// :: () -> String[]
const getIDEPaths = () => R.concat(
  R.of(getArduinoIDE()),
  getPlatformSpecificPaths(DEFAULT_ARDUINO_IDE_PATH)
);
// :: () -> String[]
const getPackagesPaths = () => R.concat(
  R.of(getArduinoPackages()),
  getPlatformSpecificPaths(DEFAULT_ARDUINO_PACKAGES_PATH)
);

// :: (a -> Boolean) -> (String[] -> String)
const checkArrayOfStrings = pred => R.reduceWhile(R.complement(pred), (acc, str) => str, null);
// :: String[] -> String
const anyFileThatExist = checkArrayOfStrings(isFileExists);
// :: String[] -> String
const anyDirectoryThatExist = checkArrayOfStrings(isDirectoryExists);
// :: Boolean -> Boolean -> Boolean
const isBothTrue = R.compose(R.equals(true), R.and);
// :: Number -> Boolean -> ... -> Boolean
const isNthArgTrue = argNum => R.compose(R.equals(true), R.nthArg(argNum));

export const checkArduinoIde = (updatePaths, success) => {
  const ide = anyFileThatExist(getIDEPaths());
  const packages = anyDirectoryThatExist(getPackagesPaths());

  const ideExists = R.both(isFileExists, notEmpty)(ide);
  const pkgExists = R.both(isDirectoryExists, notEmpty)(packages);

  const message = R.cond([
    [isBothTrue, R.always('Arduino IDE has been found. Checking for toolchain...')],
    [isNthArgTrue(0), R.always('Arduino IDE not found.')],
    [isNthArgTrue(1), R.always('Package folder not found.')],
    [R.T, R.always('Arduino IDE and Packages folder are not found')],
  ])(ideExists, pkgExists);

  const result = {
    code: isBothTrue(ideExists, pkgExists) ? 0 : 1,
    type: 'IDE',
    message,
    percentage: 5,
  };

  if (!isBothTrue(ideExists, pkgExists)) {
    return Promise.reject(result);
  }

  return xab.setArduinoIdePathPackages(packages)
    .then(() => xab.setArduinoIdePathExecutable(ide))
    .then(() => updatePaths(ide, packages))
    .then(() => success(result))
    .catch(throwError(result));
};

const getPAV = pab => R.composeP(
  R.last,
  R.prop(`${pab.package}:${pab.architecture}`),
  R.prop('data'),
  xab.listPAVs
)();

export const installPav = (pab, success) => {
  const result = {
    code: 0,
    type: 'TOOLCHAIN',
    message: 'Toolchain is installed. Uploading...',
    percentage: 20,
  };

  return getPAV(pab)
    .then(xab.installPAV)
    .then(() => success(result))
    .catch(throwError(result));
};

export const findPort = (pab, success) => {
  const result = {
    code: 0,
    type: 'PORT',
    message: 'Port with connected Arduino was found. Checking for installed Arduino IDE...',
    percentage: 5,
  };

  return xab.listPorts()
    .then(R.compose(
      R.ifElse(
        R.isNil,
        () => Promise.reject(new Error('Could not find Arduino device on opened ports.')),
        port => Promise.resolve(port)
      ),
      R.propOr(null, 'comName'),
      R.find(
        R.propEq('vendorId', '0x2341') // TODO: Replace it with normal find function
      ),
      R.prop('data')
    ))
    .then((port) => { success(result); return port; })
    .catch(throwError(result));
};

export const doTranspileForArduino = ({ pab, project, patchId }, success) => {
  const result = {
    code: 0,
    type: 'TRANSPILING',
    message: 'Code has been transpiled. Prepare to upload...',
    percentage: 15,
  };

  return Promise.resolve(project)
    .then(v2 => transpileForArduino(v2, patchId))
    .then(foldEither(
      err => Promise.reject(err),
      code => Promise.resolve(code)
    ))
    .then((code) => { success(result); return code; })
    .catch(throwError(result));
};

export const uploadToArduino = (pab, port, code, success) => {
  // TODO: Replace tmpPath with normal path.
  //       Somehow app.getPath('temp') is not working.
  //       Arduino IDE returns "readdirent: result is too long".
  const tmpPath = resolve(__dirname, 'upload.tmp.cpp');
  const result = {
    code: 0,
    type: 'UPLOAD',
    message: 'Code has been successfully uploaded.',
    percentage: 55,
  };
  const updateMessageByData = R.compose(
    R.assoc('message', R.__, result),
    R.prop('data')
  );
  const clearTmp = () => fs.unlinkSync(tmpPath);

  return writeFile(tmpPath, code)
    .then(({ path }) => xab.upload(pab, port, path))
    .then(updateMessageByData)
    .catch(R.compose(
      err => Promise.reject(err),
      R.tap(clearTmp),
      updateMessageByData
    ))
    .then(success)
    .then(() => clearTmp())
    .catch(throwError(result));
};

export default {
  checkArduinoIde,
  installPav,
  uploadToArduino,
};
