import R from 'ramda';
import * as CONST from './constants';
import * as Tools from './func-tools';
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
  (inputPinKey, inputNode, outputPinKey, outputNode) => (
    {
      id: Utils.generateId(),
      output: {
        nodeId: Node.getNodeId(outputNode),
        pinKey: outputPinKey,
      },
      input: {
        nodeId: Node.getNodeId(inputNode),
        pinKey: inputPinKey,
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
 * @private
 * @function isGetterEqualTo
 * @param {function} getter
 * @returns {function}
 */
const isGetterEqualTo = getter => R.useWith(
  R.equals,
  [
    R.identity,
    getter,
  ]
);

/**
 * Returns true if links input node id equal to specified node id
 * @function isLinkInputNodeIdEquals
 * @param {string} nodeId
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkInputNodeIdEquals = isGetterEqualTo(getLinkInputNodeId);

/**
 * Returns true if links output node id equal to specified node id
 * @function isLinkOutputNodeIdEquals
 * @param {string} nodeId
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkOutputNodeIdEquals = isGetterEqualTo(getLinkOutputNodeId);

/**
 * Returns true if input pin key equal to specified pin key
 * @function isInputPinKeyEquals
 * @param {string} pinKey
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkInputPinKeyEquals = isGetterEqualTo(getLinkInputPinKey);

/**
 * Returns true if input pin key equal to specified pin key
 * @function isOutputPinKeyEquals
 * @param {string} pinKey
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkOutputPinKeyEquals = isGetterEqualTo(getLinkOutputPinKey);

/**
 * Checks that input/output property has required properties
 *
 * @private
 * @function hasLinkRequiredProps
 * @param {object} io
 * @returns {boolean}
 */
const hasLinkRequiredProps = R.both(R.has('nodeId'), R.has('pinKey'));

/**
 * Checks that link has an id.
 *
 * @function validateLinkId
 * @param {Link} link
 * @returns {Either<Error|Link>}
 */
export const validateLinkId = Tools.errOnFalse(
  CONST.ERROR.LINK_ID_INVALID,
  R.compose(
    R.is(String),
    R.prop('id')
  )
);

/**
 * Checks that link input property is valid
 *
 * @function validateLinkInput
 * @param {Link} link
 * @returns {Either<Error|Link>}
 */
export const validateLinkInput = Tools.errOnFalse(
  CONST.ERROR.LINK_INPUT_INVALID,
  R.compose(
    hasLinkRequiredProps,
    R.propOr({}, 'input')
  )
);

/**
 * Checks that link output property is valid
 *
 * @function validateLinkOutput
 * @param {Link} link
 * @returns {Either<Error|Link>}
 */
export const validateLinkOutput = Tools.errOnFalse(
  CONST.ERROR.LINK_OUTPUT_INVALID,
  R.compose(
    hasLinkRequiredProps,
    R.propOr({}, 'output')
  )
);
