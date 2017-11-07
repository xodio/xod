import R from 'ramda';
import * as XP from 'xod-project';
import { explodeEither } from 'xod-func-tools';

import * as AT from './actionTypes';
import { PASTE_ENTITIES } from '../editor/actionTypes';

import {
  addPoints,
  nodeSizeInSlotsToPixels,
  slotPositionToPixels,
  snapNodePositionToSlots,
} from './nodeLayout';
import { NODE_PROPERTY_KIND, NODE_PROPERTY_KEY } from './constants';

// TODO: rewrite this?
const selectNodePropertyUpdater = ({ kind, key, value }) => {
  if (kind === NODE_PROPERTY_KIND.PIN) {
    return XP.setBoundValue(key, value);
  }

  if (kind === NODE_PROPERTY_KIND.PROP) {
    if (key === NODE_PROPERTY_KEY.LABEL) {
      return XP.setNodeLabel(value);
    } else if (key === NODE_PROPERTY_KEY.DESCRIPTION) {
      return XP.setNodeDescription(value);
    }
  }

  return R.identity;
};

const updateCommentWith = (updaterFn, id, patchPath, state) => {
  const updatedComment = R.compose(
    updaterFn,
    XP.getCommentByIdUnsafe(id),
    XP.getPatchByPathUnsafe(patchPath)
  )(state);

  return R.over(
    XP.lensPatch(patchPath),
    XP.assocComment(updatedComment),
    state
  );
};

const nodePositionLens = R.lens(XP.getNodePosition, XP.setNodePosition);
const commentPositionLens = R.lens(
  XP.getCommentPosition,
  XP.setCommentPosition
);

const moveEntities = (positionLens, deltaPosition) =>
  R.map(
    R.over(
      positionLens,
      R.compose(snapNodePositionToSlots, addPoints(deltaPosition))
    )
  );

