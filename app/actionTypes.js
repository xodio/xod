export const NODE_MOVE = 'NODE_MOVE';
export const NODE_ADD = 'NODE_ADD';
export const NODE_DELETE = 'NODE_DELETE';
export const NODE_UPDATE_PROPERTY = 'NODE_UPDATE_PROPERTY';

export const LINK_ADD = 'LINK_ADD';
export const LINK_DELETE = 'LINK_DELETE';

export const META_UPDATE = 'META_UPDATE';
export const VIEWSTATE_UPDATE = 'VIEWSTATE_UPDATE';

export const PIN_CLICK = 'PIN_CLICK';

export const EDITOR_DESELECT_ALL = 'EDITOR_DESELECT_ALL';
export const EDITOR_SELECT_NODE = 'EDITOR_SELECT_NODE';
export const EDITOR_SELECT_PIN = 'EDITOR_SELECT_PIN';
export const EDITOR_SELECT_LINK = 'EDITOR_SELECT_LINK';

export const EDITOR_SET_MODE = 'EDITOR_SET_MODE';

export const EDITOR_SET_SELECTED_NODETYPE = 'EDITOR_SET_SELECTED_NODETYPE';

export const EDITOR_SWITCH_PATCH = 'EDITOR_SWITCH_PATCH';

export const PROJECT_LOAD_DATA = 'PROJECT_LOAD_DATA';

export const ERROR_ADD = 'ERROR_ADD';
export const ERROR_DELETE = 'ERROR_DELETE';

export const UPLOAD = 'UPLOAD';

export const getPatchUndoType = (id) => `@@redux-undo/PATCH_${id}_UNDO`;
export const getPatchRedoType = (id) => `@@redux-undo/PATCH_${id}_REDO`;
export const getPatchClearHistoryType = (id) => `@@redux-undo/PATCH_${id}_CLEAR_HISTORY`;
