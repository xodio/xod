import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as EditorActions from '../../actions';
import * as ProjectActions from '../../../project/actions';

import * as EditorSelectors from '../../selectors';
import * as ProjectSelectors from '../../../project/selectors';

import { RenderableLink, RenderableNode, RenderableComment } from '../../../project/types';
import sanctuaryPropType from '../../../utils/sanctuaryPropType';

import dropTarget from './dropTarget';

import { EDITOR_MODE } from '../../constants';

import selectingMode from './modes/selecting';
import linkingMode from './modes/linking';
import panningMode from './modes/panning';
import movingMode from './modes/moving';
import resizingCommentMode from './modes/resizingComment';
import acceptingDraggedPatchMode from './modes/acceptingDraggedPatch';

const MODE_HANDLERS = {
  [EDITOR_MODE.DEFAULT]: selectingMode,
  [EDITOR_MODE.LINKING]: linkingMode,
  [EDITOR_MODE.PANNING]: panningMode,
  [EDITOR_MODE.MOVING_SELECTION]: movingMode,
  [EDITOR_MODE.RESIZING_COMMENT]: resizingCommentMode,
  [EDITOR_MODE.ACCEPTING_DRAGGED_PATCH]: acceptingDraggedPatchMode,
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modeSpecificState: {
        [props.mode]: MODE_HANDLERS[props.mode].getInitialState(props),
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
    const newModeState = MODE_HANDLERS[newMode].getInitialState(this.props, payload);
    this.setModeState(newMode, newModeState);
    this.props.actions.setMode(newMode);
  }

  render() {
    const { mode } = this.props;

    return this.props.connectDropTarget(
      <div ref={(r) => { this.dropTargetRootRef = r; }}>
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
    deselectEntity: EditorActions.deselectEntity,
    addEntityToSelection: EditorActions.addEntityToSelection,
    doPinSelection: EditorActions.doPinSelection,
    linkPin: EditorActions.linkPin,
    setMode: EditorActions.setMode,
    setOffset: EditorActions.setCurrentPatchOffset,
  }, dispatch),
});

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  dropTarget
)(Patch);
