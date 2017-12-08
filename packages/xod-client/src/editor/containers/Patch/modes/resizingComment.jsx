import R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';

import * as XP from 'xod-project';

import { EDITOR_MODE } from '../../../constants';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';

import {
  addPoints,
  subtractPoints,
  pointToSize,
  sizeToPoint,
  snapNodeSizeToSlots,
  NODE_HEIGHT,
  SLOT_SIZE,
} from '../../../../project/nodeLayout';

import {
  getOffsetMatrix,
  bindApi,
  getMousePosition,
} from '../modeUtils';

let patchSvgRef = null;

const getDeltaPosition = api => subtractPoints(
  api.state.mousePosition,
  api.state.dragStartPosition
);

const addDeltaToSize = R.uncurryN(2)(
  deltaPosition => R.compose(
    pointToSize,
    addPoints(deltaPosition),
    sizeToPoint
  )
);

const addDeltaToCommentSizes = R.uncurryN(2)(
  deltaPosition => R.map(R.over(
    R.lensProp('size'),
    R.compose(
      R.evolve({
        width: R.max(SLOT_SIZE.WIDTH),
        height: R.max(NODE_HEIGHT),
      }),
      addDeltaToSize(deltaPosition)
    )
  ))
);

const resizingCommentMode = {
  getInitialState(props, { dragStartPosition, resizedCommentId }) {
    return {
      resizedCommentId,
      dragStartPosition,
      mousePosition: dragStartPosition,
    };
  },

  onMouseMove(api, event) {
    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);
    api.setState({ mousePosition });
  },
  onMouseUp(api) {
    const { resizedCommentId } = api.state;
    const deltaPosition = getDeltaPosition(api);

    const newSize = R.compose(
      snapNodeSizeToSlots,
      addDeltaToSize(deltaPosition),
      XP.getCommentSize,
      R.prop(resizedCommentId)
    )(api.props.comments);

    api.props.actions.resizeComment(resizedCommentId, newSize);
    api.goToMode(EDITOR_MODE.DEFAULT);
  },

  render(api) {
    const deltaPosition = getDeltaPosition(api);

    const resizedCommentIds = [api.state.resizedCommentId];

    const idleComments = R.omit(resizedCommentIds, api.props.comments);

    const resizedComments = R.compose(
      addDeltaToCommentSizes(deltaPosition),
      R.pick(resizedCommentIds)
    )(api.props.comments);

    const snappedPreviews = R.compose(
      R.map(R.compose(
        R.over(R.lensProp('size'), snapNodeSizeToSlots),
        R.pick(['size', 'position'])
      )),
      R.values
    )(resizedComments);

    return (
      <HotKeys
        className="PatchWrapper"
        handlers={{}}
      >
        <PatchSVG
          onMouseMove={bindApi(api, this.onMouseMove)}
          onMouseUp={bindApi(api, this.onMouseUp)}
          svgRef={(svg) => { patchSvgRef = svg; }}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            offset={api.props.offset}
          />
          <g transform={getOffsetMatrix(api.props.offset)}>
            <Layers.Comments
              comments={idleComments}
              selection={api.props.selection}
              onFinishEditing={api.props.actions.editComment}
            />
            <Layers.Links
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.Nodes
              nodes={api.props.nodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
            />
            <Layers.LinksOverlay
              hidden // to avoid heavy remounting
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.NodePinsOverlay
              hidden // to avoid heavy remounting
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
            />

            <Layers.SnappingPreview
              previews={snappedPreviews}
            />
            <Layers.Comments
              key="resized comment"
              areDragged
              comments={resizedComments}
              selection={api.props.selection}
              onFinishEditing={api.props.actions.editComment}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default resizingCommentMode;
