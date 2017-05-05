// =============================================================================
//
// Paths and file names
//
// =============================================================================

export const DEFAULT_ARDUINO_IDE_PATH = {
  darwin: ['/Applications/Arduino.app/Contents/MacOS/Arduino'],
  win32: ['C:\\Program Files\\Arduino\\arduino.exe'],
  win64: ['C:\\Program Files (x86)\\Arduino\\arduino.exe'],
  linux: ['/usr/bin/arduino', '/usr/local/bin/arduino'],
  sunos: ['/usr/bin/arduino', '/usr/local/bin/arduino'],
  freebsd: ['/usr/bin/arduino', '/usr/local/bin/arduino'],
};

export const DEFAULT_ARDUINO_PACKAGES_PATH = {
  darwin: ['~/Library/Arduino15/packages/'],
  win32: ['~/AppData/Local/Arduino15/packages/'],
  win64: ['~/AppData/Local/Arduino15/packages/'],
  linux: ['~/.arduino15/packages/'],
};

export const WORKSPACE_FILENAME = '.xodworkspace';
export const DEFAULT_WORKSPACE_PATH = '~/xod/';

export const PATH_TO_DEFAULT_WORKSPACE = '../workspace';
export const LIBS_FOLDERNAME = 'lib';
export const DEFAULT_PROJECT_NAME = 'welcome-to-xod';

// =============================================================================
//
// Event names
//
// =============================================================================
export const EVENT_REQUEST_SELECT_PROJECT = 'EVENT_REQUEST_SELECT_PROJECT';
export const EVENT_CREATE_PROJECT = 'EVENT_CREATE_PROJECT';
export const EVENT_REQUEST_OPEN_PROJECT = 'EVENT_REQUEST_OPEN_PROJECT';
export const EVENT_OPEN_PROJECT = 'EVENT_OPEN_PROJECT';

export const EVENT_SWITCH_WORKSPACE = 'EVENT_SWITCH_WORKSPACE';
export const EVENT_REQUEST_CREATE_WORKSPACE = 'EVENT_REQUEST_CREATE_WORKSPACE';
export const EVENT_CREATE_WORKSPACE = 'EVENT_CREATE_WORKSPACE';

export const EVENT_WORKSPACE_ERROR = 'EVENT_WORKSPACE_ERROR';
