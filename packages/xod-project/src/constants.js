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
  BYTE: 'byte',
  PORT: 'port',
  PORT_ANALOG: 'port-analog',
  DEAD: 'dead',
  // generic types
  T1: 't1',
  T2: 't2',
  T3: 't3',
};

export const INPUT_PULSE_PIN_BINDING_OPTIONS = {
  NEVER: 'Never',
  CONTINUOUSLY: 'Continuously',
  ON_BOOT: 'On Boot',
};

export const DEFAULT_VALUE_OF_TYPE = {
  [PIN_TYPE.STRING]: '""',
  [PIN_TYPE.NUMBER]: '0',
  [PIN_TYPE.BOOLEAN]: 'False',
  [PIN_TYPE.PULSE]: INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER,
  [PIN_TYPE.BYTE]: '00h',
  [PIN_TYPE.PORT]: 'D0',
  [PIN_TYPE.PORT_ANALOG]: 'A0',
  [PIN_TYPE.DEAD]: '',
  [PIN_TYPE.T1]: '',
  [PIN_TYPE.T2]: '',
  [PIN_TYPE.T3]: '',
};

export const MAX_ARITY_STEP = 3;

/**
 * A lookup table that answers the question
 * 'can a type A be cast to type B?' for static types.
 * Generic types are handled separately.
 *
 * Map contains only compatible types.
 * All other types is not compatigle by default.
 *
 * @example
 *   STATIC_TYPES_COMPATIBILITY[PIN_TYPE.BOOLEAN][PIN_TYPE.STRING] // true
 *   // boolean can be cast to string
 *
 * @name STATIC_TYPES_COMPATIBILITY
 */
export const STATIC_TYPES_COMPATIBILITY = {
  [PIN_TYPE.BOOLEAN]: {
    [PIN_TYPE.BOOLEAN]: true,
    [PIN_TYPE.NUMBER]: true,
    [PIN_TYPE.PULSE]: true,
    [PIN_TYPE.STRING]: true,
  },
  [PIN_TYPE.NUMBER]: {
    [PIN_TYPE.BOOLEAN]: true,
    [PIN_TYPE.NUMBER]: true,
    [PIN_TYPE.STRING]: true,
  },
  [PIN_TYPE.BYTE]: {
    [PIN_TYPE.BYTE]: true,
    [PIN_TYPE.STRING]: true,
  },
  // nothing can be cast to or from pulse
  [PIN_TYPE.PULSE]: {
    [PIN_TYPE.PULSE]: true,
  },
  // nothing can be cast from string
  [PIN_TYPE.STRING]: {
    [PIN_TYPE.STRING]: true,
  },
  [PIN_TYPE.PORT]: {
    [PIN_TYPE.PORT]: true,
  },
  [PIN_TYPE.PORT_ANALOG]: {
    [PIN_TYPE.PORT]: true,
    [PIN_TYPE.PORT_ANALOG]: true,
  },
};

// node types that provide a constant value
export const CONST_NODETYPES = {
  [PIN_TYPE.NUMBER]: 'xod/core/constant-number',
  [PIN_TYPE.BOOLEAN]: 'xod/core/constant-boolean',
  [PIN_TYPE.STRING]: 'xod/core/constant-string',
  [PIN_TYPE.BYTE]: 'xod/core/constant-byte',
  [PIN_TYPE.PORT]: 'xod/core/constant-port',
  [PIN_TYPE.PORT_ANALOG]: 'xod/core/constant-port-analog',
};

// node types that provide a constant pulse,
// once(on start) or continuously
export const PULSE_CONST_NODETYPES = {
  // [INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER]: Do not create Node for `Never`
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

/**
 * Path for a 'magic' patch, whose instance is placed
 * to mark deprecated nodes.
 */
export const DEPRECATED_MARKER_PATH = 'xod/patch-nodes/deprecated';

/**
 * Path for a 'magic' patch, whose instance is placed
 * to mark utility nodes.
 */
export const UTILITY_MARKER_PATH = 'xod/patch-nodes/utility';

export const IMPL_FILENAME = 'patch.cpp';

export const UNTITLED_PROJECT = 'untitled';
