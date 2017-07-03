// =============================================================================
//
// Paths and file names
//
// =============================================================================

export const DEFAULT_ARDUINO_IDE_PATH = {
  darwin: ['/Applications/Arduino.app/Contents/MacOS/Arduino'],
  win32: [
    'C:\\Program Files\\Arduino\\arduino.exe',
    'C:\\Program Files (x86)\\Arduino\\arduino.exe',
  ],
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
