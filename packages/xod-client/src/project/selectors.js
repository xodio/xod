import R from 'ramda';
import { createSelector } from 'reselect';

import XP from 'xod-project';

import {
  addNodesPositioning,
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


export const getProjectV2 = R.prop('projectV2');


//
// Patch
//

// :: State -> IndexedLinks
const getCurrentPatchLinks = createSelector(
  [getProjectV2, getCurrentPatchId],
  (projectV2, currentPatchPath) => {
    if (!currentPatchPath) return {};

    return R.compose(
      R.indexBy(R.prop('id')),
      XP.listLinks,
      R.view(XP.lensPatch(currentPatchPath))
    )(projectV2);
  }
);

// :: IndexedLinks -> IntermediateNode -> IntermediateNode
const assocPinIsConnected = R.curry((links, node) =>
  R.over(
    R.lensProp('pins'),
    R.map(pin =>
      R.assoc(
        'isConnected',
        R.compose(
          R.any(
            R.either(
              R.both(
                XP.isLinkInputNodeIdEquals(node.id),
                XP.isLinkInputPinKeyEquals(pin.key)
              ),
              R.both(
                XP.isLinkOutputNodeIdEquals(node.id),
                XP.isLinkOutputPinKeyEquals(pin.key)
              )
            )
          ),
          R.values
        )(links),
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
const mergePinDataFromPatch = R.curry((projectV2, node) => {
  const type = XP.getNodeType(node);

  // TODO: this will change after rename
  const curriedPinsInfo = node.pins;

  const pinDataFromPatch = R.compose(
    // TODO: add something like getPinsIndexedByKey to xod-project?
    // + see other 'indexBy's below
    R.indexBy(R.prop('key')),
    XP.listPins,
    R.view(XP.lensPatch(type))
  )(projectV2);

  const merged = R.mergeWith(R.merge, pinDataFromPatch, curriedPinsInfo);

  return R.assoc(
    'pins',
    merged,
    node
  );
});

// :: Project -> IntermediateNode -> IntermediateNode
const addNodeLabel = R.curry((projectV2, node) => {
  const patch = R.view(
    XP.lensPatch(XP.getNodeType(node)),
    projectV2
  );

  const label = node.label || XP.getPatchLabel(patch) || XP.getPatchPath(patch);

  return R.assoc('label', label, node);
});

// :: State -> StrMap Node
const getCurrentPatchNodes = createSelector(
  [getProjectV2, getCurrentPatchId],
  (projectV2, currentPatchPath) => {
    if (!currentPatchPath) return {};

    return R.compose(
      R.indexBy(R.prop('id')),
      XP.listNodes,
      R.view(XP.lensPatch(currentPatchPath))
    )(projectV2);
  }
);

// :: State -> StrMap RenderableNode
export const getRenderableNodes = createMemoizedSelector(
  [getProjectV2, getCurrentPatchNodes, getCurrentPatchLinks],
  [R.T, R.equals, R.equals],
  (projectV2, currentPatchNodes, currentPatchLinks) =>
    R.compose(
      addNodesPositioning,
      R.map(
        R.compose(
          addNodeLabel(projectV2),
          assocPinIsConnected(currentPatchLinks),
          assocNodeIdToPins,
          mergePinDataFromPatch(projectV2)
        )
      )
    )(currentPatchNodes)
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
        const inputPinKey = XP.getLinkInputPinKey(link);

        return R.merge(
          link,
          {
            type: nodes[inputNodeId].pins[inputPinKey].type,
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
  [getCurrentPatchId, getProjectV2, getTabs],
  (currentPatchId, projectV2, tabs) =>
    R.compose(
      R.indexBy(R.prop('id')),
      R.map((tab) => {
        const patchId = tab.id;

        const label = R.compose(
          XP.getPatchLabel,
          R.view(XP.lensPatch(patchId))
        )(projectV2);

        return R.merge(
          tab,
          {
            label,
            isActive: (currentPatchId === tab.id),
          }
        );
      }),
      R.values
    )(tabs)
);


//
// Inspector
//

const dereferencedSelection = createSelector(
  [getRenderableNodes, getRenderableLinks, getSelection],
  (derefNodes, derefLinks, selection) => {
    const dereferenced = {
      [ENTITY.NODE]: derefNodes,
      [ENTITY.LINK]: derefLinks,
    };

    return R.map(
      R.compose(
        R.converge(
          R.assoc('entity'),
          [
            R.head,
            R.path(R.__, dereferenced),
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
