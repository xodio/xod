import * as R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';

import * as XP from 'xod-project';

import { SELECTION_ENTITY_TYPE } from '../../../constants';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';

import selectingMode from './selecting';
import { bindApi, getOffsetMatrix } from '../modeUtils';

const debuggingMode = R.merge(selectingMode, {
  onNodeDoubleClick(api, nodeId, patchPath) {
    if (patchPath === XP.NOT_IMPLEMENTED_IN_XOD_PATH) {
      api.props.actions.openImplementationEditor();
    } else if (XP.isConstantNodeType(patchPath) || XP.isTweakPath(patchPath)) {
      api.props.actions.focusBoundValue(nodeId, api.props.patchPath);
    } else {
      api.props.actions.drillDown(patchPath, nodeId);
    }
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
          onMouseMove={bindApi(api, this.onMouseMove)}
          onMouseUp={bindApi(api, this.onMouseUp)}
          svgRef={svg => api.setStorage({ patchSvgRef: svg })}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            onClick={bindApi(api, this.onBackgroundClick)}
            onDoubleClick={bindApi(api, this.onBackgroundDoubleClick)}
            onMouseDown={bindApi(api, this.onBackgroundMouseDown)}
            offset={api.getOffset()}
          />
          <g transform={getOffsetMatrix(api.getOffset())}>
            <Layers.Comments
              comments={api.props.comments}
              selection={api.props.selection}
              onMouseDown={R.partial(this.onEntityMouseDown, [
                api,
                SELECTION_ENTITY_TYPE.COMMENT,
              ])}
              onMouseUp={R.partial(this.onEntityMouseUp, [
                api,
                SELECTION_ENTITY_TYPE.COMMENT,
              ])}
              onResizeHandleMouseDown={bindApi(
                api,
                this.onCommentResizeHandleMouseDown
              )}
              onFinishEditing={api.props.actions.editComment}
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
              onMouseDown={R.partial(this.onEntityMouseDown, [
                api,
                SELECTION_ENTITY_TYPE.NODE,
              ])}
              onMouseUp={R.partial(this.onEntityMouseUp, [
                api,
                SELECTION_ENTITY_TYPE.NODE,
              ])}
              onDoubleClick={bindApi(api, this.onNodeDoubleClick)}
              onVariadicHandleDown={bindApi(api, this.onVariadicHandleDown)}
              onResizeHandleMouseDown={bindApi(
                api,
                this.onNodeResizeHandleMouseDown
              )}
            />
            <Layers.LinksOverlay
              links={api.props.links}
              selection={api.props.selection}
              onClick={bindApi(api, this.onLinkClick)}
            />
            <Layers.NodePinsOverlay
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
              onPinMouseDown={bindApi(api, this.onPinMouseDown)}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
});

export default debuggingMode;
