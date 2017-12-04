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

  get DEFAULT() {
    return this.SELECTING;
  },
};

export const WIDGET_TYPE = {
  BOOLEAN: PIN_TYPE.BOOLEAN,
  NUMBER: PIN_TYPE.NUMBER,
  STRING: PIN_TYPE.STRING,
  PULSE: PIN_TYPE.PULSE,
  DEAD: PIN_TYPE.DEAD,
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
  ONE_LINK_FOR_INPUT_PIN: 'ONE_LINK_FOR_INPUT_PIN',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INCOMPATIBLE_TYPES: 'INCOMPATIBLE_TYPES',
};

export const PROPERTY_ERRORS = {
  PIN_HAS_LINK: 'PIN_HAS_LINK',
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
