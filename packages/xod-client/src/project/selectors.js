import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';
import { foldMaybe, foldEither, explodeMaybe } from 'xod-func-tools';
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
const getIndexedPatchEntitiesBy = R.curry((getter, project, maybePatchPath) =>
  foldMaybe(
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

// :: { LinkId: Link } -> { NodeId: { PinKey: Boolean } }
export const computeConnectedPins = R.compose(
  R.reduce(
    (acc, link) =>
      R.compose(
        R.assocPath(
          [XP.getLinkInputNodeId(link), XP.getLinkInputPinKey(link)],
          true
        ),
        R.assocPath(
          [XP.getLinkOutputNodeId(link), XP.getLinkOutputPinKey(link)],
          true
        )
      )(acc),
    {}
  ),
  R.values
);

// returns object with a shape { nodeId: { pinKey: Boolean } }
export const getConnectedPins = createMemoizedSelector(
  [getCurrentPatchLinks],
  [R.equals],
  computeConnectedPins
);

// :: IndexedLinks -> IntermediateNode -> IntermediateNode
const assocPinIsConnected = R.curry((connectedPins, node) =>
  R.over(
    R.lensProp('pins'),
    R.map(pin =>
      R.assoc('isConnected', !!R.path([node.id, pin.key], connectedPins), pin)
    ),
    node
  )
);

// :: IntermediateNode -> IntermediateNode
const assocNodeIdToPins = node =>
  R.over(R.lensProp('pins'), R.map(R.assoc('nodeId', node.id)), node);

const addLastVariadicGroupFlag = R.curry((project, node, pins) => {
  const nodeType = XP.getNodeType(node);
  const arityStep = R.compose(
    foldMaybe(0, R.identity),
    R.chain(XP.getArityStepFromPatch),
    XP.getPatchByPath
  )(nodeType, project);

  return R.converge(R.merge, [
    R.map(R.assoc('isLastVariadicGroup', false)),
    R.compose(
      R.indexBy(XP.getPinKey),
      R.map(R.assoc('isLastVariadicGroup', true)),
      R.takeLast(arityStep),
      R.sortBy(XP.getPinOrder),
      R.filter(XP.isInputPin),
      R.values
    ),
  ])(pins);
});

// :: Project -> Patch -> IntermediateNode -> IntermediateNode
const mergePinDataFromPatch = R.curry((project, curPatch, node) =>
  R.compose(
    R.assoc('pins', R.__, node),
    addLastVariadicGroupFlag(project, node),
    XP.getPinsForNode
  )(node, curPatch, project)
);

// :: State -> Maybe Patch
export const getCurrentPatch = createSelector(
  [getCurrentPatchPath, getProject],
  (patchPath, project) => R.chain(XP.getPatchByPath(R.__, project), patchPath)
);

// :: Error -> RenderableNode|RenderableLink -> RenderableNode|RenderableLink
const addError = R.curry((error, renderableEntity) =>
  R.compose(
    R.over(R.lensProp('errors'), R.append(error)),
    R.unless(R.has('errors'), R.assoc('errors', []))
  )(renderableEntity)
);

// :: Project -> RenderableNode -> RenderableNode
const addDeadRefErrors = R.curry((project, renderableNode) =>
  R.compose(
    R.ifElse(
      R.compose(Maybe.isNothing, XP.getPatchByPath(R.__, project)),
      type => addError(new Error(missingPatchForNode(type)), renderableNode),
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
const addVariadicErrors = R.curry((patch, renderableNode) =>
  R.when(R.compose(XP.isVariadicPath, XP.getNodeType), node =>
    R.compose(
      foldEither(err => addError(err, node), R.always(node)),
      XP.validatePatchForVariadics
    )(patch)
  )(renderableNode)
);

// :: Patch -> RenderableNode -> RenderableNode
const addAbstractPatchErrors = R.curry((patch, renderableNode) =>
  R.when(R.compose(R.equals(XP.ABSTRACT_MARKER_PATH), XP.getNodeType), node =>
    R.compose(
      foldEither(err => addError(err, node), R.always(node)),
      XP.validateAbstractPatch
    )(patch)
  )(renderableNode)
);

/**
 * Adds `isVariadic` flag and `arityStep` prop.
 */
// :: Project -> RenderableNode -> RenderableNode
const addVariadicProps = R.curry((project, renderableNode) =>
  R.compose(
    R.merge(renderableNode),
    R.applySpec({
      isVariadic: foldMaybe(false, R.T),
      arityStep: foldMaybe(0, R.identity),
    }),
    R.chain(XP.getArityStepFromPatch),
    XP.getPatchByPath(R.__, project),
    R.prop('type')
  )(renderableNode)
);

// :: Node -> Patch -> { nodeId: { pinKey: Boolean } } -> Project -> RenderableNode
export const getRenderableNode = R.curry(
  (node, currentPatch, connectedPins, project) =>
    R.compose(
      addAbstractPatchErrors(currentPatch),
      addVariadicErrors(currentPatch),
      addVariadicProps(project),
      addDeadRefErrors(project),
      addNodePositioning,
      assocPinIsConnected(connectedPins),
      assocNodeIdToPins,
      mergePinDataFromPatch(project, currentPatch)
    )(node)
);

// :: State -> StrMap RenderableNode
export const getRenderableNodes = createMemoizedSelector(
  [getProject, getCurrentPatch, getCurrentPatchNodes, getConnectedPins],
  [R.equals, R.equals, R.equals, R.equals],
  (project, maybeCurrentPatch, currentPatchNodes, connectedPins) =>
    foldMaybe(
      {},
      currentPatch =>
        R.map(
          getRenderableNode(R.__, currentPatch, connectedPins, project),
          currentPatchNodes
        ),
      maybeCurrentPatch
    )
);

// :: State -> StrMap RenderableLink
export const getRenderableLinks = createMemoizedSelector(
  [getRenderableNodes, getCurrentPatchLinks, getCurrentPatch, getProject],
  [R.equals, R.equals, R.equals, R.equals],
  (nodes, links, curPatch, project) =>
    R.compose(
      addLinksPositioning(nodes),
      R.map(link =>
        R.compose(
          newLink => {
            const outputNodeId = XP.getLinkOutputNodeId(link);
            const outputPinKey = XP.getLinkOutputPinKey(link);
            return R.assoc(
              'type',
              nodes[outputNodeId].pins[outputPinKey].type,
              newLink
            );
          },
          foldEither(
            R.pipe(addError(R.__, link), R.assoc('dead', true)),
            R.identity
          ),
          R.map(R.always(link)),
          XP.validateLinkPins
        )(
          link,
          explodeMaybe(
            'Imposible error: RenderableLinks will be computed only for current patch',
            curPatch
          ),
          project
        )
      )
    )(links)
);

// :: State -> StrMap RenderableComment
export const getRenderableComments = getCurrentPatchComments;

// :: State -> LinkGhost
export const getLinkGhost = createSelector(
  [getRenderableNodes, getLinkingPin],
  (nodes, fromPin) => {
    if (!fromPin) {
      return null;
    }

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
  R.compose(createIndexFromPatches, R.reject(isPatchDeadTerminal))
);
