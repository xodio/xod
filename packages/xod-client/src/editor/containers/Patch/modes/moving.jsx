import * as R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';

import * as XP from 'xod-project';

import { SELECTION_ENTITY_TYPE } from '../../../constants';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';

import {
  addPoints,
  subtractPoints,
  snapNodePositionToSlots,
  PIN_RADIUS_WITH_OUTER_STROKE,
} from '../../../../project/nodeLayout';

import { isLinkConnectedToNodeIds } from '../../../../project/utils';
import { getSelectedEntityIdsOfType } from '../../../utils';
import { changeLineLength } from '../../../../utils/vectors';

import { getOffsetMatrix, bindApi, getMousePosition } from '../modeUtils';

let patchSvgRef = null;

const getDeltaPosition = api =>
  subtractPoints(api.state.mousePosition, api.state.dragStartPosition);

const getSnappedPreviews = (draggedNodes, draggedComments, deltaPosition) =>
  R.compose(
    R.map(
      R.compose(
        R.over(
          R.lensProp('position'),
          R.compose(snapNodePositionToSlots, addPoints(deltaPosition))
        ),
        R.pick(['size', 'position'])
      )
    ),
    R.concat
  )(R.values(draggedNodes), R.values(draggedComments));

const updateLinksPositions = R.uncurryN(3)((draggedNodeIds, deltaPosition) =>
  R.map(link =>
    R.compose(
      R.over(
        R.lensProp('to'),
        R.when(
          () => R.contains(XP.getLinkOutputNodeId(link), draggedNodeIds),
          addPoints(deltaPosition)
        )
      ),
      R.over(
        R.lensProp('from'),
        R.when(
          () => R.contains(XP.getLinkInputNodeId(link), draggedNodeIds),
          addPoints(deltaPosition)
        )
      )
    )(link)
  )
);

const movingMode = {
  getInitialState(props, { mousePosition, dragStartPosition }) {
    const draggedNodeIds = getSelectedEntityIdsOfType(
      SELECTION_ENTITY_TYPE.NODE,
      props.selection
    );
    const draggedCommentIds = getSelectedEntityIdsOfType(
      SELECTION_ENTITY_TYPE.COMMENT,
      props.selection
    );

    // performance optimization:
    // hide instead of unmounting and then remounting again
    const idleNodes = R.reduce(
      (nodes, nodeId) => R.assocPath([nodeId, 'hidden'], true, nodes),
      props.nodes,
      draggedNodeIds
    );
    const idleComments = R.reduce(
      (comments, commentId) =>
        R.assocPath([commentId, 'hidden'], true, comments),
      props.comments,
      draggedCommentIds
    );

    const draggedNodes = R.pick(draggedNodeIds, props.nodes);
    const draggedComments = R.pick(draggedCommentIds, props.comments);

    return {
      draggedNodeIds,
      idleNodes,
      idleComments,
      draggedNodes,
      draggedComments,
      dragStartPosition,
      mousePosition,
    };
  },

  onMouseMove(api, event) {
    const mousePosition = getMousePosition(patchSvgRef, api.getOffset(), event);
    api.setState({ mousePosition });
  },
  onMouseUp(api) {
    const deltaPosition = getDeltaPosition(api);
    api.props.actions.moveSelection(deltaPosition);

    api.goToDefaultMode();
  },

  render(api) {
    const {
      draggedNodeIds,
      draggedNodes,
      draggedComments,
      idleNodes,
      idleComments,
    } = api.state;

    const deltaPosition = getDeltaPosition(api);

    const [draggedLinks, idleLinks] = R.compose(
      R.over(
        R.lensIndex(0),
        updateLinksPositions(draggedNodeIds, deltaPosition)
      ),
      R.partition(isLinkConnectedToNodeIds(draggedNodeIds))
    )(api.props.links);

    // We have to shorten dragged links to avoid overlapping
    // Pins with ending of the Link, cause it became ugly
    // when User drags Link connected to the variadic Pin,
    // that contains "dots" symbol inside it.
    const shortenedDraggedLinks = R.map(link =>
      R.compose(
        R.assoc('from', R.__, link),
        R.converge(changeLineLength(R.negate(PIN_RADIUS_WITH_OUTER_STROKE)), [
          R.prop('to'),
          R.prop('from'),
        ])
      )(link)
    )(draggedLinks);

    const snappedPreviews = getSnappedPreviews(
      draggedNodes,
      draggedComments,
      deltaPosition
    );

    const draggedEntitiesStyle = {
      transform: `translate(${deltaPosition.x}px, ${deltaPosition.y}px)`,
    };

    return (
      <HotKeys className="PatchWrapper" handlers={{}}>
        <PatchSVG
          onMouseMove={bindApi(api, this.onMouseMove)}
          onMouseUp={bindApi(api, this.onMouseUp)}
          svgRef={svg => {
            patchSvgRef = svg;
          }}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            offset={api.getOffset()}
          />
          <g transform={getOffsetMatrix(api.getOffset())}>
            <Layers.Comments
              comments={idleComments}
              selection={api.props.selection}
              onFinishEditing={api.props.actions.editComment}
            />
            <Layers.Links links={idleLinks} selection={api.props.selection} />
            <Layers.Nodes
              nodes={idleNodes}
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

            <Layers.SnappingPreview previews={snappedPreviews} />
            <g style={draggedEntitiesStyle}>
              <Layers.Comments
                key="dragged comments"
                areDragged
                comments={draggedComments}
                selection={api.props.selection}
                onFinishEditing={api.props.actions.editComment}
              />
            </g>
            <Layers.Links
              key="dragged links"
              links={shortenedDraggedLinks}
              selection={api.props.selection}
              isDragged
            />
            <g style={draggedEntitiesStyle}>
              <Layers.Nodes
                key="dragged nodes"
                areDragged
                nodes={draggedNodes}
                selection={api.props.selection}
                linkingPin={api.props.linkingPin}
              />
            </g>
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default movingMode;
