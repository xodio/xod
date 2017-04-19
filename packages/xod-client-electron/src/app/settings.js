import R from 'ramda';
import settings from 'electron-settings';

// =============================================================================
//
// Default settings object
//
// =============================================================================
export const DEFAULT_SETTINGS = {
  arduino: {
    paths: { ide: '', packages: '' },
  },
};

// =============================================================================
//
// General purpose functions
//
// =============================================================================

// Curried settings.set
const set = R.curry((keyPath, value) => settings.set(keyPath, value));

// Sets default settings
export const setDefaults = () => R.when(
  R.isEmpty,
  () => settings.setAll(DEFAULT_SETTINGS)
)(settings.getAll());

// =============================================================================
//
// Arduino setters & getters
//
// =============================================================================
const arduinoIde = 'arduino.paths.ide';
const arduinoPackages = 'arduino.paths.packages';

export const setArduinoIDE = set(arduinoIde);
export const setArduinoPackages = set(arduinoPackages);
export const getArduinoIDE = () => settings.get(arduinoIde);
export const getArduinoPackages = () => settings.get(arduinoPackages);


// =============================================================================
//
// Export default
//
// =============================================================================
export default {
  setDefaults,
  setArduinoIDE,
  getArduinoIDE,
  setArduinoPackages,
  getArduinoPackages,
};
