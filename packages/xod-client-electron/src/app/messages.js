import * as errorCode from './errorCodes';

export const CODE_TRANSPILED = 'Project was successfully transpiled. Searching for device...';
export const PORT_FOUND = 'Port with connected Arduino was found. Checking for installed Arduino IDE...';
export const IDE_FOUND = 'Arduino IDE has been found. Checking for toolchain...';
export const TOOLCHAIN_INSTALLED = 'Toolchain is installed. Uploading...';

export const ARDUINO_PATH_CHANGED = 'Path to Arduino IDE executable was changed.';

export const ERRORS = {
  [errorCode.TRANSPILE_ERROR]: 'Could not transpile Project',
  [errorCode.PORT_NOT_FOUND]: 'Could not find Arduino device on opened ports',
  [errorCode.IDE_NOT_FOUND]: 'Arduino IDE is not found',
  [errorCode.INDEX_LIST_ERROR]: 'Could not get list of packages from Arduino.cc',
  [errorCode.INSTALL_PAV_ERROR]: 'Could not install PAV',
  [errorCode.NO_INSTALLED_PAVS]: 'Could not install or find installed PAV for this device',
};
