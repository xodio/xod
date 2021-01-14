import * as R from 'ramda';
import electronSettings from 'electron-settings';

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
// Unpure save / load / setDefaults settings
//
// =============================================================================

// TODO: Add catching broken settings (if user opens settings file and break it)
//       On catch — show error to user and fallback to default settings.
export const load = () => R.merge(DEFAULT_SETTINGS, electronSettings.getSync());

// TODO: Add schema and validating on save to prevent errors
export const save = settings => electronSettings.setSync(settings);

export const setDefaults = R.compose(
  R.when(R.isEmpty, () => save(DEFAULT_SETTINGS)),
  load
);

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
