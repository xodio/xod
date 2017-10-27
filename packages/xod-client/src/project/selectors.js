import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';
import { createIndexFromPatches } from 'xod-patch-search';

import {
  addNodePositioning,
  addLinksPositioning,
  addPoints,
} from './nodeLayout';
import { SELECTION_ENTITY_TYPE, TAB_TYPES } from '../editor/constants';
import {
  getSelection,
  getCurrentPatchPath,
  getCurrentTabId,
  getLinkingPin,
  getTabs,
} from '../editor/selectors';
import { isPatchDeadTerminal } from '../project/utils';

import { createMemoizedSelector } from '../utils/selectorTools';

export const getProject = R.prop('project');
export const projectLens = R.lensProp('project');

//
// Patch
//

// :: State -> StrMap Comment
export const getCurrentPatchComments = createSelector(
  [getProject, getCurrentPatchPath],
  (project, currentPatchPath) => {
    if (!currentPatchPath) return {};

    return R.compose(
      R.indexBy(R.prop('id')),
      XP.listComments,
      XP.getPatchByPathUnsafe(currentPatchPath)
    )(project);
  }
);

// :: State -> StrMap Link
export const getCurrentPatchLinks = createSelector(
  [getProject, getCurrentPatchPath],
  (project, currentPatchPath) => {
    if (!currentPatchPath) return {};

    return R.compose(
      R.indexBy(R.prop('id')),
      XP.listLinks,
      XP.getPatchByPathUnsafe(currentPatchPath)
    )(project);
  }
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

// :: State -> StrMap Node
export const getCurrentPatchNodes = createSelector(
  [getProject, getCurrentPatchPath],
  (project, currentPatchPath) => {
    if (!currentPatchPath) return {};

    return R.compose(
      R.indexBy(R.prop('id')),
      XP.listNodes,
      XP.getPatchByPathUnsafe(currentPatchPath)
    )(project);
  }
);

// :: State -> Maybe Patch
export const getCurrentPatch = createSelector(
  [getCurrentPatchPath, getProject],
  XP.getPatchByPath
);

// :: Project -> RenderableNode -> RenderableNode
const addDeadFlag = R.curry(
  (project, renderableNode) => R.compose(
    R.assoc('dead', R.__, renderableNode),
    Maybe.isNothing,
    XP.getPatchByPath(R.__, project),
    R.prop('type')
  )(renderableNode)
);

// :: State -> StrMap RenderableNode
export const getRenderableNodes = createMemoizedSelector(
  [getProject, getCurrentPatch, getCurrentPatchNodes, getConnectedPins],
  [R.T, R.equals, R.equals, R.equals],
  (project, maybeCurrentPatch, currentPatchNodes, connectedPins) =>
    Maybe.maybe(
      {},
      currentPatch => R.map(
        R.compose(
          addDeadFlag(project),
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
// Tabs
//

// :: State -> EditorTabs
export const getPreparedTabs = createSelector(
  [getCurrentTabId, getProject, getTabs],
  (currentTabId, project, tabs) =>
    R.map(
      (tab) => {
        const patchPath = tab.patchPath;

        const label = (tab.type === TAB_TYPES.DEBUGGER) ?
          'Debugger' :
          XP.getBaseName(patchPath);

        return R.merge(
          tab,
          {
            label,
            isActive: (currentTabId === tab.id),
          }
        );
      },
      tabs
    )
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
