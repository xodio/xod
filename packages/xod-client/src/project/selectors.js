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
import { isPatchDeadTerminal, getRenderablePinType } from '../project/utils';

import { createMemoizedSelector } from '../utils/selectorTools';

import { missingPatchForNode } from './messages';

export const getProject = R.prop('project');
export const projectLens = R.lensProp('project');

// :: State -> [Patch]
const listPatches = R.compose(XP.listPatches, getProject);

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

// :: State -> Maybe Patch
export const getCurrentPatch = createSelector(
  [getCurrentPatchPath, getProject],
  (patchPath, project) => R.chain(XP.getPatchByPath(R.__, project), patchPath)
);

export const getDeducedPinTypes = createSelector(
  [getProject, getCurrentPatch],
  (project, maybeCurrentPatch) =>
    foldMaybe({}, patch => XP.deducePinTypes(patch, project), maybeCurrentPatch)
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
      // TODO: Replace this custom error with rich error from xod-project
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

// :: Project -> RenderableNode -> RenderableNode
const markDeprecatedNodes = R.curry((project, node) =>
  R.compose(
    R.assoc('isDeprecated', R.__, node),
    foldMaybe(false, R.identity),
    R.map(XP.isDeprecatedPatch),
    XP.getPatchByNode
  )(node, project)
);

/**
 * Converts PatchPath into label to make selection of specialization easier.
 * E.G.
 * `xod/core/if-else` -> `Auto-detect (xod/core)`
 * `xod/core/if-else(string)` -> `string (xod/core)`
 * `foo/bar/if-else` -> `Auto-detect (foo/bar)`
 * `foo/bar/if-else(number,number)` -> `number, number (foo/bar)`
 * `@/if-else(boolean)` -> `boolean (@)`
 */
// : PatchPath -> String
const getSpecializationLabel = patchPath =>
  R.compose(
    R.concat(R.__, ` (${XP.getLibraryName(patchPath)})`),
    R.ifElse(
      R.contains('('),
      R.compose(
        R.concat('Type: '),
        R.replace(',', ', '),
        R.nth(1),
        R.match(/\((.+)\)/)
      ),
      R.always('Auto-detect type')
    )
  )(patchPath);

// :: PatchPath -> Project -> [{ value: PatchPath, label: String }]
const listSpecializationPatchPaths = R.curry((nodeTypeWithoutTypes, project) =>
  R.compose(
    R.map(patchPath => ({
      value: patchPath,
      label: getSpecializationLabel(patchPath),
    })),
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

// :: Node -> Patch -> { nodeId: { pinKey: Boolean } } -> Project -> RenderableNode
export const getRenderableNode = R.curry(
  (node, currentPatch, connectedPins, deducedPinTypes, project) =>
    R.compose(
      assocDeducedPinTypes(deducedPinTypes),
      addSpecializationsList(project),
      markDeprecatedNodes(project),
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
  [
    getProject,
    getCurrentPatch,
    getCurrentPatchNodes,
    getConnectedPins,
    getDeducedPinTypes,
  ],
  [R.equals, R.equals, R.equals, R.equals, R.equals],
  (
    project,
    maybeCurrentPatch,
    currentPatchNodes,
    connectedPins,
    deducedPinTypes
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
            project
          ),
          currentPatchNodes
        ),
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
  ],
  [R.equals, R.equals, R.equals, R.equals, R.equals],
  (nodes, links, curPatch, project, deducedPinTypes) =>
    R.compose(
      addLinksPositioning(nodes),
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
          project,
          deducedPinTypes
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

// :: Maybe PatchPath -> Patch -> Boolean
const patchEqualsToCurPatchPath = R.curry((maybeCurrentPatchPath, patch) =>
  R.compose(
    R.equals(foldMaybe('', R.identity, maybeCurrentPatchPath)),
    XP.getPatchPath
  )(patch)
);

// :: State -> [PatchSearchIndex]
export const getPatchSearchIndex = createSelector(
  [listPatches, getCurrentPatchPath],
  (patches, maybeCurPatchPath) =>
    R.compose(
      createIndexFromPatches,
      R.reject(
        R.anyPass([
          isPatchDeadTerminal,
          XP.isUtilityPatch,
          XP.isDeprecatedPatch,
          patchEqualsToCurPatchPath(maybeCurPatchPath),
        ])
      )
    )(patches)
);
