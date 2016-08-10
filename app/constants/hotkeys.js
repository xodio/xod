import COMMANDS from './commands';

export default {
  [COMMANDS.SET_MODE_CREATING]: 'n',
  [COMMANDS.DELETE_SELECTION]: ['del', 'backspace'],

  [COMMANDS.ESCAPE]: 'escape',

  [COMMANDS.ADD_PATCH]: 'ctrl+n',
  [COMMANDS.ADD_FOLDER]: 'ctrl+shift+n',
  [COMMANDS.PROJECT_BROWSER_RENAME]: 'ctrl+r',
  [COMMANDS.PROJECT_BROWSER_DELETE]: ['ctrl+del', 'ctrl+backspace'],

  [COMMANDS.UNDO]: 'ctrl+z',
  [COMMANDS.REDO]: ['ctrl+y', 'ctrl+shift+z'],
};
