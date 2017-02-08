import R from 'ramda';
import { HOTKEY, COMMAND } from './constants';

// TODO: add keys automatically?
export const items = {
  separator: {
    type: 'separator',
  },

  file: {
    key: 'file',
    label: 'File',
  },
  newProject: {
    key: 'newProject',
    label: 'New Project',
  },
  openProject: {
    key: 'openProject',
    label: 'Open Project',
  },
  saveProject: {
    key: 'saveProject',
    label: 'Save Project',
  },
  selectWorkspace: {
    key: 'selectWorkspace',
    label: 'Select Workspace',
  },
  exportProject: {
    key: 'exportProject',
    label: 'Export Project',
  },
  newPatch: {
    key: 'newPatch',
    label: 'New Patch',
    hotkey: HOTKEY[COMMAND.ADD_PATCH],
  },
  savePatch: {
    key: 'savePatch',
    label: 'Save current patch',
  },

  edit: {
    key: 'edit',
    label: 'Edit',
  },
  undo: {
    key: 'undo',
    label: 'Undo',
    hotkey: HOTKEY[COMMAND.UNDO],
  },
  redo: {
    key: 'redo',
    label: 'Redo',
    hotkey: HOTKEY[COMMAND.REDO],
  },

  deploy: {
    key: 'deploy',
    label: 'Deploy',
  },
  showCodeForEspruino: {
    key: 'showCodeForEspruino',
    label: 'Show Code for Espruino',
  },
  uploadToEspruino: {
    key: 'uploadToEspruino',
    label: 'Upload to Espruino',
  },
  showCodeForNodeJS: {
    key: 'showCodeForNodeJS',
    label: 'Show Code for NodeJS',
  },
};

/** add click handler to menu item */
export const onClick = R.flip(R.assoc('click'));

/** add children items to menu item */
export const submenu = R.flip(R.assoc('submenu'));
