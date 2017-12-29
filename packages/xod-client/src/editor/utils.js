import * as R from 'ramda';

import * as XP from 'xod-project';

import {
  addPoints,
  calcutaleNodeSizeFromPins,
  getBottomRightPosition,
  getTopLeftPosition,
  sizeToPoint,
  subtractPoints,
} from '../project/nodeLayout';

import {
  SELECTION_ENTITY_TYPE,
  PANEL_IDS,
  UPDATE_HELPBOX_POSITION,
} from './constants';

export const getTabByPatchPath = R.curry(
  (patchPath, tabs) => R.compose(
    R.find(R.propEq('patchPath', patchPath)),
    R.values,
  )(tabs)
);

export const isEntitySelected = R.curry(
  (entityType, selection, id) => R.pipe(
    R.filter(R.propEq('entity', entityType)),
    R.find(R.propEq('id', id)),
    R.isNil,
    R.not
  )(selection)
);

export const isNodeSelected = isEntitySelected(SELECTION_ENTITY_TYPE.NODE);

export const isLinkSelected = isEntitySelected(SELECTION_ENTITY_TYPE.LINK);

export const isCommentSelected = isEntitySelected(SELECTION_ENTITY_TYPE.COMMENT);

export const isPinSelected = (linkingPin, renderablePin) => (
  linkingPin &&
  linkingPin.nodeId === renderablePin.nodeId &&
  linkingPin.pinKey === renderablePin.key
);

export const getSelectedEntityIdsOfType = R.curry((entityType, selection) => R.compose(
  R.map(R.prop('id')),
  R.filter(R.propEq('entity', entityType))
)(selection));

// :: SELECTION_ENTITY_TYPE -> String -> SelectionEntity
export const createSelectionEntity = R.curry((entityType, id) => ({ entity: entityType, id }));

// :: { nodes :: [Node], links :: [Link], comments :: [Comment] } -> [SelectionEntity]
export const getNewSelection = R.compose(
  R.unnest,
  R.values,
  R.evolve({
    nodes: R.map(R.compose(
      id => ({ entity: SELECTION_ENTITY_TYPE.NODE, id }),
      XP.getNodeId
    )),
    comments: R.map(R.compose(
      id => ({ entity: SELECTION_ENTITY_TYPE.COMMENT, id }),
      XP.getCommentId
    )),
    links: R.map(R.compose(
      id => ({ entity: SELECTION_ENTITY_TYPE.LINK, id }),
      XP.getLinkId
    )),
  })
);

// :: ClipboardEntities -> Position
export const getBBoxTopLeftPosition = R.compose(
  getTopLeftPosition,
  R.converge(
    R.concat,
    [
      R.compose(R.map(XP.getNodePosition), R.prop('nodes')),
      R.compose(R.map(XP.getCommentPosition), R.prop('comments')),
    ]
  )
);

// :: Patch -> Project -> Node -> Size
const getNodeSize = R.curry((currentPatch, project, node) => R.compose(
  calcutaleNodeSizeFromPins,
  R.values,
  XP.getPinsForNode
)(node, currentPatch, project));

const getNodeBottomRightPosition = R.curry((currentPatch, project, node) =>
  R.converge(
    addPoints,
    [
      XP.getNodePosition,
      R.pipe(getNodeSize(currentPatch, project), sizeToPoint),
    ]
  )(node)
);

const getCommentBottomRightPosition = R.converge(
  addPoints,
  [
    XP.getCommentPosition,
    R.pipe(XP.getCommentSize, sizeToPoint),
  ]
);

// :: Patch -> Projct -> ClipboardEntities -> Position
export const getBBoxBottomRightPosition = R.curry((currentPatch, project, entities) =>
  R.compose(
    getBottomRightPosition,
    R.converge(
      R.concat,
      [
        R.compose(
          R.map(getNodeBottomRightPosition(currentPatch, project)),
          R.prop('nodes')
        ),
        R.compose(
          R.map(getCommentBottomRightPosition),
          R.prop('comments')
        ),
      ]
    )
  )(entities)
);

// :: ClipboardEntities -> Position
export const getBoundingBoxSize = R.curry((currentPatch, project, entities) =>
  R.converge(
    subtractPoints,
    [
      getBBoxBottomRightPosition(currentPatch, project),
      getBBoxTopLeftPosition,
    ]
  )(entities)
);

/*
  Make this point (0,0)
  |
  v
  X...........+---+
  .           |   |
  .           +-o-+
  .             |
  .   +-o---o---o-+
  .   |           |
  .   +-o---------+
  .
  +-----------------+
  | // some comment |
  +-----------------+
*/
// :: ClipboardEntities -> ClipboardEntities
export const resetClipboardEntitiesPosition = (entities) => {
  const bBoxTopLeftPosition = getBBoxTopLeftPosition(entities);

  // TODO: better name
  const resetPosition = R.flip(subtractPoints)(bBoxTopLeftPosition);

  return R.evolve({
    nodes: R.map(R.over(
      R.lens(XP.getNodePosition, XP.setNodePosition),
      resetPosition
    )),
    comments: R.map(R.over(
      R.lens(XP.getCommentPosition, XP.setCommentPosition),
      resetPosition
    )),
  })(entities);
};

