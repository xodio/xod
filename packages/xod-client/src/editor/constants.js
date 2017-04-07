// TODO: split into multiple files?
// TODO: get rid of stuff duplicated in xod-project

export const PROPERTY_TYPE = {
  BOOL: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
  PULSE: 'pulse',
};

export const EDITOR_MODE = {
  CREATING_NODE: 'creatingNode',
  EDITING: 'editing',
  LINKING: 'linking',
  PANNING: 'panning',

  get DEFAULT() {
    return this.EDITING;
  },
};

export const WIDGET_TYPE = {
  BOOL: PROPERTY_TYPE.BOOL,
  NUMBER: PROPERTY_TYPE.NUMBER,
  STRING: PROPERTY_TYPE.STRING,
  PULSE: PROPERTY_TYPE.PULSE,
  IO_LABEL: 'IOLabel',
};

export const PIN_VALIDITY = {
  NONE: null,
  INVALID: 0,
  ALMOST: 1,
  VALID: 2,
};

export const LAYER = {
  BACKGROUND: 'background',
  LINKS: 'links',
  NODES: 'nodes',
  GHOSTS: 'ghosts',
};

export const ENTITY = {
  NODE: 'Node',
  LINK: 'Link',
};

export const NODE_CATEGORY = {
  FUNCTIONAL: 'functional',
  HARDWARE: 'hardware',
  CONFIGURATION: 'configuration',
  WATCH: 'watch',
  IO: 'io',
  PATCHES: 'patch',
};

export const PIN_DIRECTION = {
  INPUT: 'input',
  OUTPUT: 'output',
};

export const PIN_TYPE = {
  PULSE: 'pulse',
  BOOL: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
};

export const PROPERTY_DEFAULT_VALUE = {
  BOOL: false,
  NUMBER: 0,
  STRING: '',
  PULSE: false,
};

export const SIZE = {
  NODE: {
    minWidth: 80,
    minHeight: 40,
    padding: {
      x: 2,
      y: 25,
    },
  },
  PIN: {
    radius: 5,
    margin: 15,
  },
  NODE_TEXT: {
    margin: {
      x: 15,
      y: 5,
    },
  },
  LINK_HOTSPOT: {
    width: 8,
  },
};

export const NODETYPE_ERRORS = {
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
