
/**
 * Enumeration of possible validation errors
 *
 * @name ERROR
 * @enum {string}
 */
export const ERROR = {
  NAME_INVALID_CHARS: 'Name contains invalid characters',
  NAME_EMPTY: 'Name should not be empty',
  PIN_TYPE_INVALID: 'Pin type should be one of possible values: `string`, `number`, `boolean`, `pulse`',
  PIN_DIRECTION_INVALID: 'Pin directions should be `input` or `output`.',
};

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
