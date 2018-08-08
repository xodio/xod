import React from 'react';
import { HotKeys } from 'react-hotkeys';

import { COMMAND } from '../../../../utils/constants';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';

import { getOffsetMatrix, bindApi, getMousePosition } from '../modeUtils';

const abort = api => {
  api.props.actions.deselectAll();
  api.goToDefaultMode();
};

let patchSvgRef = null;

const linkingMode = {
  getInitialState(props, { mousePosition }) {
    return {
      mousePosition,
    };
  },

  onMouseMove(api, event) {
    const mousePosition = getMousePosition(
      patchSvgRef,
      api.props.offset,
      event
    );
    api.setState({ mousePosition });
  },
  onPinMouseDown(api, event, nodeId, pinKey) {
    api.props.actions.linkPin(nodeId, pinKey);
    api.goToDefaultMode();
  },
  onPinMouseUp(api, event, nodeId, pinKey) {
    const lp = api.props.linkingPin;
    const firstPinClick = !lp || (nodeId === lp.nodeId && pinKey === lp.pinKey);

    if (firstPinClick) {
      return;
    }

    api.props.actions.linkPin(nodeId, pinKey);
    api.goToDefaultMode();
  },
  onCreateBus(api) {
    const { nodeId, pinKey } = api.props.linkingPin;
    const node = api.props.nodes[nodeId];

    api.props.actions.addBusNode(
      api.props.patchPath,
      api.state.mousePosition,
      node,
      pinKey
    );
    api.goToDefaultMode();
  },
  onBackgroundClick: abort,
  getHotkeyHandlers(api) {
    return {
      [COMMAND.DESELECT]: () => abort(api),
      [COMMAND.MAKE_BUS]: bindApi(api, this.onCreateBus),
    };
  },
  render(api) {
    return (
      <HotKeys handlers={this.getHotkeyHandlers(api)} className="PatchWrapper">
        <PatchSVG
          onMouseMove={bindApi(api, this.onMouseMove)}
          svgRef={svg => {
            patchSvgRef = svg;
          }}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            onClick={bindApi(api, this.onBackgroundClick)}
            offset={api.props.offset}
          />
          <g transform={getOffsetMatrix(api.props.offset)}>
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
            <Layers.LinksOverlay
              links={api.props.links}
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
              mode={api.getCurrentMode()}
              ghostLink={api.props.ghostLink}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default linkingMode;
