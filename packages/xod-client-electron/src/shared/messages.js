import * as EVENTS from './events';

export const CODE_TRANSPILED =
  'Project was successfully transpiled. Searching for device...';
export const PORT_FOUND =
  'Port with connected Arduino was found. Installing toolchains...';
export const TOOLCHAIN_INSTALLED = 'Toolchain is installed. Uploading...';
export const CLOUD_TOOLCHAIN_INSTALLED =
  'Toolchain is installed. Compiling code in the cloud...';
export const CODE_COMPILED = 'Code compiled succesfully. Uploading...';

export const ENUMERATING_PORTS = 'Enumerating...';
export const ENUMERATING_BOARDS = 'Loading list of supported boards...';
export const NO_PORTS_FOUND = 'No connected boards found';

export const SUCCESS = {
  [EVENTS.SAVE_PROJECT]: 'Project was successfully saved',
};

export const PROJECT_SAVE_PROCESSED = '';
export const PROJECT_SAVE_FAILED = 'Failed to save project.';
export const PROJECT_SAVE_SUCCEED = 'Project has been saved successfully!';

export const DEBUG_SESSION_STOPPED_ON_CHANGE =
  'Debug session was automatically stopped, cause your Project has been changed.';
export const DEBUG_SESSION_STOPPED_ON_TAB_CLOSE =
  'Debug session was automatically stopped, cause you closed Debugger tab.';
export const DEBUG_LOST_CONNECTION = 'Lost connection with the device.';
