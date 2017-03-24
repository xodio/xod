import R from 'ramda';
import { HOTKEY, ELECTRON_ACCELERATOR, COMMAND } from './constants';

const rawItems = {
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
  renameProject: {
    key: 'renameProject',
    label: 'Rename Project',
  },
  selectWorkspace: {
    key: 'selectWorkspace',
    label: 'Select Workspace',
  },
  importProject: {
    key: 'importProject',
    label: 'Import Project',
  },
  exportProject: {
    key: 'exportProject',
    label: 'Export Project',
  },
  newPatch: {
    key: 'newPatch',
    label: 'New Patch',
    command: COMMAND.ADD_PATCH,
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
    command: COMMAND.UNDO,
  },
  redo: {
    key: 'redo',
    label: 'Redo',
    command: COMMAND.REDO,
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
  showCodeForArduino: {
    key: 'showCodeForArduino',
    label: 'Show Code For Arduino',
  },
};

const assignHotkeys = menuItem => R.when(
  R.prop('command'),
  R.merge(
    {
      hotkey: HOTKEY[menuItem.command],
      accelerator: ELECTRON_ACCELERATOR[menuItem.command],
    }
  ),
  menuItem
);

// TODO: also add keys automatically?
export const items = R.map(assignHotkeys, rawItems);

/** add click handler to menu item */
export const onClick = R.flip(R.assoc('click'));

/** add children items to menu item */
export const submenu = R.flip(R.assoc('submenu'));
