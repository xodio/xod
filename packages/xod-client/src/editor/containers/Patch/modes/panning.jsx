import React from 'react';
import { HotKeys } from 'react-hotkeys';

import { TAB_TYPES } from '../../../constants';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';

import {
  addPoints,
  subtractPoints,
} from '../../../../project/nodeLayout';

import {
  getOffsetMatrix,
  bindApi,
  getMousePosition,
  isMiddleButtonPressed,
} from '../modeUtils';

let patchSvgRef = null;

const getCurrentOffset = (api) => {
  if (
    api.state.mousePosition &&
    api.state.panningStartPosition &&
    api.state.isPanning
  ) {
    return addPoints(api.props.offset, subtractPoints(
      api.state.mousePosition,
      api.state.panningStartPosition
    ));
  }

  return api.props.offset;
};

const panningMode = {
  getInitialState(props, { panningStartPosition, isPanning }) {
    const isDebugSession = (props.tabType === TAB_TYPES.DEBUGGER && props.isDebugSession);

    return {
      isPanning,
      mousePosition: null,
      panningStartPosition, // also could be null.
      // both cases are handled at the beginning of `getCurrentOffset`

      isDebugSession,
    };
  },

  onMouseDown(api, event) {
    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);

    api.setState({ isPanning: true, mousePosition, panningStartPosition: mousePosition });
  },
  onMouseMove(api, event) {
    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);

    api.setState({ mousePosition });
  },
  onMouseUp(api, event) {
    if (api.state.isPanning) {
      const offset = getCurrentOffset(api);
      api.setState({ isPanning: false });
      api.props.actions.setOffset(offset);
    }

    if (isMiddleButtonPressed(event)) {
      api.goToDefaultMode();
    }
  },
  onKeyUp(api, event) {
    if (event.key !== ' ') return;

    if (api.state.isPanning) {
      const offset = getCurrentOffset(api);
      api.setState({ isPanning: false });
      api.props.actions.setOffset(offset);
    }

    api.goToDefaultMode();
  },

  render(api) {
    const offset = getCurrentOffset(api);
    const nodeValues = api.state.isDebugSession ? api.props.nodeValues : {};

    return (
      <HotKeys
        className="PatchWrapper"
        onKeyUp={bindApi(api, this.onKeyUp)}
        handlers={{}}
      >
        <PatchSVG
          onMouseDown={bindApi(api, this.onMouseDown)}
          onMouseMove={bindApi(api, this.onMouseMove)}
          onMouseUp={bindApi(api, this.onMouseUp)}
          isInPanningMode
          isPanning={api.state.isPanning}
          svgRef={(svg) => { patchSvgRef = svg; }}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            offset={offset}
          />
          <g transform={getOffsetMatrix(offset)}>
            <Layers.Comments
              comments={api.props.comments}
              selection={api.props.selection}
              onFinishEditing={api.props.actions.editComment}
            />
            <Layers.Links
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.Nodes
              isDebugSession={api.state.isDebugSession}
              nodeValues={nodeValues}
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
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default panningMode;
