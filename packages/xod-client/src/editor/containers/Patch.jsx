import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';
import { bindActionCreators } from 'redux';

import * as EditorActions from '../actions';
import * as EditorSelectors from '../selectors';
import { EDITOR_MODE, DRAGGED_ENTITY_TYPE } from '../constants';

import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import { RenderableLink, RenderableNode, RenderableComment } from '../../project/types';

import sanctuaryPropType from '../../utils/sanctuaryPropType';

import {
  snapNodePositionToSlots,
} from '../../project/nodeLayout';

import selectingMode from './patchModes/selecting';
import linkingMode from './patchModes/linking';
import panningMode from './patchModes/panning';
import movingMode from './patchModes/moving';
import resizingCommentMode from './patchModes/resizingComment';
import acceptingDraggedPatchMode from './patchModes/acceptindDraggedPatch';

const getDraggedPatchPosition = (props, monitor, component) => {
  const globalDropPosition = monitor.getClientOffset();
  const bbox = component.rootRef.getBoundingClientRect();

  return snapNodePositionToSlots({
    x: globalDropPosition.x - bbox.left - props.offset.x,
    y: globalDropPosition.y - bbox.top - props.offset.y,
  });
};

const dropTarget = {
  drop(props, monitor, component) {
    if (!component.rootRef) return;

    const newNodePosition = getDraggedPatchPosition(props, monitor, component);

    const { patchPath } = monitor.getItem();

    props.actions.addNode(
      patchPath,
      newNodePosition,
      props.patchPath
    );
    props.actions.setMode(EDITOR_MODE.DEFAULT);
  },
  hover(props, monitor, component) { // TODO: performance
    if (!component.rootRef) return;

    component.setModeState(
      EDITOR_MODE.ACCEPTING_DRAGGED_PATCH,
      { previewPosition: getDraggedPatchPosition(props, monitor, component) }
    );
  },
  canDrop(props, monitor) {
    const { patchPath } = monitor.getItem();
    return patchPath !== props.patchPath;
  },
};

const MODE_HANDLERS = {
  [EDITOR_MODE.DEFAULT]: selectingMode,
  [EDITOR_MODE.LINKING]: linkingMode,
  [EDITOR_MODE.PANNING]: panningMode,
  [EDITOR_MODE.MOVING_SELECTION]: movingMode,
  [EDITOR_MODE.RESIZING_SELECTION]: resizingCommentMode,
  [EDITOR_MODE.ACCEPTING_DRAGGED_PATCH]: acceptingDraggedPatchMode,
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modeSpecificState: {
        [props.mode]: MODE_HANDLERS[props.mode].onEnterMode(props),
      },
    };

    this.goToMode = this.goToMode.bind(this);
    this.getModeState = this.getModeState.bind(this);
    this.setModeState = this.setModeState.bind(this);
  }

  getApi(mode) {
    return {
      props: this.props,
      state: this.getModeState(mode),
      setState: R.partial(this.setModeState, [mode]),
      goToMode: this.goToMode,
    };
  }

  getModeState(mode) {
    return R.pathOr({}, ['modeSpecificState', mode], this.state);
  }

  setModeState(mode, newModeSpecificState, callback) {
    // TODO: suport passing state updater fn instead of object?

    this.setState(
      R.over(
        R.lensPath(['modeSpecificState', mode]),
        R.compose(
          R.mergeDeepLeft(newModeSpecificState),
          R.defaultTo({})
        )
      ),
      callback
    );
  }

  goToMode(newMode, payload) {
    const newModeState = MODE_HANDLERS[newMode].onEnterMode(this.props, payload);
    this.setModeState(newMode, newModeState);
    this.props.actions.setMode(newMode);
  }

  render() {
    const { mode } = this.props;

    return this.props.connectDropTarget(
      <div ref={(r) => { this.rootRef = r; }}>
        {MODE_HANDLERS[mode].render(this.getApi(mode))}
      </div>
    );
  }
}

Patch.propTypes = {
  /* eslint-disable react/no-unused-prop-types */
  size: PropTypes.any.isRequired,
  actions: PropTypes.objectOf(PropTypes.func),
  nodes: sanctuaryPropType($.StrMap(RenderableNode)),
  links: sanctuaryPropType($.StrMap(RenderableLink)),
  comments: sanctuaryPropType($.StrMap(RenderableComment)),
  linkingPin: PropTypes.object,
  selection: PropTypes.array,
  patchPath: PropTypes.string,
  mode: PropTypes.oneOf(R.values(EDITOR_MODE)),
  ghostLink: PropTypes.any,
  offset: PropTypes.object,
  onDoubleClick: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  /* eslint-enable react/no-unused-prop-types */
};

const mapStateToProps = R.applySpec({
  nodes: ProjectSelectors.getRenderableNodes,
  links: ProjectSelectors.getRenderableLinks,
  comments: ProjectSelectors.getRenderableComments,
  selection: EditorSelectors.getSelection,
  linkingPin: EditorSelectors.getLinkingPin,
  patchPath: EditorSelectors.getCurrentPatchPath,
  mode: EditorSelectors.getMode,
  ghostLink: ProjectSelectors.getLinkGhost,
  offset: EditorSelectors.getCurrentPatchOffset,
  draggedPreviewSize: EditorSelectors.getDraggedPreviewSize,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    addNode: ProjectActions.addNode,
    editComment: ProjectActions.editComment,
    moveSelection: EditorActions.moveSelection,
    resizeComment: ProjectActions.resizeComment,
    deselectAll: EditorActions.deselectAll,
    deleteSelection: EditorActions.deleteSelection,
    selectLink: EditorActions.selectLink,
    selectNode: EditorActions.selectNode,
    selectComment: EditorActions.selectComment,
    selectEntity: EditorActions.selectEntity,
    addEntityToSelection: EditorActions.addEntityToSelection,
    doPinSelection: EditorActions.doPinSelection,
    linkPin: EditorActions.linkPin,
    setMode: EditorActions.setMode,
    setOffset: EditorActions.setCurrentPatchOffset,
  }, dispatch),
});

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  DropTarget( // eslint-disable-line new-cap
    DRAGGED_ENTITY_TYPE.PATCH,
    dropTarget,
    (conn, monitor) => ({
      connectDropTarget: conn.dropTarget(),
      isPatchDraggedOver: monitor.isOver(),
    })
  )
)(Patch);
