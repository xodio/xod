import * as R from 'ramda';
import { HOTKEY, ELECTRON_ACCELERATOR, COMMAND } from './constants';
import { isMacOS } from './browser';

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
  openTutorialProject: {
    label: 'Open Tutorial Project',
  },
  save: {
    label: 'Save',
    command: COMMAND.SAVE,
  },
  saveAs: {
    label: 'Save As...',
    command: COMMAND.SAVE_AS,
  },
  saveCopyAs: {
    label: 'Save Copy As...',
    command: COMMAND.SAVE_COPY_AS,
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
  splitLinksToBuses: {
    label: 'Convert Selected Links to Buses',
    command: COMMAND.MAKE_BUS,
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
  updatePackages: {
    label: 'Upgrade Arduino Packages && Toolchains...',
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
  toggleProjectBrowser: {
    label: 'Toggle Project Browser',
  },
  toggleInspector: {
    label: 'Toggle Inspector',
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

const containsCmd = R.contains('command');

// :: String -> String
const unfoldCmdOrCtrl = R.ifElse(
  () => isMacOS(),
  R.replace(/CmdOrCtrl/gi, 'command'),
  R.replace(/CmdOrCtrl/gi, 'ctrl')
);

/**
 * Filters OS-specific hotkeys.
 *
 * E.G.,
 * `['ctrl+a', 'command+a']`
 * will become ['ctrl+a'] on Windows / Linux
 * and ['command+a'] on MacOS
 *
 * But in case there are only 'ctrl+a' hotkey defined
 * it will be left untouched on MacOS.
 *
 * :: String|[String] -> [String]
 */
export const filterOsHotkeys = R.compose(
  R.map(unfoldCmdOrCtrl),
  R.ifElse(
    () => isMacOS(),
    R.when(R.any(containsCmd), R.filter(containsCmd)),
    R.reject(containsCmd)
  ),
  R.unless(R.is(Array), R.of)
);

const assignHotkeys = menuItem =>
  R.when(
    R.prop('command'),
    R.merge({
      hotkey: R.compose(filterOsHotkeys, R.propOr([], menuItem.command))(
        HOTKEY
      ),
      accelerator: ELECTRON_ACCELERATOR[menuItem.command],
    }),
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

/** returns hotkeys key map with filtered OS specific key mapping */
export const getOsSpecificHotkeys = () => R.map(filterOsHotkeys, HOTKEY);
