import path from 'path';
import { resolvePath } from 'xod-fs';
import R from 'ramda';
import electronSettings from 'electron-settings';

// =============================================================================
//
// Default settings object
//
// =============================================================================
export const DEFAULT_SETTINGS = {
  arduino: {
    paths: { ide: '', packages: '' },
    pavs: [],
  },
  workspace: '',
};

// =============================================================================
//
// Unpure save / load / setDefaults settings
//
// =============================================================================

// TODO: Add catching broken settings (if user opens settings file and break it)
//       On catch — show error to user and fallback to default settings.
export const load = () => electronSettings.getAll();

// TODO: Add schema and validating on save to prevent errors
export const save = settings => electronSettings.setAll(settings);

export const setDefaults = R.compose(
  R.when(R.isEmpty, () => save(DEFAULT_SETTINGS)),
  load
);

/**
 * To make settings path changeble in dependency of env varialbe (E.G. for functional tests)
 * we have to call this function before electron app onReady called.
 * It accepts:
 * - a path to directory (could contain a homedir alias `~`)
 * - filename for settings file (default is `Settings`).
 */
export const rewriteElectronSettingsFilePath = (dirPath, fileName = 'Settings') => {
  const fullPath = path.join(resolvePath(dirPath), fileName);
  electronSettings.setPath(fullPath);
};

// =============================================================================
//
// Workspace setters & getters
//
// =============================================================================
const workspacePath = R.lensProp('workspace');

export const setWorkspacePath = R.set(workspacePath);
export const getWorkspacePath = R.view(workspacePath);

// =============================================================================
//
// Arduino setters & getters
//
// =============================================================================
const arduino = R.lensProp('arduino');
const arduinoIde = R.compose(arduino, R.lensPath(['paths', 'ide']));
const arduinoPackages = R.compose(arduino, R.lensPath(['paths', 'packages']));
const arduinoPAVs = R.compose(arduino, R.lensProp('pavs'));
const arduinoTarget = R.compose(arduino, R.lensProp('target'));

export const setArduinoIDE = R.set(arduinoIde);
export const getArduinoIDE = R.view(arduinoIde);

export const setArduinoPackages = R.set(arduinoPackages);
export const getArduinoPackages = R.view(arduinoPackages);

export const setArduinoTarget = R.set(arduinoTarget);
export const getArduinoTarget = R.view(arduinoTarget);

export const listPAVs = R.view(arduinoPAVs);
export const assocPAVs = R.set(arduinoPAVs);


// =============================================================================
//
// Export default
//
// =============================================================================
export default {
  load,
  save,
  setDefaults,
  // setters & getters
  setArduinoIDE,
  getArduinoIDE,
  setArduinoPackages,
  getArduinoPackages,
  setArduinoTarget,
  getArduinoTarget,
  listPAVs,
  assocPAVs,
};
