import R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';

import { EDITOR_MODE, SELECTION_ENTITY_TYPE } from '../../../constants';
import { isEntitySelected } from '../../../utils';
import { isInput } from '../../../../utils/browser';
import { COMMAND } from '../../../../utils/constants';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';

import {
  bindApi,
  getMousePosition,
  getOffsetMatrix,
  isMiddleButtonPressed,
} from '../modeUtils';

const isSelectionModifierPressed = event => event.metaKey || event.ctrlKey;

let patchSvgRef = null;

const debuggingMode = {
  getInitialState() {
    return {};
  },

  onEntityMouseDown({ props, setState }, entityType, event, entityId) {
    if (isMiddleButtonPressed(event)) return;

    if (isEntitySelected(entityType, props.selection, entityId)) {
      if (isSelectionModifierPressed(event)) {
        props.actions.deselectEntity(entityType, entityId);
        setState({ isMouseDownOnMovableObject: false });
      }
    } else if (isSelectionModifierPressed(event)) {
      props.actions.addEntityToSelection(entityType, entityId);
    } else {
      props.actions.selectEntity(entityType, entityId);
    }
  },
  onEntityMouseUp({ props, setState }, entityType, event, entityId) {
    if (isMiddleButtonPressed(event)) return;

    if (
      !isSelectionModifierPressed(event) &&
      isEntitySelected(entityType, props.selection, entityId) &&
      props.selection.length > 1
    ) {
      props.actions.selectEntity(entityType, entityId);
    }
  },

  onMouseDown(api, event) {
    if (!isMiddleButtonPressed(event)) return;

    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);
    api.goToMode(EDITOR_MODE.PANNING, { isPanning: true, panningStartPosition: mousePosition });
  },
  onKeyDown(api, event) {
    if (isInput(event)) return;

    if (event.key === ' ' && !api.state.isMouseDownOnMovableObject) {
      api.goToMode(EDITOR_MODE.PANNING, { isPanning: false });
    }
  },
  onBackgroundClick(api, event) {
    // to prevent misclicks when selecting multiple entities
    if (isSelectionModifierPressed(event)) return;

    api.props.actions.deselectAll();
  },
  onNodeDoubleClick(api, nodeId, patchPath) {
    api.props.actions.drillDown(patchPath, nodeId);
  },
  getHotkeyHandlers(api) {
    return {
      [COMMAND.DESELECT]: api.props.actions.deselectAll,
    };
  },
  render(api) {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers(api)}
        className="PatchWrapper"
        onKeyDown={bindApi(api, this.onKeyDown)}
      >
        <PatchSVG
          onMouseDown={bindApi(api, this.onMouseDown)}
          svgRef={(svg) => { patchSvgRef = svg; }}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            offset={api.props.offset}
            onClick={bindApi(api, this.onBackgroundClick)}
          />
          <g transform={getOffsetMatrix(api.props.offset)}>
            <Layers.Comments
              comments={api.props.comments}
              selection={api.props.selection}
              onMouseDown={R.partial(this.onEntityMouseDown, [api, SELECTION_ENTITY_TYPE.COMMENT])}
              onMouseUp={R.partial(this.onEntityMouseUp, [api, SELECTION_ENTITY_TYPE.COMMENT])}
            />
            <Layers.Links
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.Nodes
              isDebugSession={api.props.isDebugSession}
              nodeValues={api.props.nodeValues}
              nodes={api.props.nodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
              onMouseDown={R.partial(this.onEntityMouseDown, [api, SELECTION_ENTITY_TYPE.NODE])}
              onMouseUp={R.partial(this.onEntityMouseUp, [api, SELECTION_ENTITY_TYPE.NODE])}
              onDoubleClick={bindApi(api, this.onNodeDoubleClick)}
            />
            <Layers.LinksOverlay
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.NodePinsOverlay
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default debuggingMode;
