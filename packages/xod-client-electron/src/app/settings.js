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
  upload: {
    target: null,
  },
  workspace: '',
  editor: {
    sidebarPaneHeight: null,
  },
};

// =============================================================================
//
// Unpure save / load / setDefaults settings
//
// =============================================================================

// TODO: Add catching broken settings (if user opens settings file and break it)
//       On catch — show error to user and fallback to default settings.
export const load = () => R.merge(DEFAULT_SETTINGS, electronSettings.getAll());

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
const upload = R.lensProp('upload');
const uploadTarget = R.compose(upload, R.lensProp('target'));

export const setUploadTarget = R.set(uploadTarget);
export const getUploadTarget = R.view(uploadTarget);

// =============================================================================
//
// Editor settings setters & getters
//
// =============================================================================
const editor = R.lensProp('editor');
const sidebarPaneHeight = R.compose(editor, R.lensProp('sidebarPaneHeight'));

export const setSidebarPaneHeight = R.set(sidebarPaneHeight);
export const getSidebarPaneHeight = R.view(sidebarPaneHeight);

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
