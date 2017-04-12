import R from 'ramda';
import { createSelector } from 'reselect';

import XP from 'xod-project';

import {
  addNodePositioning,
  addLinksPositioning,
  addPoints,
} from './nodeLayout';
import { PROPERTY_KIND } from './constants';
import { ENTITY, PROPERTY_TYPE } from '../editor/constants';
import {
  getSelection,
  getCurrentPatchId,
  getLinkingPin,
  getTabs,
} from '../editor/selectors';

import { createMemoizedSelector } from '../utils/selectorTools';


export const getProject = R.prop('project');
export const projectLens = R.lensProp('project');

//
// Patch
//

// :: State -> IndexedLinks
const getCurrentPatchLinks = createSelector(
  [getProject, getCurrentPatchId],
  (project, currentPatchPath) => {
    if (!currentPatchPath) return {};

    return R.compose(
      R.indexBy(R.prop('id')),
      XP.listLinks,
      R.view(XP.lensPatch(currentPatchPath))
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

// :: Project -> IntermediateNode -> IntermediateNode
const mergePinDataFromPatch = R.curry((project, node) => {
  const type = XP.getNodeType(node);

  // TODO: this will change after rename
  const curriedPinsInfo = node.pins;

  const pinDataFromPatch = R.compose(
    // TODO: add something like getPinsIndexedByKey to xod-project?
    // + see other 'indexBy's below
    R.indexBy(R.prop('key')),
    XP.listPins,
    R.view(XP.lensPatch(type))
  )(project);

  const merged = R.mergeWith(R.merge, pinDataFromPatch, curriedPinsInfo);

  return R.assoc(
    'pins',
    merged,
    node
  );
});

// :: Project -> IntermediateNode -> IntermediateNode
const addNodeLabel = R.curry((project, node) => {
  const patch = R.view(
    XP.lensPatch(XP.getNodeType(node)),
    project
  );

  const label = node.label || XP.getPatchLabel(patch) || XP.getPatchPath(patch);

  return R.assoc('label', label, node);
});

// :: State -> StrMap Node
const getCurrentPatchNodes = createSelector(
  [getProject, getCurrentPatchId],
  (project, currentPatchPath) => {
    if (!currentPatchPath) return {};

    return R.compose(
      R.indexBy(R.prop('id')),
      XP.listNodes,
      R.view(XP.lensPatch(currentPatchPath))
    )(project);
  }
);

// :: State -> StrMap RenderableNode
export const getRenderableNodes = createMemoizedSelector(
  [getProject, getCurrentPatchNodes, getConnectedPins],
  [R.T, R.equals, R.equals],
  (project, currentPatchNodes, connectedPins) =>
    R.map(
      R.compose(
        addNodePositioning,
        addNodeLabel(project),
        assocPinIsConnected(connectedPins),
        assocNodeIdToPins,
        mergePinDataFromPatch(project)
      ),
      currentPatchNodes
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
        const outputNodeId = XP.getLinkOutputNodeId(link);
        const outputPinKey = XP.getLinkOutputPinKey(link);

        return R.merge(
          link,
          {
            type: nodes[outputNodeId].pins[outputPinKey].type,
          }
        );
      })
    )(links)
);

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
  [getCurrentPatchId, getProject, getTabs],
  (currentPatchId, project, tabs) =>
    R.map(
      (tab) => {
        const patchId = tab.id;

        const label = R.compose(
          XP.getPatchLabel,
          R.view(XP.lensPatch(patchId))
        )(project);

        return R.merge(
          tab,
          {
            label,
            isActive: (currentPatchId === tab.id),
          }
        );
      },
      tabs
    )
);


//
// Inspector
//

const dereferencedSelection = createMemoizedSelector(
  [getRenderableNodes, getRenderableLinks, getSelection],
  [R.equals, R.equals, R.equals],
  (renderableNodes, renderableLinks, selection) => {
    const renderables = {
      [ENTITY.NODE]: renderableNodes,
      [ENTITY.LINK]: renderableLinks,
    };

    return R.map(
      R.compose(
        R.converge(
          R.assoc('entity'),
          [
            R.head,
            R.path(R.__, renderables),
          ]
        ),
        R.props(['entity', 'id'])
      ),
      selection
    );
  }
);

// :: String -> String
const capitalizeFirstLetter = R.converge(
  R.concat,
  [
    R.compose(
      R.toUpper,
      R.head
    ),
    R.tail,
  ]
);

// :: RenderableNode -> PropForInspector { injected, key, kind, label, type, value }
const nodePropsForInspector = R.compose( // TODO: deprecated?
  R.map(
    R.applySpec({
      kind: R.always(PROPERTY_KIND.PROP),
      key: R.head,
      type: R.always(PROPERTY_TYPE.STRING), // TODO: Fix it and get from NodeType
      label: R.compose(capitalizeFirstLetter, R.head), // TODO: Get rid of this hack
      value: R.last,
      injected: R.F,
    })
  ),
  R.toPairs,
  R.prop('properties')
);

// :: RenderableNode -> PropForInspector { injected, key, kind, label, type, value }
const nodePinsForInspector = R.compose(
  R.map(
    R.applySpec({
      kind: R.always(PROPERTY_KIND.PIN),
      key: R.prop('key'),
      type: R.prop('type'),
      label: R.prop('label'),
      value: R.prop('value'),
      injected: R.complement(R.prop('isConnected')),
    })
  ),
  R.sortBy(R.prop('index')),
  R.reject(XP.isOutputPin),
  R.values,
  R.prop('pins')
);

// :: RenderableNode -> PropForInspector[]
const extractNodeForInspector = R.converge(
  R.concat,
  [
    nodePropsForInspector,
    nodePinsForInspector,
  ]
);

// :: a -> PropForInspector[]
const extractLinkForInspector = R.always({});

// :: dereferencedSelection -> PropForInspector[]
export const dataForInspectorFromSelection = createSelector(
  dereferencedSelection,
  R.map(
    R.applySpec({
      entity: R.prop('entity'),
      id: R.prop('id'),
      props: R.ifElse(
        R.propEq('entity', ENTITY.NODE),
        extractNodeForInspector,
        extractLinkForInspector
      ),
    })
  )
);
