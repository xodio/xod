import * as R from 'ramda';
import electronSettings from 'electron-settings';

import { getUserDataDir } from './utils';

// =============================================================================
//
// Default settings object
//
// =============================================================================
export const DEFAULT_SETTINGS = {
  upload: {
    target: null,
  },
  workspace: '',
};

// =============================================================================
//
// Configure settings file
//
// The `electron-settings` pakage creates a `config` variable to store paths and
// file names in it. So separate processes, like main process and renderer
// will have the separate instances of this variable.
// To achieve the same data in all processes, we use utility `getUserDataDir`
// and will set the correct config for `electron-settings` every time we call to
// load or save the settings file.
//
// =============================================================================

/**
 * To make settings path changeble in dependency of env varialbe (E.G. for functional tests)
 * we have to call this function before electron app onReady called.
 * It accepts a path to directory (could contain a homedir alias `~`)
 */
export const rewriteElectronSettingsFilePath = dir => {
  electronSettings.configure({
    dir,
  });
};

export const rewriteElectronSettingsFileName = fileName => {
  electronSettings.configure({
    fileName,
  });
};

const ensureSettingsFileConfiguration = () => {
  // to ensure compatibility with the old default
  rewriteElectronSettingsFileName('Settings');
  rewriteElectronSettingsFilePath(getUserDataDir());
};

// =============================================================================
//
// Unpure save / load / setDefaults settings
//
// =============================================================================

// TODO: Add catching broken settings (if user opens settings file and break it)
//       On catch — show error to user and fallback to default settings.
export const load = () => {
  ensureSettingsFileConfiguration();
  return R.merge(DEFAULT_SETTINGS, electronSettings.getSync());
};

// TODO: Add schema and validating on save to prevent errors
export const save = settings => {
  ensureSettingsFileConfiguration();
  return electronSettings.setSync(settings);
};

export const setDefaults = R.compose(
  R.when(R.isEmpty, () => save(DEFAULT_SETTINGS)),
  load
);

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
const upload = R.lensProp('upload');
const uploadTarget = R.compose(upload, R.lensProp('target'));

export const setUploadTarget = R.set(uploadTarget);
export const getUploadTarget = R.view(uploadTarget);

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
  setUploadTarget,
  getUploadTarget,
};
