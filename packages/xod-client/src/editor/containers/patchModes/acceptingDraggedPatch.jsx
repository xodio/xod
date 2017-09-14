import R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';

import PatchSVG from '../../../project/components/PatchSVG';
import * as Layers from '../../../project/components/layers';

import {
  getOffsetMatrix,
} from './selecting';

const acceptingDraggedPatchMode = {
  onEnterMode() {
    return {
      previewPosition: {},
    };
  },

  render(api) {
    const snappedPreviews = api.props.isPatchDraggedOver ? [{
      position: api.state.previewPosition,
      size: api.props.draggedPreviewSize,
    }] : [];

    return (
      <HotKeys className="PatchWrapper">
        <PatchSVG>
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
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

            <Layers.SnappingPreview
              previews={snappedPreviews}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default acceptingDraggedPatchMode;
