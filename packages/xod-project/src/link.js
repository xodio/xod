import R from 'ramda';
import { Either } from 'ramda-fantasy';

import * as CONST from './constants';
import * as Utils from './utils';
import * as Node from './node';

/**
 * @typedef {Object} Link
 */

/**
 * A {@link Link} object or just its ID as {@link string}
 * @typedef {(Link|string)} LinkOrId
 */

/**
 * Creates a link between two pins of two nodes.
 *
 * @function createLink
 * @param {string} inputPinKey - name of input node’s pin to link
 * @param {NodeOrId} inputNode - input node to link
 * @param {string} outputPinKey - name of output node’s pin to link
 * @param {NodeOrId} outputNode - output node to link
 * @returns {Link} error or a link object created
 */
export const createLink = R.curry(
  (secondPinKey, secondNode, firstPinKey, firstNode) => (
    {
      id: Utils.generateId(),
      output: {
        nodeId: Node.getNodeId(firstNode),
        pinKey: firstPinKey,
      },
      input: {
        nodeId: Node.getNodeId(secondNode),
        pinKey: secondPinKey,
      },
    }
  )
);

/**
 * @function getLinkId
 * @param {LinkOrId} link
 * @returns {string}
 */
export const getLinkId = R.ifElse(R.is(String), R.identity, R.prop('id'));

/**
 * @function getLinkInputNodeId
 * @param {Link}
 * @returns {string}
 */
export const getLinkInputNodeId = R.path(['input', 'nodeId']);

/**
 * @function getLinkOutputNodeId
 * @param {Link}
 * @returns {string}
 */
export const getLinkOutputNodeId = R.path(['output', 'nodeId']);

/**
 * @function getLinkInputPinKey
 * @param {Link}
 * @returns {string}
 */
export const getLinkInputPinKey = R.path(['input', 'pinKey']);

/**
 * @function getLinkOutputPinKey
 * @param {Link}
 * @returns {string}
 */
export const getLinkOutputPinKey = R.path(['output', 'pinKey']);

// =============================================================================
//
// Checks for equality
//
// =============================================================================

/**
 * Returns function which will check that passed getter will be equal to some value
 * It's just a helper to create a few similar functions. So we're not exporting it.
 *
 * isGetterEqualTo :: function -> function
 */
const isGetterEqualTo = (getter) => R.useWith(
  R.equals,
  [
    R.identity,
    getter,
  ]
);

/**
 * Returns boolean if input node id equal to specified id
 * @function isInputNodeIdEqualsTo
 * @param {string} id
 * @param {Link} link
 * @returns {boolean}
 */
export const isInputNodeIdEqualsTo = isGetterEqualTo(getLinkInputNodeId);

/**
 * Returns boolean if input node id equal to specified id
 * @function isOutputNodeIdEqualsTo
 * @param {string} id
 * @param {Link} link
 * @returns {boolean}
 */
export const isOutputNodeIdEqualsTo = isGetterEqualTo(getLinkOutputNodeId);

/**
 * Returns boolean if input pin key equal to specified key
 * @function isInputPinKeyEqualsTo
 * @param {string} key
 * @param {Link} link
 * @returns {boolean}
 */
export const isInputPinKeyEqualsTo = isGetterEqualTo(getLinkInputPinKey);

/**
 * Returns boolean if input pin key equal to specified key
 * @function isOutputPinKeyEqualsTo
 * @param {string} key
 * @param {Link} link
 * @returns {boolean}
 */
export const isOutputPinKeyEqualsTo = isGetterEqualTo(getLinkOutputPinKey);

/**
 * Checks that input/output property has required properties
 *
 * @private
 * @function hasLinkIOProps
 * @param {object} io
 * @returns {boolean}
 */
const hasLinkIOProps = R.both(R.has('nodeId'), R.has('pinKey'));

/**
 * Checks that link has an id.
 *
 * @function validateLinkId
 * @param {Link} link
 * @returns {Either<Error|Link>}
 */
export const validateLinkId = R.ifElse(
  R.compose(
    R.is(String),
    R.prop('id')
  ),
  Either.Right,
  Utils.leaveError(CONST.ERROR.LINK_ID_INVALID)
);

/**
 * Checks that link input property is valid
 *
 * @function validateLinkInput
 * @param {Link} link
 * @returns {Either<Error|Link>}
 */
export const validateLinkInput = R.ifElse(
  R.compose(
    hasLinkIOProps,
    R.propOr({}, 'input')
  ),
  Either.Right,
  Utils.leaveError(CONST.ERROR.LINK_INPUT_INVALID)
);

/**
 * Checks that link output property is valid
 *
 * @function validateLinkOutput
 * @param {Link} link
 * @returns {Either<Error|Link>}
 */
export const validateLinkOutput = R.ifElse(
  R.compose(
    hasLinkIOProps,
    R.propOr({}, 'output')
  ),
  Either.Right,
  Utils.leaveError(CONST.ERROR.LINK_OUTPUT_INVALID)
);
