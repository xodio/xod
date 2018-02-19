import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';
import { foldMaybe, foldEither } from 'xod-func-tools';
import { createIndexFromPatches } from 'xod-patch-search';

import {
  addNodePositioning,
  addLinksPositioning,
  addPoints,
} from './nodeLayout';
import { SELECTION_ENTITY_TYPE } from '../editor/constants';
import {
  getSelection,
  getCurrentPatchPath,
  getLinkingPin,
} from '../editor/selectors';
import { isPatchDeadTerminal } from '../project/utils';

import { createMemoizedSelector } from '../utils/selectorTools';

import { missingPatchForNode } from './messages';

export const getProject = R.prop('project');
export const projectLens = R.lensProp('project');

//
// Patch
//

// :: (Patch -> a) -> Project -> Maybe PatchPath -> a
const getIndexedPatchEntitiesBy = R.curry(
  (getter, project, maybePatchPath) => foldMaybe(
    {},
    R.compose(
      R.indexBy(R.prop('id')),
      getter,
      XP.getPatchByPathUnsafe(R.__, project)
    ),
    maybePatchPath
  )
);

// :: State -> StrMap Comment
export const getCurrentPatchComments = createSelector(
  [getProject, getCurrentPatchPath],
  getIndexedPatchEntitiesBy(XP.listComments)
);

// :: State -> StrMap Link
export const getCurrentPatchLinks = createSelector(
  [getProject, getCurrentPatchPath],
  getIndexedPatchEntitiesBy(XP.listLinks)
);

// :: State -> StrMap Node
export const getCurrentPatchNodes = createSelector(
  [getProject, getCurrentPatchPath],
  getIndexedPatchEntitiesBy(XP.listNodes)
);

// returns object with a shape { nodeId: { pinKey: Boolean } }
const getConnectedPins = createMemoizedSelector(
  [getCurrentPatchLinks],
  [R.equals],
  R.compose(
    R.reduce(
      (acc, link) => R.compose(
        R.assocPath([
          XP.getLinkInputNodeId(link),
          XP.getLinkInputPinKey(link),
        ], true),
        R.assocPath([
          XP.getLinkOutputNodeId(link),
          XP.getLinkOutputPinKey(link),
        ], true)
      )(acc),
      {}
    ),
    R.values
  )
);

// :: IndexedLinks -> IntermediateNode -> IntermediateNode
const assocPinIsConnected = R.curry((connectedPins, node) =>
  R.over(
    R.lensProp('pins'),
    R.map(pin =>
      R.assoc(
        'isConnected',
        !!R.path([node.id, pin.key], connectedPins),
        pin
      )
    ),
    node
  )
);

// :: IntermediateNode -> IntermediateNode
const assocNodeIdToPins = node =>
  R.over(
    R.lensProp('pins'),
    R.map(
      R.assoc('nodeId', node.id)
    ),
    node
  );

// :: Project -> Patch -> IntermediateNode -> IntermediateNode
const mergePinDataFromPatch = R.curry(
  (project, curPatch, node) => R.compose(
    R.assoc('pins', R.__, node),
    XP.getPinsForNode
  )(node, curPatch, project)
);

// :: State -> Maybe Patch
export const getCurrentPatch = createSelector(
  [getCurrentPatchPath, getProject],
  (patchPath, project) => R.chain(
    XP.getPatchByPath(R.__, project),
    patchPath
  )
);

// :: Error -> RenderableNode -> RenderableNode
const addError = R.curry(
  (error, node) => R.compose(
    R.over(
      R.lensProp('errors'),
      R.append(error)
    ),
    R.unless(
      R.has('errors'),
      R.assoc('errors', [])
    )
  )(node)
);

// :: Project -> RenderableNode -> RenderableNode
const addDeadRefErrors = R.curry(
  (project, renderableNode) => R.compose(
    R.ifElse(
      R.compose(
        Maybe.isNothing,
        XP.getPatchByPath(R.__, project),
      ),
      type => addError(
        new Error(missingPatchForNode(type)),
        renderableNode
      ),
      R.compose(
        foldEither(
          err => addError(err, renderableNode),
          R.always(renderableNode)
        ),
        XP.validatePatchContents(R.__, project),
        XP.getPatchByPathUnsafe(R.__, project)
      )
    ),
    R.prop('type')
  )(renderableNode)
);

