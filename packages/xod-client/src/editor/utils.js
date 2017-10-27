import R from 'ramda';

import * as XP from 'xod-project';

import {
  subtractPoints,
  getBoundingBoxPosition,
} from '../project/nodeLayout';

import { SELECTION_ENTITY_TYPE } from './constants';

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
// ClipboardEntities -> ClipboardEntities
const resetClipboardEntitiesPosition = (entities) => {
  const bBoxTopLeftPosition = R.compose(
    getBoundingBoxPosition,
    R.converge(
      R.concat,
      [
        R.compose(R.map(XP.getNodePosition), R.prop('nodes')),
        R.compose(R.map(XP.getCommentPosition), R.prop('comments')),
      ]
    )
  )(entities);

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
export const getEntitiesToCopy = R.uncurryN(2, patch => R.compose(
  resetClipboardEntitiesPosition,
  (selection) => {
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
  }
));

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
