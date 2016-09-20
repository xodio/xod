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
  PULSE: 'pulse',
};

export const PROPERTY_KIND = {
  PIN: 'pin',
  PROP: 'property',
};

export const PROPERTY_KIND_PLURAL = {
  PIN: 'pins',
  PROP: 'properties',
};

export const PROPERTY_MODE = {
  PIN: 'pin',
  PROP: 'property',
};

export const PROPERTY_TYPE_PARSE = {
  [PROPERTY_TYPE.BOOL]: (v) => !!v,
  [PROPERTY_TYPE.NUMBER]: (v, add) => {
    const lastChar = (add && v[v.length - 1] === '.') ? '.' : null;
    const newValue = parseFloat(v) + lastChar;
    return isNaN(newValue) ? '' : newValue;
  },
  [PROPERTY_TYPE.STRING]: (v) => String(v),
  [PROPERTY_TYPE.PULSE]: (v) => String(v),
};

export const PROPERTY_DEFAULT_VALUE = {
  BOOL: false,
  NUMBER: 0,
  STRING: '',
  PULSE: '',
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
  PROP_CANT_HAVE_LINKS: 'PROP_CANT_HAVE_LINKS', 
};

export const PROPERTY_ERRORS = {
  PIN_HAS_LINK: 'PIN_HAS_LINK',
};
