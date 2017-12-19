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
    command: COMMAND.NEW_PROJECT,
  },
  openProject: {
    key: 'openProject',
    label: 'Open Project',
    command: COMMAND.OPEN_PROJECT,
  },
  saveAll: {
    key: 'saveAll',
    label: 'Save All',
    command: COMMAND.SAVE_ALL,
  },
  renameProject: {
    key: 'renameProject',
    label: 'Rename Project',
    command: COMMAND.RENAME_PROJECT,
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
  addLibrary: {
    key: 'addLibrary',
    label: 'Add Library',
  },
  publish: {
    key: 'publish',
    label: 'Publish Library',
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
  cut: {
    key: 'cut',
    label: 'Cut',
    role: 'cut',
    command: COMMAND.CUT,
  },
  copy: {
    key: 'copy',
    label: 'Copy',
    command: COMMAND.COPY,
    role: 'copy',
  },
  paste: {
    key: 'paste',
    label: 'Paste',
    command: COMMAND.PASTE,
    role: 'paste',
  },
  selectall: {
    key: 'selectall',
    label: 'Select All',
    command: COMMAND.SELECT_ALL,
    role: 'selectall',
  },
  projectPreferences: {
    key: 'projectPreferences',
    label: 'Project preferences',
  },
  insertComment: {
    key: 'insertComment',
    label: 'Insert Comment',
  },
  insertNode: {
    key: 'insertNode',
    label: 'Insert Node',
    command: COMMAND.INSERT_NODE,
  },

  deploy: {
    key: 'deploy',
    label: 'Deploy',
  },
  showCodeForArduino: {
    key: 'showCodeForArduino',
    label: 'Show Code For Arduino',
  },
  uploadToArduino: {
    key: 'uploadToArduino',
    label: 'Upload to Arduino',
  },

  view: {
    key: 'view',
    label: 'View',
  },
  toggleHelp: {
    key: 'toggleHelp',
    label: 'Toggle Helpbar',
    command: COMMAND.TOGGLE_HELP,
  },
  toggleDebugger: {
    key: 'toggleDebugger',
    label: 'Toggle Debugger',
    command: COMMAND.TOGGLE_DEBUGGER,
  },
  toggleAccountPane: {
    key: 'toggleAccountPane',
    label: 'Toggle Account Pane',
  },

  help: {
    key: 'help',
    label: 'Help',
  },
  documentation: {
    key: 'documentation',
    label: 'Documentation',
  },
  shortcuts: {
    key: 'shortcuts',
    label: 'Shortcuts',
  },
  forum: {
    key: 'forum',
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

// TODO: also add keys automatically?
export const items = R.map(assignHotkeys, rawItems);

/** add click handler to menu item */
export const onClick = R.flip(R.assoc('click'));

/** add children items to menu item */
export const submenu = R.flip(R.assoc('submenu'));
