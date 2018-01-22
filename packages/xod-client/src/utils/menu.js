import * as R from 'ramda';
import { HOTKEY, ELECTRON_ACCELERATOR, COMMAND } from './constants';

const rawItems = {
  file: {
    label: 'File',
  },
  newProject: {
    label: 'New Project...',
    command: COMMAND.NEW_PROJECT,
  },
  openProject: {
    label: 'Open Project...',
    command: COMMAND.OPEN_PROJECT,
  },
  saveAll: {
    label: 'Save All',
    command: COMMAND.SAVE_ALL,
  },
  renameProject: {
    label: 'Rename Project...',
    command: COMMAND.RENAME_PROJECT,
  },
  switchWorkspace: {
    label: 'Switch Workspace...',
  },
  importProject: {
    label: 'Import Project...',
  },
  exportProject: {
    label: 'Export Project...',
  },
  newPatch: {
    label: 'New Patch...',
    command: COMMAND.ADD_PATCH,
  },
  addLibrary: {
    label: 'Add Library...',
  },
  publish: {
    label: 'Publish Library...',
  },
  exit: {
    label: 'Exit',
  },

  edit: {
    label: 'Edit',
  },
  undo: {
    label: 'Undo',
    command: COMMAND.UNDO,
  },
  redo: {
    label: 'Redo',
    command: COMMAND.REDO,
  },
  cut: {
    label: 'Cut',
    role: 'cut',
    command: COMMAND.CUT,
  },
  copy: {
    label: 'Copy',
    command: COMMAND.COPY,
    role: 'copy',
  },
  paste: {
    label: 'Paste',
    command: COMMAND.PASTE,
    role: 'paste',
  },
  selectall: {
    label: 'Select All',
    command: COMMAND.SELECT_ALL,
    role: 'selectall',
  },
  projectPreferences: {
    label: 'Project Preferences',
  },
  insertComment: {
    label: 'Insert Comment',
  },
  insertNode: {
    label: 'Insert Node...',
    command: COMMAND.INSERT_NODE,
  },

  deploy: {
    label: 'Deploy',
  },
  showCodeForArduino: {
    label: 'Show Code for Arduino',
  },
  uploadToArduino: {
    label: 'Upload to Arduino...',
  },

  view: {
    label: 'View',
  },
  toggleHelp: {
    label: 'Toggle Helpbar',
    command: COMMAND.TOGGLE_HELP,
  },
  toggleDebugger: {
    label: 'Toggle Deployment Pane',
    command: COMMAND.TOGGLE_DEBUGGER,
  },
  toggleAccountPane: {
    label: 'Toggle Account Pane',
  },
  panToOrigin: {
    label: 'Pan to Origin',
    command: COMMAND.PAN_TO_ORIGIN,
  },
  panToCenter: {
    label: 'Pan to Center',
    command: COMMAND.PAN_TO_CENTER,
  },

  help: {
    label: 'Help',
  },
  documentation: {
    label: 'Documentation',
  },
  shortcuts: {
    label: 'Shortcuts',
  },
  forum: {
    label: 'Forum',
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

export const items = R.compose(
  // separator item is secial and sould not have `key` or hotkey-related props
  R.assoc('separator', { type: 'separator' }),
  R.map(assignHotkeys),
  R.mapObjIndexed((menuItem, key) => R.assoc('key', key, menuItem))
)(rawItems);

/** add click handler to menu item */
export const onClick = R.flip(R.assoc('click'));

/** add children items to menu item */
export const submenu = R.flip(R.assoc('submenu'));
