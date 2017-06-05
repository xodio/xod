
/**
 * Enumeration of possible validation errors
 *
 * @name ERROR
 * @enum {string}
 */
export const ERROR = {
  // project
  TYPE_NOT_FOUND: 'Patch with type "{type}" is not found in the project',
  PINS_NOT_FOUND: 'Specified node types haven\'t required pins for creating links',
  // patches
  PATCH_NOT_FOUND_BY_PATH: 'Can\'t find the patch in the project with specified path: "{patchPath}"',
  PATCH_PATH_OCCUPIED: 'Another patch with the same path already exists',
  PATCH_REBASING_BUILT_IN: 'Can\'t rebase built-in patch',
  CANT_GET_PATCH_BY_NODEID: 'Can\'t find prototype Patch of Node with Id "{nodeId}" from Patch "{patchPath}"',
  // pathes
  PATH_INVALID: 'Path is empty or contains invalid characters',
  // nodes
  NODE_NOT_FOUND: 'Can\'t find the Node "{nodeId}" in the patch with path "{patchPath}"',
  POSITION_INVALID: 'Invalid position property',
  // links
  LINK_ID_INVALID: 'Link should have a generated id',
  LINK_INPUT_INVALID: 'Link should have input object with keys: `pinKey` and `nodeId`',
  LINK_OUTPUT_INVALID: 'Link should have output object with keys: `pinKey` and `nodeId`',
  LINK_INPUT_NODE_NOT_FOUND: 'Input node of the link does not exist in this patch',
  LINK_OUTPUT_NODE_NOT_FOUND: 'Output node of the link does not exist in this patch',
  // pins
  PIN_TYPE_INVALID: 'Pin type should be one of possible values: `string`, `number`, `boolean`, `pulse`',
  PIN_NOT_FOUND: 'Can\'t find the Pin "{pinKey}" in the patch with path "{patchPath}"',
  PIN_KEY_INVALID: 'Pin key should be generated with shortid',
  // other
  DATATYPE_INVALID: 'Invalid data type',
  IMPLEMENTATION_NOT_FOUND: 'No implementation for {patchPath} found. Searched for: {impl}',
  CAST_PATCH_NOT_FOUND: 'Casting patch "{patchPath}" is not found in the project',
};

export const IDENTIFIER_RULES =
  `Only a-z, 0-9 and - are allowed.
  Name must not begin or end with a hypen,
  or contain more than one hypen in a row`;

/**
 * Enumeration of possible pin types
 *
 * @name PIN_TYPE
 * @enum {string}
 */
export const PIN_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  PULSE: 'pulse',
};

export const DEFAULT_VALUE_OF_TYPE = {
  [PIN_TYPE.STRING]: '',
  [PIN_TYPE.NUMBER]: 0,
  [PIN_TYPE.BOOLEAN]: false,
  [PIN_TYPE.PULSE]: false,
};

/**
 * A lookup table that answers the
 * question 'can a type A be cast to type B?'
 *
 * @example
 *   TYPES_COMPATIBILITY[PIN_TYPE.BOOLEAN][PIN_TYPE.STRING] // true
 *   // boolean can be cast to string
 *
 * @name TYPES_COMPATIBILITY
 */
export const TYPES_COMPATIBILITY = {
  [PIN_TYPE.BOOLEAN]: {
    [PIN_TYPE.BOOLEAN]: true,
    [PIN_TYPE.NUMBER]: true,
    [PIN_TYPE.PULSE]: false,
    [PIN_TYPE.STRING]: true,
  },
  [PIN_TYPE.NUMBER]: {
    [PIN_TYPE.BOOLEAN]: true,
    [PIN_TYPE.NUMBER]: true,
    [PIN_TYPE.PULSE]: false,
    [PIN_TYPE.STRING]: true,
  },
  // nothing can be cast to or from pulse
  [PIN_TYPE.PULSE]: {
    [PIN_TYPE.BOOLEAN]: false,
    [PIN_TYPE.NUMBER]: false,
    [PIN_TYPE.PULSE]: true,
    [PIN_TYPE.STRING]: false,
  },
  // everything(except pulse) can be cast to string, but nothing can be cast from string
  [PIN_TYPE.STRING]: {
    [PIN_TYPE.BOOLEAN]: false,
    [PIN_TYPE.NUMBER]: false,
    [PIN_TYPE.PULSE]: false,
    [PIN_TYPE.STRING]: true,
  },
};

 /**
  * Enumeration of possible pin directions
  *
  * @name PIN_DIRECTION
  * @enum {string}
  */
export const PIN_DIRECTION = {
  INPUT: 'input',
  OUTPUT: 'output',
};

export const OPPOSITE_DIRECTION = {
  [PIN_DIRECTION.INPUT]: PIN_DIRECTION.OUTPUT,
  [PIN_DIRECTION.OUTPUT]: PIN_DIRECTION.INPUT,
};

/**
 * Enumeration of possible pin labels by directions
 *
 * @name PIN_LABEL_BY_DIRECTION
 * @enum {string}
 */
export const PIN_LABEL_BY_DIRECTION = {
  [PIN_DIRECTION.INPUT]: 'IN',
  [PIN_DIRECTION.OUTPUT]: 'OUT',
};

/**
 * 'Magic' pin keys for terminal nodes.
 * See {@link flatten}
 *
 * @name TERMINAL_PIN_KEYS
 * @enum {string}
 */
export const TERMINAL_PIN_KEYS = {
  [PIN_DIRECTION.INPUT]: '__in__',
  [PIN_DIRECTION.OUTPUT]: '__out__',
};

/**
 * Path for a 'magic' patch, whose instance is placed
 * to mark patches that are not implemented in XOD.
 *
 * Such patches usually contain only terminal nodes
 * and provide implementations in target platforms
 * native languages.
 *
 * @name NOT_IMPLEMENTED_IN_XOD_PATH
 * @type {string}
 */
export const NOT_IMPLEMENTED_IN_XOD_PATH = 'xod/patch-nodes/not-implemented-in-xod';
