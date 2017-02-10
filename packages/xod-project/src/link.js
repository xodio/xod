import R from 'ramda';
import * as Utils from './utils';
import * as Node from './node';
import { def } from './types';

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
export const createLink = def(
  'createLink :: PinKey -> NodeOrId -> PinKey -> NodeOrId -> Link',
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
export const getLinkId = def(
  'getLinkId :: LinkOrId -> LinkId',
  R.ifElse(R.is(String), R.identity, R.prop('id'))
);

/**
 * @function getLinkInputNodeId
 * @param {Link}
 * @returns {string}
 */
export const getLinkInputNodeId = def(
  'getLinkInputNodeId :: Link -> NodeId',
  R.path(['input', 'nodeId'])
);

/**
 * @function getLinkOutputNodeId
 * @param {Link}
 * @returns {string}
 */
export const getLinkOutputNodeId = def(
  'getLinkOutputNodeId :: Link -> NodeId',
  R.path(['output', 'nodeId'])
);

/**
 * @function getLinkInputPinKey
 * @param {Link}
 * @returns {string}
 */
export const getLinkInputPinKey = def(
  'getLinkInputPinKey :: Link -> PinKey',
  R.path(['input', 'pinKey'])
);

/**
 * @function getLinkOutputPinKey
 * @param {Link}
 * @returns {string}
 */
export const getLinkOutputPinKey = def(
  'getLinkOutputPinKey :: Link -> PinKey',
  R.path(['output', 'pinKey'])
);

/**
 * @function getLinkNodeIds
 * @param {Link}
 * @returns {Array<string>}
 */
export const getLinkNodeIds = R.juxt([
  getLinkInputNodeId,
  getLinkOutputNodeId,
]);

/**
 * @function getLinkPinKeys
 * @param {Link}
 * @returns {Array<string>}
 */
export const getLinkPinKeys = R.juxt([
  getLinkInputPinKey,
  getLinkOutputPinKey,
]);

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
const isGetterEqualTo = def(
  'isGetterEqualTo :: (b -> a) -> (a -> Boolean)',
  getter => R.useWith(R.equals, [
    R.identity,
    getter,
  ])
);

/**
 * Returns true if links input node id equal to specified node id
 * @function isLinkInputNodeIdEquals
 * @param {string} nodeId
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkInputNodeIdEquals = def(
  'isLinkInputNodeIdEquals :: NodeId -> Link -> Boolean',
  isGetterEqualTo(getLinkInputNodeId)
);

/**
 * Returns true if links output node id equal to specified node id
 * @function isLinkOutputNodeIdEquals
 * @param {string} nodeId
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkOutputNodeIdEquals = def(
  'isLinkOutputNodeIdEquals :: NodeId -> Link -> Boolean',
  isGetterEqualTo(getLinkOutputNodeId)
);

/**
 * Returns true if input pin key equal to specified pin key
 * @function isInputPinKeyEquals
 * @param {string} pinKey
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkInputPinKeyEquals = def(
  'isLinkInputPinKeyEquals :: PinKey -> Link -> Boolean',
  isGetterEqualTo(getLinkInputPinKey)
);

/**
 * Returns true if input pin key equal to specified pin key
 * @function isOutputPinKeyEquals
 * @param {string} pinKey
 * @param {Link} link
 * @returns {boolean}
 */
export const isLinkOutputPinKeyEquals = def(
  'isLinkOutputPinKeyEquals :: PinKey -> Link -> Boolean',
  isGetterEqualTo(getLinkOutputPinKey)
);
