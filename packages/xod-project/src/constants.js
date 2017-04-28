
/**
 * Enumeration of possible validation errors
 *
 * @name ERROR
 * @enum {string}
 */
export const ERROR = {
  // project
  TYPE_NOT_FOUND: 'Patch with specified type is not found in the project',
  PINS_NOT_FOUND: 'Specified node types haven\'t required pins for creating links',
  // patches
  PATCH_NOT_FOUND_BY_PATH: 'Can\'t find the patch in the project with specified path: "{patchPath}"',
  PATCH_PATH_OCCUPIED: 'Another patch with the same path already exists',
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
  IMPLEMENTATION_NOT_FOUND: 'Implementation "{impl}" not found in the project',
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
/**
 * Enumeration of nodeTypes that references to data type.
 * E.G., inputBool === Boolean, constPulse === Pulse and etc.
 *
 * @name NODETYPE_TO_DATA_TYPES
 * @enum {PIN_TYPE}
 */
export const NODETYPE_TO_DATA_TYPES = { // TODO: now this is just { number: 'number', etc }
  number: PIN_TYPE.NUMBER,
  string: PIN_TYPE.STRING,
  bool: PIN_TYPE.BOOLEAN,
  pulse: PIN_TYPE.PULSE,
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
