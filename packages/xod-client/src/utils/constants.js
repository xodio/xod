export const COMMAND = {
  SET_MODE_CREATING: 'setModeCreating',
  DELETE_SELECTION: 'deleteSelection',

  DESELECT: 'deselect',

  ADD_PATCH: 'addPatch',
  ADD_FOLDER: 'addFolder',
  RENAME: 'rename',
  DELETE: 'delete',

  UNDO: 'undo',
  REDO: 'redo',
};

// TODO: is it ok that this config is shared between electron and browser versions?
export const HOTKEY = {
  [COMMAND.SET_MODE_CREATING]: 'n',
  [COMMAND.DELETE_SELECTION]: ['del', 'backspace'],

  [COMMAND.DESELECT]: 'escape',

  [COMMAND.UNDO]: 'ctrl+z',
  [COMMAND.REDO]: ['ctrl+y', 'ctrl+shift+z'],

  [COMMAND.ADD_PATCH]: 'ctrl+n',
  [COMMAND.ADD_FOLDER]: 'ctrl+shift+n',
  [COMMAND.RENAME]: 'ctrl+r',
  [COMMAND.DELETE]: ['ctrl+del', 'ctrl+backspace'],
};

export const KEYCODE = {
  UP: 38,
  DOWN: 40,
  DELETE: 46,
  BACKSPACE: 8,
  ESCAPE: 27,
  ENTER: 13,
  DOT: 190,
  COMMA: 188,
  N: 78,
  Z: 90,
  Y: 89,
  R: 82,
};

export const STATUS = {
  STARTED: 'started',
  PROGRESSED: 'progressed',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  DELETED: 'deleted',
};
