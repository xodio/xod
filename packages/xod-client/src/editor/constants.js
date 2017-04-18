// TODO: split into multiple files?

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
  TEXTAREA: 'textarea',
};

export const LAYER = {
  BACKGROUND: 'background',
  LINKS: 'links',
  NODES: 'nodes',
  GHOSTS: 'ghosts',
};

export const SELECTION_ENTITY_TYPE = {
  NODE: 'Node',
  LINK: 'Link',
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
