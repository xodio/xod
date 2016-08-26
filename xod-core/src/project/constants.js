export const LAYER = {
  BACKGROUND: 'background',
  LINKS: 'links',
  NODES: 'nodes',
  GHOSTS: 'ghosts',
};

export const ENTITY = {
  NODE: 'Node',
  LINK: 'Link',
  PIN: 'Pin',
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
  BOOL: 'bool',
  NUMBER: 'number',
  STRING: 'string',
};

export const PIN_VALIDITY = {
  NONE: null,
  INVALID: 0,
  ALMOST: 1,
  VALID: 2,
};

export const PROPERTY_TYPE = {
  BOOL: 'bool',
  NUMBER: 'number',
  STRING: 'string',
  IO_LABEL: 'io_label',
};

export const PROPERTY_TYPE_PARSE = {
  [PROPERTY_TYPE.BOOL]: (v) => !!v,
  [PROPERTY_TYPE.NUMBER]: (v) => parseFloat(v),
  [PROPERTY_TYPE.STRING]: (v) => String(v),
  [PROPERTY_TYPE.IO_LABEL]: (v) => String(v),
};

export const PROPERTY_DEFAULT_VALUE = {
  BOOL: false,
  NUMBER: 0,
  STRING: '',
  IO_LABEL: '',
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
