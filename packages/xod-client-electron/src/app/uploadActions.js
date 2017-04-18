import R from 'ramda';
import fs from 'fs';
import { writeFile, isDirectoryExists, isFileExists } from 'xod-fs';
import { foldEither } from 'xod-func-tools';
import { transpileForArduino } from 'xod-arduino';
import * as xab from 'xod-arduino-builder';

// TODO: Replace types with constants (after removing webpack from this package)
// TODO: Move messages to somewhere

const throwError = R.curry((defaultObject, err) => Promise.reject(
  R.merge(defaultObject, { code: 1, message: err.message })
));

export const checkArduinoIde = ({ ide, packages }, success) => {
  const ideExists = isFileExists(ide);
  const pkgExists = isDirectoryExists(packages);
  const result = {
    code: (ideExists && pkgExists) ? 0 : 1,
    type: 'IDE',
    message: 'Arduino IDE has been found. Checking for toolchain...',
    percentage: 5,
  };

  if (!ideExists) { result.message = 'Arduino IDE not found.'; }
  if (ideExists && !pkgExists) { result.message = 'Package folder not found.'; }

  return xab.setArduinoIdePathPackages(packages)
    .then(() => xab.setArduinoIdePathExecutable(ide))
    .then(() => success(result))
    .catch(throwError(result));
};

const getPAV = pab => R.composeP(
  R.last,
  R.prop(`${pab.package}:${pab.architecture}`),
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
    message: 'Port with connected Arduino was found. Preparing toolchain...',
    percentage: 5,
  };

  return xab.listPorts()
    .then(ports => R.compose(
      R.ifElse(
        R.isNil,
        () => Promise.reject(new Error('Could not find Arduino device on opened ports.')),
        port => Promise.resolve(port)
      ),
      R.propOr(null, 'comName'),
      R.find(
        R.propEq('vendorId', '0x2341') // TODO: Replace it with normal find function
      )
    )(ports))
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
      err => Promise.reject(new Error(err)),
      code => Promise.resolve(code)
    ))
    .then((code) => { success(result); return code; })
    .catch(throwError(result));
};

export const uploadToArduino = (pab, port, code, success) => {
  // TODO: Replace path to temp directory (with workspace?)
  const tmpPath = `${__dirname}/uploadCode.cpp`;
  const result = {
    code: 0,
    type: 'UPLOAD',
    message: 'Code has been successfully uploaded.',
    percentage: 55,
  };
  const clearTmp = () => fs.unlinkSync(tmpPath);

  return writeFile(tmpPath, code)
    .then(({ path }) => xab.upload(pab, port, path))
    .then((response) => { result.message = response; })
    .catch((errorMessage) => {
      clearTmp();
      return Promise.reject(new Error(`Can't build or upload project to Arduino.\n${errorMessage}`));
    })
    .then(() => success(result))
    .then(() => clearTmp())
    .catch(throwError(result));
};

export default {
  checkArduinoIde,
  installPav,
  uploadToArduino,
};
