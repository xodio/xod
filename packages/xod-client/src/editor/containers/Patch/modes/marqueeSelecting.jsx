import R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';
import className from 'classnames';

import { COMMAND } from '../../../../utils/constants';
import { getNewSelection } from '../../../utils';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';

import {
  bindApi,
  getMousePosition,
  getOffsetMatrix,
} from '../modeUtils';

import {
  isInclusiveSelection,
  getSelectionBox,
  filterLinksByBox,
  filterLinksByInclusiveBox,
  filterNodesByInclusiveBox,
  filterNodesByBox,
} from '../../../marqueeGeometry';

// =============================================================================
//
// Component Utils
//
// =============================================================================

const isSelectionModifierPressed = event => event.metaKey || event.ctrlKey;

// New, dependent on arguments
const findSelectedItems = (api, startPos, endPos) => {
  const inclusive = isInclusiveSelection(startPos, endPos);
  const selectionBox = getSelectionBox(startPos, endPos);

  const filterLinksFn = (
    inclusive ?
    filterLinksByInclusiveBox :
    filterLinksByBox
  )(selectionBox);
  const filterNodesFn = (
    inclusive ?
    filterNodesByInclusiveBox :
    filterNodesByBox
  )(selectionBox);

  return R.compose(
    R.evolve({
      links: filterLinksFn,
      nodes: filterNodesFn,
      comments: filterNodesFn,
    }),
    R.map(R.values),
    R.pick(['links', 'nodes', 'comments'])
  )(api.props);
};

const getComputedSelection = (api, startPos, endPos, event) => {
  const oldSelection = api.props.selection;
  const newSelection = getNewSelection(findSelectedItems(api, startPos, endPos));

  return (
    !isSelectionModifierPressed(event) ?
    newSelection :
    R.symmetricDifference(oldSelection, newSelection)
  );
};

// =============================================================================
//
// Marquee selection mode
//
// =============================================================================

let patchSvgRef = null;

const marqueeSelectingMode = {
  getInitialState(props, { mouseStartPosition, mousePosition }) {
    return {
      isMouseDownOnBackground: true,
      mouseStartPosition,
      mousePosition,
      selection: props.selection,
    };
  },
  onMouseMove(api, event) {
    const { mouseStartPosition } = api.state;
    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);
    api.setState({
      mousePosition,
      selection: getComputedSelection(api, mouseStartPosition, mousePosition, event),
    });
  },
  onMouseUp(api, event) {
    const { mouseStartPosition, mousePosition } = api.state;
    api.props.actions.setSelection(
      getComputedSelection(api, mouseStartPosition, mousePosition, event)
    );
    api.goToDefaultMode();
  },
  onKeyDownOrKeyUp(api, event) {
    const { mouseStartPosition, mousePosition, selection: oldSelection } = api.state;
    const newSelection = getComputedSelection(api, mouseStartPosition, mousePosition, event);

    if (R.equals(oldSelection, newSelection)) return;

    api.setState({
      selection: newSelection,
    });
  },
  getHotkeyHandlers(api) {
    return {
      [COMMAND.DESELECT]: api.goToDefaultMode,
    };
  },
  renderMaquee(api) {
    const { mouseStartPosition, mousePosition } = api.state;
    const { from, width, height } = getSelectionBox(mouseStartPosition, mousePosition);
    const inclusiveSelection = isInclusiveSelection(mouseStartPosition, mousePosition);
    const cls = className('MarqueeSelection', {
      'is-inclusive': inclusiveSelection,
    });

    return (
      <rect
        className={cls}
        x={from.x}
        y={from.y}
        width={width}
        height={height}
      />
    );
  },
  // BlockingLayer blocks patch entities from mouse events
  // The most important in this mode: it disables hover effects
  renderBlockingLayer(api) {
    return (
      <rect
        x="0"
        y="0"
        width={api.props.size.width}
        height={api.props.size.height}
        fill="transparent"
      />
    );
  },
  render(api) {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers(api)}
        className="PatchWrapper"
        onKeyDown={bindApi(api, this.onKeyDownOrKeyUp)}
        onKeyUp={bindApi(api, this.onKeyDownOrKeyUp)}
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
              comments={api.props.comments}
              selection={api.state.selection}
            />
            <Layers.Links
              links={api.props.links}
              selection={api.state.selection}
            />
            <Layers.Nodes
              nodes={api.props.nodes}
              selection={api.state.selection}
              linkingPin={api.props.linkingPin}
            />
            <Layers.LinksOverlay
              links={api.props.links}
              selection={api.state.selection}
            />
            <Layers.NodePinsOverlay
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
            />
            {this.renderMaquee(api)}
          </g>
          {this.renderBlockingLayer(api)}
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default marqueeSelectingMode;
