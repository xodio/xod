import { PIN_TYPE } from 'xod-project';

export const EDITOR_MODE = {
  SELECTING: 'selecting',
  MOVING_SELECTION: 'moving_selection',
  RESIZING_COMMENT: 'resizing_comment',
  LINKING: 'linking',
  PANNING: 'panning',
  ACCEPTING_DRAGGED_PATCH: 'accepting_dragged_patch',
  DEBUGGING: 'debugging',
  MARQUEE_SELECTING: 'marquee_selecting',
  CHANGING_ARITY_LEVEL: 'changing_arity_level',

  get DEFAULT() {
    return this.SELECTING;
  },
};

export const WIDGET_TYPE = {
  BOOLEAN: PIN_TYPE.BOOLEAN,
  NUMBER: PIN_TYPE.NUMBER,
  STRING: PIN_TYPE.STRING,
  PULSE: PIN_TYPE.PULSE,
  BYTE: PIN_TYPE.BYTE,
  PORT: PIN_TYPE.PORT,
  DEAD: PIN_TYPE.DEAD,
  LABEL: 'Label',
  IO_LABEL: 'IOLabel',
  TEXTAREA: 'textarea',
};

export const SELECTION_ENTITY_TYPE = {
  NODE: 'Node',
  COMMENT: 'Comment',
  LINK: 'Link',
};

export const DRAGGED_ENTITY_TYPE = {
  PATCH: 'PATCH',
};

export const NODETYPE_ERROR_TYPES = {
  CANT_DELETE_USED_PIN_OF_PATCHNODE: 'CANT_DELETE_USED_PIN_OF_PATCHNODE',
  CANT_DELETE_USED_PATCHNODE: 'CANT_DELETE_USED_PATCHNODE',
};

export const LINK_ERRORS = {
  SAME_DIRECTION: 'SAME_DIRECTION',
  SAME_NODE: 'SAME_NODE',
  INCOMPATIBLE_TYPES: 'INCOMPATIBLE_TYPES',
};

export const CLIPBOARD_ERRORS = {
  RECURSION_DETECTED: 'RECURSION_DETECTED',
  NO_REQUIRED_PATCHES: 'NO_REQUIRED_PATCHES',
};

export const FOCUS_AREAS = {
  PROJECT_BROWSER: 'PROJECT_BROWSER',
  INSPECTOR: 'INSPECTOR',
  WORKAREA: 'WORKAREA',
  NODE_SUGGESTER: 'NODE_SUGGESTER',
  LIB_SUGGESTER: 'LIB_SUGGESTER',
};

export const CLIPBOARD_DATA_TYPE = 'text/xod-entities';

export const TAB_TYPES = {
  PATCH: 'PATCH',
  DEBUGGER: 'DEBUGGER',
};

export const DEBUGGER_TAB_ID = 'debugger';

export const IMPL_TEMPLATE = `
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    //auto inValue = getValue<input_IN>(ctx);
    //emitValue<output_OUT>(ctx, inValue);
}
`;

export const PANEL_IDS = {
  PROJECT_BROWSER: 'PROJECT_BROWSER',
  INSPECTOR: 'INSPECTOR',
  HELPBAR: 'HELPBAR',
  ACCOUNT: 'ACCOUNT',
};

export const SIDEBAR_IDS = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

export const PANEL_CONTEXT_MENU_ID = 'PANEL_CONTEXT_MENU_ID';

// Event name for pub/sub to update position of Helpbox
// while User:
// - scrolls ProjectBrowser or selects another Patch by click
// - highlights (arrows/mouse over) or scrolls Node Suggester
export const UPDATE_HELPBOX_POSITION = 'UPDATE_HELPBOX_POSITION';
