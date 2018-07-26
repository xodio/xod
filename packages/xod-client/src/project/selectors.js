import * as R from 'ramda';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';
import { foldMaybe, maybeProp } from 'xod-func-tools';
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
import {
  getDeducedTypes,
  getErrors,
  getLinkErrors,
  getNodeErrors,
  getPinErrors,
} from '../hinting/selectors';
import { isPatchDeadTerminal, getRenderablePinType } from '../project/utils';

import { createMemoizedSelector } from '../utils/selectorTools';

export const getProject = R.prop('project');
export const projectLens = R.lensProp('project');

// :: State -> [Patch]
const listPatches = R.compose(XP.listPatches, getProject);

//
// Patch
//

// :: (Patch -> a) -> Project -> Maybe PatchPath -> a
const getIndexedPatchEntitiesBy = R.curry((getter, project, maybePatchPath) =>
  R.compose(
    foldMaybe({}, R.compose(R.indexBy(R.prop('id')), getter)),
    R.chain(XP.getPatchByPath(R.__, project))
  )(maybePatchPath)
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

// :: State -> Maybe Patch
export const getCurrentPatch = createSelector(
  [getCurrentPatchPath, getProject],
  (patchPath, project) => R.chain(XP.getPatchByPath(R.__, project), patchPath)
);

export const getDeducedPinTypes = createMemoizedSelector(
  [getCurrentPatchPath, getDeducedTypes],
  [R.identical, R.equals],
  (maybeCurrentPatchPath, deducedPinTypes) =>
    R.compose(
      foldMaybe({}, R.identity),
      R.chain(maybeProp(R.__, deducedPinTypes))
    )(maybeCurrentPatchPath)
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

const errorsLens = R.lens(R.propOr([], 'errors'), R.assoc('errors'));

// :: Error -> RenderableNode|RenderableLink -> RenderableNode|RenderableLink
const addError = R.curry((error, renderableEntity) =>
  R.over(errorsLens, R.append(error), renderableEntity)
);

// :: PatchErrors -> RenderableNode -> RenderableNode
const addNodeErrors = R.curry((patchPath, errors, renderableNode) =>
  R.compose(
    R.reduce(R.flip(addError), renderableNode),
    getNodeErrors(patchPath, renderableNode.id, renderableNode.type)
  )(errors)
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

// :: Project -> RenderableNode -> RenderableNode
const markDeprecatedNodes = R.curry((project, node) =>
  R.compose(
    R.assoc('isDeprecated', R.__, node),
    foldMaybe(false, R.identity),
    R.map(XP.isDeprecatedPatch),
    XP.getPatchByNode
  )(node, project)
);

// :: PatchPath -> Project -> [PatchPath]
const listSpecializationPatchPaths = R.curry((nodeTypeWithoutTypes, project) =>
  R.compose(
    R.filter(
      R.compose(R.equals(nodeTypeWithoutTypes), XP.getBaseNameWithoutTypes)
    ),
    XP.listPatchPaths
  )(project)
);

// :: Project -> RenderableNode -> RenderableNode
const addSpecializationsList = R.curry((project, node) => {
  const nodeTypeWithoutTypes = R.compose(
    XP.getBaseNameWithoutTypes,
    XP.getNodeType
  )(node);

  return R.compose(
    R.assoc('specializations', R.__, node),
    R.ifElse(
      R.either(
        R.compose(
          foldMaybe(false, R.identity),
          R.map(XP.isAbstractPatch),
          XP.getPatchByNode(R.__, project)
        ),
        XP.isSpecializationNode
      ),
      () => listSpecializationPatchPaths(nodeTypeWithoutTypes, project),
      R.always([])
    )
  )(node);
});

const assocDeducedPinTypes = R.curry((deducedPinTypes, node) =>
  R.over(
    R.lensProp('pins'),
    R.map(pin =>
      R.assoc(
        'deducedType',
        R.path([XP.getNodeId(node), XP.getPinKey(pin)], deducedPinTypes),
        pin
      )
    ),
    node
  )
);

const addPinErrors = R.curry((patchPath, errors, renderableNode) =>
  R.over(
    R.lensProp('pins'),
    R.map(pin =>
      R.compose(
        R.assoc('isInvalid', R.__, pin),
        R.ifElse(R.isEmpty, R.F, R.T),
        getPinErrors(patchPath, renderableNode.id, XP.getPinKey(pin))
      )(errors)
    ),
    renderableNode
  )
);

// :: Node -> Patch -> { nodeId: { pinKey: Boolean } } -> Project -> RenderableNode
export const getRenderableNode = R.curry(
  (node, currentPatch, connectedPins, deducedPinTypes, project, errors) => {
    const curPatchPath = XP.getPatchPath(currentPatch);
    return R.compose(
      assocDeducedPinTypes(deducedPinTypes),
      addSpecializationsList(project),
      markDeprecatedNodes(project),
      addPinErrors(curPatchPath, errors),
      addVariadicProps(project),
      addNodeErrors(curPatchPath, errors),
      addNodePositioning,
      assocPinIsConnected(connectedPins),
      assocNodeIdToPins,
      mergePinDataFromPatch(project, currentPatch)
    )(node);
  }
);

// :: State -> StrMap RenderableNode
export const getRenderableNodes = createMemoizedSelector(
  [
    getProject,
    getCurrentPatch,
    getCurrentPatchNodes,
    getConnectedPins,
    getDeducedPinTypes,
    getErrors,
  ],
  [R.equals, R.equals, R.equals, R.equals, R.equals, R.equals],
  (
    project,
    maybeCurrentPatch,
    currentPatchNodes,
    connectedPins,
    deducedPinTypes,
    errors
  ) =>
    foldMaybe(
      {},
      currentPatch =>
        R.map(
          getRenderableNode(
            R.__,
            currentPatch,
            connectedPins,
            deducedPinTypes,
            project,
            errors
          )
        )(currentPatchNodes),
      maybeCurrentPatch
    )
);

// :: State -> StrMap RenderableLink
export const getRenderableLinks = createMemoizedSelector(
  [
    getRenderableNodes,
    getCurrentPatchLinks,
    getCurrentPatch,
    getProject,
    getDeducedPinTypes,
    getErrors,
  ],
  [R.equals, R.equals, R.equals, R.equals, R.equals, R.equals],
  (nodes, links, curPatch, project, deducedPinTypes, errors) =>
    R.compose(
      addLinksPositioning(nodes),
      foldMaybe([], patchPath =>
        R.map(link =>
          R.compose(
            newLink => {
              const outputNodeId = XP.getLinkOutputNodeId(link);
              const outputPinKey = XP.getLinkOutputPinKey(link);
              return R.assoc(
                'type',
                getRenderablePinType(nodes[outputNodeId].pins[outputPinKey]),
                newLink
              );
            },
            R.ifElse(
              R.isEmpty,
              R.always(link),
              R.compose(R.assoc('dead', true), R.reduce(R.flip(addError), link))
            ),
            getLinkErrors(patchPath, XP.getLinkId(link))
          )(errors)
        )(links)
      ),
      R.map(XP.getPatchPath)
    )(curPatch)
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

    return R.compose(
      R.reject(R.isNil),
      R.map(
        ({ entity, id }) =>
          renderables[entity][id]
            ? {
                entityType: entity,
                data: renderables[entity][id],
              }
            : null
      )
    )(selection);
  }
);

//
// Suggester
//

// :: State -> { search: (String -> [SearchResult])}
export const getPatchSearchIndex = createMemoizedSelector(
  [listPatches, getCurrentPatchPath],
  [R.equals],
  (patches, maybeCurPatchPath) =>
    R.compose(
      // A little optimization to avoid updating SearchIndex on each patch switch
      ({ search }) => ({
        // :: String -> [SearchResult]
        search: R.compose(
          R.reject(
            R.pathSatisfies(
              R.equals(
                foldMaybe('__NO_OPENED_PATCH__', R.identity, maybeCurPatchPath)
              ),
              ['item', 'path']
            )
          ),
          search
        ),
      }),
      createIndexFromPatches,
      R.reject(
        R.anyPass([
          isPatchDeadTerminal,
          XP.isUtilityPatch,
          XP.isDeprecatedPatch,
        ])
      )
    )(patches)
);