export default (state = {}, action) => {
  switch (action.type) {
    //
    // Project
    //
    case AT.PROJECT_CREATE: {
      const { name, mainPatchPath } = action.payload;

      const oldLocalPatchesPaths = R.compose(
        R.map(XP.getPatchPath),
        XP.listLocalPatches
      )(state);

      const mainPatch = XP.createPatch();

      return R.compose(
        explodeEither,
        XP.assocPatch(mainPatchPath, mainPatch),
        XP.setProjectName(name),
        XP.omitPatches(oldLocalPatchesPaths)
      )(state);
    }

    case AT.PROJECT_IMPORT: {
      const importedProject = action.payload;

      return XP.mergePatchesList(XP.listLibraryPatches(state), importedProject);
    }

    case AT.PROJECT_RENAME:
      return XP.setProjectName(action.payload, state);

    case AT.PROJECT_OPEN: {
      return action.payload;
    }

    case AT.PROJECT_UPDATE_META:
      return R.compose(
        XP.setProjectVersion(action.payload.version),
        XP.setProjectLicense(action.payload.license),
        XP.setProjectDescription(action.payload.description)
      )(state);

    case AT.PROJECT_OPEN_WORKSPACE: {
      const libs = action.payload;

      return R.compose(
        XP.mergePatchesList(libs),
        XP.setProjectName('untitled'),
        XP.createProject
      )();
    }

    //
    // Patch
    //
    case AT.PATCH_ADD: {
      const { patchPath } = action.payload;

      const patch = XP.createPatch();

      return R.compose(explodeEither, XP.assocPatch(patchPath, patch))(state);
    }

    case AT.PATCH_RENAME: {
      const { newPatchPath, oldPatchPath } = action.payload;
      return explodeEither(XP.rebasePatch(newPatchPath, oldPatchPath, state));
    }

    case AT.PATCH_DELETE: {
      const { patchPath } = action.payload;

      return XP.dissocPatch(patchPath, state);
    }

    case AT.PATCH_DESCRIPTION_UPDATE: {
      const { path, description } = action.payload;
      const patchLens = XP.lensPatch(path);
      return R.over(patchLens, XP.setPatchDescription(description), state);
    }

    //
    // Bulk actions on multiple entities
    //
    case AT.BULK_MOVE_NODES_AND_COMMENTS: {
      const { nodeIds, commentIds, deltaPosition, patchPath } = action.payload;

      const currentPatchLens = XP.lensPatch(patchPath);
      const patch = R.view(currentPatchLens, state);

      const movedNodes = R.compose(
        moveEntities(nodePositionLens, deltaPosition),
        R.map(R.flip(XP.getNodeByIdUnsafe)(patch))
      )(nodeIds);

      const movedComments = R.compose(
        moveEntities(commentPositionLens, deltaPosition),
        R.map(R.flip(XP.getCommentByIdUnsafe)(patch))
      )(commentIds);

      return R.over(
        currentPatchLens,
        R.compose(XP.upsertComments(movedComments), XP.upsertNodes(movedNodes)),
        state
      );
    }

    case AT.BULK_DELETE_ENTITIES: {
      const { linkIds, nodeIds, commentIds, patchPath } = action.payload;

      const dissocFns = R.unnest([
        R.map(XP.dissocLink, linkIds),
        R.map(XP.dissocNode, nodeIds),
        R.map(XP.dissocComment, commentIds),
      ]);

      return R.over(
        XP.lensPatch(patchPath),
        patch => R.reduce((p, fn) => fn(p), patch, dissocFns),
        state
      );
    }

    case PASTE_ENTITIES: {
      const { entities, patchPath } = action.payload;

      return R.over(
        XP.lensPatch(patchPath),
        R.compose(
          explodeEither,
          XP.upsertLinks(entities.links),
          XP.upsertComments(entities.comments),
          XP.upsertNodes(entities.nodes)
        ),
        state
      );
    }

    //
    // Node
    //
    case AT.NODE_ADD: {
      const { typeId, position, newNodeId, patchPath } = action.payload;

      const newNode = R.compose(
        R.assoc('id', newNodeId), // TODO: who should handle id generation?
        XP.createNode
      )(position, typeId);

      return R.over(
        XP.lensPatch(patchPath), // TODO: can we have a situation where patch does not exist?
        XP.assocNode(newNode),
        state
      );
    }

    case AT.NODE_UPDATE_PROPERTY: {
      const { id, patchPath } = action.payload;

      const currentPatchLens = XP.lensPatch(patchPath);

      const node = R.compose(
        XP.getNodeByIdUnsafe(id),
        R.view(currentPatchLens)
      )(state);

      return R.over(
        currentPatchLens,
        XP.assocNode(selectNodePropertyUpdater(action.payload)(node)),
        state
      );
    }

    //
    // Link
    //
    case AT.LINK_ADD: {
      const { pins, patchPath } = action.payload;

      const firstPinNodeType = R.compose(
        XP.getNodeType,
        XP.getNodeByIdUnsafe(pins[0].nodeId),
        R.view(XP.lensPatch(patchPath))
      )(state);

      const inputPinIndex = R.compose(
        R.ifElse(XP.isInputPin, R.always(0), R.always(1)),
        XP.getPinByKeyUnsafe(pins[0].pinKey),
        R.view(XP.lensPatch(firstPinNodeType))
      )(state);

      const input = pins[inputPinIndex];
      const output = pins[1 - inputPinIndex];

      const newLink = XP.createLink(
        input.pinKey,
        input.nodeId,
        output.pinKey,
        output.nodeId
      );

      return R.over(
        XP.lensPatch(patchPath),
        R.pipe(XP.assocLink(newLink), explodeEither),
        state
      );
    }

    //
    // Comment
    //
    case AT.COMMENT_ADD: {
      const { patchPath } = action.payload;

      const newComment = XP.createComment(
        slotPositionToPixels({ x: 1, y: 1 }),
        nodeSizeInSlotsToPixels({ width: 4, height: 1 }),
        'Double-click to edit comment'
      );

      return R.over(
        XP.lensPatch(patchPath),
        XP.assocComment(newComment),
        state
      );
    }

    case AT.COMMENT_RESIZE: {
      const { id, patchPath, size } = action.payload;

      return updateCommentWith(XP.setCommentSize(size), id, patchPath, state);
    }

    case AT.COMMENT_SET_CONTENT: {
      const { id, patchPath, content } = action.payload;

      return updateCommentWith(
        XP.setCommentContent(content),
        id,
        patchPath,
        state
      );
    }

    default:
      return state;
  }
};
