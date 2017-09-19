import React from 'react';
import { HotKeys } from 'react-hotkeys';

import { EDITOR_MODE } from '../../../constants';

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
    return {
      isPanning,
      mousePosition: null,
      panningStartPosition, // also could be null.
      // both cases are handled at the beginning of `getCurrentOffset`
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
      api.goToMode(EDITOR_MODE.DEFAULT);
    }
  },
  onKeyUp(api, event) {
    if (event.key !== ' ') return;

    if (api.state.isPanning) {
      const offset = getCurrentOffset(api);
      api.setState({ isPanning: false });
      api.props.actions.setOffset(offset);
    }

    api.goToMode(EDITOR_MODE.DEFAULT);
  },

  render(api) {
    const offset = getCurrentOffset(api);

    return (
      <HotKeys
        className="PatchWrapper"
        onKeyUp={bindApi(api, this.onKeyUp)}
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
              nodes={api.props.nodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default panningMode;
