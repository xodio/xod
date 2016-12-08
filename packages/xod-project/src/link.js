import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

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
export const getLinkInputNodeId = R.compose(
  Maybe,
  R.path(['input', 'nodeId'])
);

/**
 * @function getLinkOutputNodeId
 * @param {Link}
 * @returns {string}
 */
export const getLinkOutputNodeId = R.compose(
  Maybe,
  R.path(['output', 'nodeId'])
);

/**
 * @function getLinkInputPinKey
 * @param {Link}
 * @returns {string}
 */
export const getLinkInputPinKey = R.compose(
  Maybe,
  R.path(['input', 'pinKey'])
);

/**
 * @function getLinkOutputPinKey
 * @param {Link}
 * @returns {string}
 */
export const getLinkOutputPinKey = R.compose(
  Maybe,
  R.path(['output', 'pinKey'])
);
