
/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Validity
 * @property {boolean} valid - has check passed
 * @property {string} error - contains error text if not `valid` or `undefined` otherwise.
 *   Value of `error` is one of {@link ERROR} constants
 */

/**
 * Checks if a name is a valid name for entities like
 * project name, patch path component, etc
 *
 * @function validateName
 * @param {string} name - string to check
 * @returns {Validity} validation result
 */
// TODO: implement
