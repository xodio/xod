import * as ERROR_CODES from './errorCodes';

export const CODE_TRANSPILED = 'Project was successfully transpiled. Searching for device...';
export const PORT_FOUND = 'Port with connected Arduino was found. Checking for installed Arduino IDE...';
export const IDE_FOUND = 'Arduino IDE has been found. Preparing toolchain for you device. This could take up to few minutes.';
export const TOOLCHAIN_INSTALLED = 'Toolchain is installed. Uploading...';

export const ARDUINO_PATH_CHANGED = 'Path to Arduino IDE executable was changed.';

export const ERRORS = {
  [ERROR_CODES.PORT_NOT_FOUND]: 'Could not find Arduino device on opened ports',
  [ERROR_CODES.IDE_NOT_FOUND]: 'Arduino IDE is not found',
  [ERROR_CODES.INDEX_LIST_ERROR]: 'Could not get list of packages from Arduino.cc',
  [ERROR_CODES.INSTALL_PAV_ERROR]: 'Could not install PAV',
  [ERROR_CODES.NO_INSTALLED_PAVS]: 'Could not install or find installed PAV for this device',
};
