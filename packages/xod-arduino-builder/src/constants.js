
// =============================================================================
//
// Config
//
// =============================================================================

export const IDE_EXECUTABLE_PATH = 'arduino_ide_executable';
export const PACKAGES_PATH = 'arduino_ide_packages';

/** Default config
 * @constant
 * @type Config */
export const DEFAULT_CONFIG = {
  [IDE_EXECUTABLE_PATH]: '',
  [PACKAGES_PATH]: '',
};

// =============================================================================
//
// Others
//
// =============================================================================

/** A url of the [official Arduino package index]{@link http://downloads.arduino.cc/packages/package_index.json}.
 * @constant
 * @type URL */
export const ARDUINO_PACKAGE_INDEX_URL = 'http://downloads.arduino.cc/packages/package_index.json';
