
/**
 * Enumeration of possible validation errors
 *
 * @name ERROR
 * @enum {string}
 */
export const ERROR = {
  // patches
  PATCH_INVALID: 'Patch is invalid',
  PATCH_NOT_FOUND: 'Can\'t find specified patch in the specified project',
  PATCH_NOT_FOUND_BY_PATH: 'There is no patch in the project with specified path',
  PATCH_PATH_OCCUPIED: 'Another patch with the same path is already exist',
  // pathes
  PATH_INVALID: 'Path empty or contains invalid characters',
  // nodes
  POSITION_INVALID: 'Invalid position property',
  // links
  LINK_ID_INVALID: 'Link should have a generated id',
  LINK_INPUT_INVALID: 'Link should have input object with keys: `pinKey` and `nodeId`',
  LINK_OUTPUT_INVALID: 'Link should have output object with keys: `pinKey` and `nodeId`',
  LINK_INPUT_NODE_NOT_FOUND: 'Input node of the link is not exist in this patch',
  LINK_OUTPUT_NODE_NOT_FOUND: 'Output node of the link is not exist in this patch',
  // pins
  PIN_TYPE_INVALID: 'Pin type should be one of possible values: `string`, `number`, `boolean`, `pulse`',
  PIN_DIRECTION_INVALID: 'Pin directions should be `input` or `output`.',
  // etc
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