// :: Patch -> RenderableNode -> RenderableNode
const addVariadicErrors = R.curry(
  (patch, renderableNode) => R.when(
    R.compose(
      XP.isVariadicPath,
      R.prop('type')
    ),
    node => R.compose(
      foldEither(
        err => addError(err, node),
        R.always(node)
      ),
      XP.validatePatchForVariadics
    )(patch)
  )(renderableNode)
);

// :: State -> StrMap RenderableNode
export const getRenderableNodes = createMemoizedSelector(
  [getProject, getCurrentPatch, getCurrentPatchNodes, getConnectedPins],
  [R.equals, R.equals, R.equals, R.equals],
  (project, maybeCurrentPatch, currentPatchNodes, connectedPins) => foldMaybe(
    {},
    currentPatch => R.map(
      R.compose(
        addVariadicErrors(currentPatch),
        addDeadRefErrors(project),
        addNodePositioning,
        assocPinIsConnected(connectedPins),
        assocNodeIdToPins,
        mergePinDataFromPatch(project, currentPatch)
      ),
      currentPatchNodes
    ),
    maybeCurrentPatch
  )
);

// :: State -> StrMap RenderableLink
export const getRenderableLinks = createMemoizedSelector(
  [getRenderableNodes, getCurrentPatchLinks],
  [R.equals, R.equals],
  (nodes, links) =>
    R.compose(
      addLinksPositioning(nodes),
      R.map((link) => {
        const inputNodeId = XP.getLinkInputNodeId(link);
        const outputNodeId = XP.getLinkOutputNodeId(link);
        const inputPinKey = XP.getLinkInputPinKey(link);
        const outputPinKey = XP.getLinkOutputPinKey(link);

        const inputNodeIsDead = nodes[inputNodeId].dead;
        const outputNodeIsDead = nodes[outputNodeId].dead;
        const inputPinKeyHasDeadType = R.pathEq(
          [inputNodeId, 'pins', inputPinKey, 'type'],
          XP.PIN_TYPE.DEAD,
          nodes
        );
        const outputPinKeyHasDeadType = R.pathEq(
          [outputNodeId, 'pins', outputPinKey, 'type'],
          XP.PIN_TYPE.DEAD,
          nodes
        );

        return R.merge(
          link,
          {
            type: nodes[outputNodeId].pins[outputPinKey].type,
            dead: (
              inputNodeIsDead || outputNodeIsDead ||
              inputPinKeyHasDeadType || outputPinKeyHasDeadType
            ),
          }
        );
      })
    )(links)
);

// :: State -> StrMap RenderableComment
export const getRenderableComments = getCurrentPatchComments;

// :: State -> LinkGhost
export const getLinkGhost = createSelector(
  [getRenderableNodes, getLinkingPin],
  (nodes, fromPin) => {
    if (!fromPin) { return null; }

    const node = nodes[fromPin.nodeId];
    const pin = node.pins[fromPin.pinKey];

    return {
      id: '',
      type: pin.type,
      from: addPoints(pin.position, node.position),
      to: { x: 0, y: 0 },
    };
  }
);

//
// Inspector
//

// :: State -> [ RenderableSelection ]
export const getRenderableSelection = createMemoizedSelector(
  [getRenderableNodes, getRenderableLinks, getRenderableComments, getSelection],
  [R.equals, R.equals, R.equals, R.equals],
  (renderableNodes, renderableLinks, renderableComments, selection) => {
    const renderables = {
      [SELECTION_ENTITY_TYPE.NODE]: renderableNodes,
      [SELECTION_ENTITY_TYPE.LINK]: renderableLinks,
      [SELECTION_ENTITY_TYPE.COMMENT]: renderableComments,
    };

    return R.map(
      ({ entity, id }) => ({
        entityType: entity,
        data: renderables[entity][id],
      }),
      selection
    );
  }
);

//
// Suggester
//
export const getPatchSearchIndex = createSelector(
  R.compose(XP.listPatches, getProject),
  R.compose(
    createIndexFromPatches,
    R.reject(isPatchDeadTerminal)
  )
);
