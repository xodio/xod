import * as EVENTS from './events';

export const CODE_TRANSPILED = 'Project was successfully transpiled. Searching for device...';
export const PORT_FOUND = 'Port with connected Arduino was found. Checking for installed Arduino IDE...';
export const IDE_FOUND = 'Arduino IDE has been found. Preparing toolchain for you device. This could take up to few minutes.';
export const TOOLCHAIN_INSTALLED = 'Toolchain is installed. Uploading...';

export const ARDUINO_PATH_CHANGED = 'Path to Arduino IDE executable was changed.';

export const SUCCESS = {
  [EVENTS.SAVE_PROJECT]: 'Project was successfully saved',
};
