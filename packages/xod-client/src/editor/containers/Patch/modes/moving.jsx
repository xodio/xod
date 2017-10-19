import R from 'ramda';
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
} from '../../../../project/nodeLayout';

import { isLinkConnectedToNodeIds } from '../../../../project/utils';
import { getSelectedEntityIdsOfType } from '../../../utils';

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

const translatePositions = R.uncurryN(2)(
  deltaPosition => R.map(R.over(
    R.lensProp('position'),
    addPoints(deltaPosition)
  ))
);

const updateLinksPositions = R.uncurryN(3)(
  (draggedNodeIds, deltaPosition) => R.map(
    link => R.compose(
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
    return {
      dragStartPosition,
      mousePosition,
    };
  },

  onMouseMove(api, event) {
    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);
    api.setState({ mousePosition });
  },
  onMouseUp(api) {
    const deltaPosition = getDeltaPosition(api);
    api.props.actions.moveSelection(deltaPosition);

    api.goToDefaultMode();
  },

  render(api) {
    const deltaPosition = getDeltaPosition(api);

    const draggedNodeIds = getSelectedEntityIdsOfType(
      SELECTION_ENTITY_TYPE.NODE,
      api.props.selection
    );
    const draggedCommentIds = getSelectedEntityIdsOfType(
      SELECTION_ENTITY_TYPE.COMMENT,
      api.props.selection
    );

    const idleNodes = R.omit(draggedNodeIds, api.props.nodes);
    const idleComments = R.omit(draggedCommentIds, api.props.comments);

    const draggedNodes = R.compose(
      translatePositions(deltaPosition),
      R.pick(draggedNodeIds)
    )(api.props.nodes);
    const draggedComments = R.compose(
      translatePositions(deltaPosition),
      R.pick(draggedCommentIds)
    )(api.props.comments);

    const [draggedLinks, idleLinks] = R.compose(
      R.over(R.lensIndex(0), updateLinksPositions(draggedNodeIds, deltaPosition)),
      R.partition(isLinkConnectedToNodeIds(draggedNodeIds))
    )(api.props.links);

    const snappedPreviews = R.compose(
      R.map(R.compose(
        R.over(R.lensProp('position'), snapNodePositionToSlots),
        R.pick(['size', 'position'])
      )),
      R.concat,
    )(
      R.values(draggedNodes),
      R.values(draggedComments)
    );

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
              links={idleLinks}
              selection={api.props.selection}
            />
            <Layers.Nodes
              nodes={idleNodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
            />
            <Layers.SnappingPreview
              previews={snappedPreviews}
            />
            <Layers.Comments
              key="dragged comments"
              areDragged
              comments={draggedComments}
              selection={api.props.selection}
              onFinishEditing={api.props.actions.editComment}
            />
            <Layers.Links
              key="dragged links"
              links={draggedLinks}
              selection={api.props.selection}
            />
            <Layers.Nodes
              key="dragged nodes"
              areDragged
              nodes={draggedNodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default movingMode;
