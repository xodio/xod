import R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';

import { EDITOR_MODE } from '../../constants';

import PatchSVG from '../../../project/components/PatchSVG';
import * as Layers from '../../../project/components/layers';

import {
  getOffsetMatrix,
  bindApi,
  getMousePosition,
} from './selecting';

let patchSvgRef = null;

const linkingMode = {
  onEnterMode(props, { mousePosition }) {
    return {
      mousePosition,
    };
  },

  onMouseMove(api, event) {
    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);

    api.setState({ mousePosition });
  },
  onPinMouseDown(api, event, nodeId, pinKey) {
    api.props.actions.linkPin(nodeId, pinKey);
    api.goToMode(EDITOR_MODE.DEFAULT);
  },
  onPinMouseUp(api, event, nodeId, pinKey) {
    const lp = api.props.linkingPin;
    const firstPinClick = !lp || (
      nodeId === lp.nodeId &&
      pinKey === lp.pinKey
    );

    if (firstPinClick) { return; }

    api.props.actions.linkPin(nodeId, pinKey);
    api.goToMode(EDITOR_MODE.DEFAULT);
  },
  onBackgroundClick(api) {
    api.props.actions.deselectAll();
    api.goToMode(EDITOR_MODE.DEFAULT);
  },

  render(api) {
    return (
      <HotKeys
        className="PatchWrapper"
      >
        <PatchSVG
          onMouseMove={bindApi(api, this.onMouseMove)}
          svgRef={(svg) => { patchSvgRef = svg; }}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            onClick={bindApi(api, this.onBackgroundClick)}
            offset={api.props.offset}
          />
          <g transform={getOffsetMatrix(api.props.offset)}>
            <Layers.IdleComments
              comments={api.props.comments}
              selection={api.props.selection}
              onFinishEditing={api.props.actions.editComment}
            />
            <Layers.Links
              links={R.values(api.props.links)}
              selection={api.props.selection}
            />
            <Layers.IdleNodes
              nodes={api.props.nodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
            />
            <Layers.LinksOverlay
              links={R.values(api.props.links)}
              selection={api.props.selection}
            />
            <Layers.NodePinsOverlay
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
              onPinMouseDown={bindApi(api, this.onPinMouseDown)}
              onPinMouseUp={bindApi(api, this.onPinMouseUp)}
            />

            <Layers.Ghosts
              mousePosition={api.state.mousePosition}
              mode={api.props.mode}
              ghostLink={api.props.ghostLink}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default linkingMode;
