import COMMANDS from './commands';

export default {
  [COMMANDS.SET_MODE_CREATING]: 'n',
  [COMMANDS.DELETE_SELECTION]: ['del', 'backspace'],

  [COMMANDS.SET_MODE_DEFAULT]: 'escape',
  [COMMANDS.DESELECT]: 'escape',

  [COMMANDS.UNDO]: 'ctrl+z',
  [COMMANDS.REDO]: ['ctrl+y', 'ctrl+shift+z'],

  [COMMANDS.ADD_PATCH]: 'ctrl+n',
  [COMMANDS.ADD_FOLDER]: 'ctrl+shift+n',
  [COMMANDS.RENAME]: 'ctrl+r',
  [COMMANDS.DELETE]: ['ctrl+del', 'ctrl+backspace'],
};
