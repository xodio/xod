/**
 * Enumeration of possible validation errors
 *
 * @name ERROR
 * @enum {string}
 */
// TODO: Messages that are templates (contains variables)
//       should be moved into messages.js as separate variables.
export const ERROR = {
  // dead ref errors:
  TYPE_NOT_FOUND: 'Patch with type "{type}" is not found in the project',
  PINS_NOT_FOUND:
    "Specified node types haven't required pins for creating links",
  // patches
  PATCH_NOT_FOUND_BY_PATH:
    'Can\'t find the patch in the project with specified path: "{patchPath}"',
  PATCH_PATH_OCCUPIED: 'Another patch with the same path already exists',
  PATCH_REBASING_BUILT_IN: "Can't rebase built-in patch",
  CANT_GET_PATCH_BY_NODEID:
    'Can\'t find prototype Patch of Node with Id "{nodeId}" from Patch "{patchPath}"',
  GENERIC_TERMINALS_REQUIRED: 'At least one generic terminal is required',
  // pathes
  PATH_INVALID: 'Path is empty or contains invalid characters',
  // nodes
  NODE_NOT_FOUND:
    'Can\'t find the Node "{nodeId}" in the patch with path "{patchPath}"',
  POSITION_INVALID: 'Invalid position property',
  // links
  LINK_NOT_FOUND:
    'Can\'t find the Link "{linkId}" in the patch with path "{patchPath}"',
  LINK_ID_INVALID: 'Link should have a generated id',
  LINK_INPUT_INVALID:
    'Link should have input object with keys: `pinKey` and `nodeId`',
  LINK_OUTPUT_INVALID:
    'Link should have output object with keys: `pinKey` and `nodeId`',
  LINK_INPUT_NODE_NOT_FOUND:
    'Input node of the link does not exist in this patch',
  LINK_OUTPUT_NODE_NOT_FOUND:
    'Output node of the link does not exist in this patch',
  // comments
  COMMENT_NOT_FOUND:
    'Can\'t find the Comment "{commentId}" in the patch with path "{patchPath}"',
  // pins
  PIN_TYPE_INVALID:
    'Pin type should be one of possible values: `string`, `number`, `boolean`, `pulse`',
  PIN_NOT_FOUND:
    'Can\'t find the Pin "{pinKey}" in the patch with path "{patchPath}"',
  PIN_KEY_INVALID: 'Pin key should be generated with shortid',
  // other
  LOOPS_DETECTED:
    'The program has a cycle path. Use xod/core/defer-* nodes to break the cycle',
  DATATYPE_INVALID: 'Invalid data type',
  IMPLEMENTATION_NOT_FOUND: 'No implementation for {patchPath} found.',
  CPP_AS_ENTRY_POINT: 'Can’t use patch not implemented in XOD as entry point',
  ABSTRACT_AS_ENTRY_POINT: 'Can’t use abstract patch as entry point',
  ALL_TYPES_MUST_BE_RESOLVED: 'All generic types must be resolved', // TODO: phrasing!
  CAST_PATCH_NOT_FOUND:
    'Casting patch "{patchPath}" is not found in the project',
  CANT_CAST_TYPES_DIRECTLY:
    '{patchPath}: type {fromType} can’t cast to {toType} directly.',
  // .xodball format
  NOT_A_JSON: 'File that you try to load is not in a JSON format',
  INVALID_XODBALL_FORMAT:
    'File that you try to load is corrupted and has a wrong structure',
};

export const ERROR_TITLES = {
  DEAD_REFERENCE: 'Dead reference error',
  BAD_LINKS: 'Program contains bad links',
};

export const IDENTIFIER_RULES = `Only a-z, 0-9 and - are allowed.
  Name must not begin or end with a hypen,
  or contain more than one hypen in a row`;

export const PATCH_BASENAME_RULES = IDENTIFIER_RULES;

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
  DEAD: 'dead',
  // generic types
  T1: 't1',
  T2: 't2',
  T3: 't3',
};

export const DEFAULT_VALUE_OF_TYPE = {
  [PIN_TYPE.STRING]: '',
  [PIN_TYPE.NUMBER]: 0,
  [PIN_TYPE.BOOLEAN]: false,
  [PIN_TYPE.PULSE]: false,
  [PIN_TYPE.DEAD]: 0,
  [PIN_TYPE.T1]: 0,
  [PIN_TYPE.T2]: 0,
  [PIN_TYPE.T3]: 0,
};

export const MAX_ARITY_STEP = 3;

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
    [PIN_TYPE.PULSE]: true,
    [PIN_TYPE.STRING]: true,
    [PIN_TYPE.DEAD]: false,
  },
  [PIN_TYPE.NUMBER]: {
    [PIN_TYPE.BOOLEAN]: true,
    [PIN_TYPE.NUMBER]: true,
    [PIN_TYPE.PULSE]: false,
    [PIN_TYPE.STRING]: true,
    [PIN_TYPE.DEAD]: false,
  },
  // nothing can be cast to or from pulse
  [PIN_TYPE.PULSE]: {
    [PIN_TYPE.BOOLEAN]: false,
    [PIN_TYPE.NUMBER]: false,
    [PIN_TYPE.PULSE]: true,
    [PIN_TYPE.STRING]: false,
    [PIN_TYPE.DEAD]: false,
  },
  // everything(except pulse) can be cast to string, but nothing can be cast from string
  [PIN_TYPE.STRING]: {
    [PIN_TYPE.BOOLEAN]: false,
    [PIN_TYPE.NUMBER]: false,
    [PIN_TYPE.PULSE]: false,
    [PIN_TYPE.STRING]: true,
    [PIN_TYPE.DEAD]: false,
  },
  // everything(except pulse) can be cast to string, but nothing can be cast from string
  [PIN_TYPE.DEAD]: {
    [PIN_TYPE.BOOLEAN]: false,
    [PIN_TYPE.NUMBER]: false,
    [PIN_TYPE.PULSE]: false,
    [PIN_TYPE.STRING]: false,
    [PIN_TYPE.DEAD]: false,
  },
  // for now generic pins can't connect with anything
  [PIN_TYPE.T1]: {},
  [PIN_TYPE.T2]: {},
  [PIN_TYPE.T3]: {},
};

export const INPUT_PULSE_PIN_BINDING_OPTIONS = {
  NEVER: 'NEVER',
  CONTINUOUSLY: 'CONTINUOUSLY',
  ON_BOOT: 'ON_BOOT',
};

// node types that provide a constant value
export const CONST_NODETYPES = {
  number: 'xod/core/constant-number',
  boolean: 'xod/core/constant-boolean',
  string: 'xod/core/constant-string',
};

// node types that provide a constant pulse,
// once(on start) or continuously
export const PULSE_CONST_NODETYPES = {
  [INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT]: 'xod/core/boot',
  [INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY]: 'xod/core/continuously',
};

// node types that prints values into Serial
// to debug xod programm, it should be omitted
// from Project before transpilation without
// turned on debug mode
export const DEBUG_NODETYPES = ['xod/core/watch', 'xod/core/console-log'];

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
export const NOT_IMPLEMENTED_IN_XOD_PATH =
  'xod/patch-nodes/not-implemented-in-xod';

/**
 * Path for a 'magic' patch, whose instance is placed
 * to mark abstract nodes.
 *
 * @name ABSTRACT_MARKER_PATH
 * @type {string}
 */
export const ABSTRACT_MARKER_PATH = 'xod/patch-nodes/abstract';

export const IMPL_FILENAME = 'patch.cpp';

export const UNTITLED_PROJECT = 'untitled';