// :: Patch -> Selection -> ClipboardEntities
export const getEntitiesToCopy = R.curry((patch, selection) => {
  const nodeIds = getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection);
  const nodes = R.map(R.flip(XP.getNodeByIdUnsafe)(patch), nodeIds);

  const selectedNodeIdPairs = R.xprod(nodeIds, nodeIds);
  // we completely ignore what links are selected and just
  // copy all the links between selected nodes
  const links = R.compose(
    R.filter((link) => {
      const linkNodeIds = XP.getLinkNodeIds(link);
      return R.contains(linkNodeIds, selectedNodeIdPairs);
    }),
    XP.listLinks
  )(patch);

  const comments = R.compose(
    R.map(R.flip(XP.getCommentByIdUnsafe)(patch)),
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT)
  )(selection);

  return {
    nodes,
    links,
    comments,
  };
});

// before insertion
export const regenerateIds = (entities) => {
  // { oldId: newId }
  const nodeIdReplacements = R.compose(
    R.converge(
      R.zipObj,
      [
        R.identity,
        R.map(XP.generateId),
      ]
    ),
    R.map(XP.getNodeId),
    R.prop('nodes')
  )(entities);

  const getReplacementNodeId = R.flip(R.prop)(nodeIdReplacements);

  return R.evolve({
    nodes: R.map(R.over(
      R.lensProp('id'),
      getReplacementNodeId
    )),
    // TODO: it's quite tedious to do this with current xod-project API
    //       bring back set...Id functions?
    links: R.map(R.evolve({
      output: { nodeId: getReplacementNodeId },
      input: { nodeId: getReplacementNodeId },
      id: XP.generateId,
    })),
    comments: R.map(R.over(
      R.lensProp('id'),
      XP.generateId
    )),
  })(entities);
};

// =============================================================================
//
// Sidebar utils
//
// =============================================================================

// loading panel settings from localStorage
export const loadPanelSettings = () => R.compose(
  R.reject(R.isNil),
  R.map(panelId => R.compose(
    R.tryCatch(
      JSON.parse.bind(JSON),
      () => {
        // remove broken item from localStorage
        window.localStorage.removeItem(`Sidebar.${panelId}`);
        // and return null to be filtered
        return null;
      }
    ),
    () => window.localStorage.getItem(`Sidebar.${panelId}`)
  )()),
)(PANEL_IDS);

// for components
export const sidebarPanelRenderer = (panelId, renderFn) => [
  R.propEq(0, panelId),
  R.compose(renderFn, R.nth(1)),
];

// :: [PANEL_IDS, PanelSettings] -> [PANEL_IDS, PanelSettings]
export const filterMaximized = R.filter(R.compose(
  R.prop('maximized'),
  R.nth(1)
));

export const getPanelsBySidebarId = (id, panels) => R.compose(
  R.sortBy(R.path([1, 'index'])),
  R.toPairs,
  R.filter(R.propEq('sidebar', id))
)(panels);

export const getMaximizedPanelsBySidebarId = R.compose(
  filterMaximized,
  getPanelsBySidebarId
);

const calculateHelpboxPosition = (container, item) => {
  const scrollTop = container.scrollTop;
  const height = container.offsetHeight;
  const viewBottom = scrollTop + height;

  const elHeight = item.offsetHeight;
  const elTop = item.offsetTop;
  const elBottom = elHeight + elTop;
  const elVisible = (
    (elBottom <= viewBottom) && elTop >= scrollTop
  );
  const elBox = item.getClientRects()[0];

  return {
    isVisible: elVisible,
    top: Math.ceil(elBox.top),
    left: Math.ceil(elBox.left),
    right: Math.ceil(elBox.right),
  };
};

export const triggerUpdateHelpboxPositionViaProjectBrowser = (event) => {
  const container = document.getElementById('ProjectBrowser').getElementsByClassName('inner-container')[0];
  const selectedElement = (event && event.type === 'click')
    ? event.target.closest('.PatchGroupItem')
    : container.getElementsByClassName('isSelected')[0];

  if (container && selectedElement) {
    window.dispatchEvent(
      new window.CustomEvent(
        UPDATE_HELPBOX_POSITION,
        { detail: calculateHelpboxPosition(container, selectedElement) }
      )
    );
  }
};

export const triggerUpdateHelpboxPositionViaSuggester = () => {
  const suggester = document.getElementById('Suggester');
  if (!suggester) return;
  const container = suggester.getElementsByClassName('inner-container')[0];
  const item = suggester.getElementsByClassName('is-highlighted')[0];

  if (container && item) {
    window.dispatchEvent(
      new window.CustomEvent(
        UPDATE_HELPBOX_POSITION,
        { detail: calculateHelpboxPosition(container, item) }
      )
    );
  }
};
