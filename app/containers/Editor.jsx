import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import Selectors from '../selectors';
import * as EDITOR_MODE from '../constants/editorModes';
import * as KEYCODE from '../constants/keycodes';
import { isInput } from '../utils/browser';
import Patch from './Patch';
import EventListener from 'react-event-listener';
import Inspector from '../components/Inspector';
import ProjectBrowser from './ProjectBrowser';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPropUpdate = this.onPropUpdate.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.setSelectedNodeType = this.setSelectedNodeType.bind(this);

    this.patchSize = this.props.size;
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;
    const isNotInput = !isInput(event);

    if (isNotInput) {
      if (keycode === KEYCODE.BACKSPACE) {
        event.preventDefault();
      }

      if (keycode === KEYCODE.N) {
        this.setModeCreating();
      }
      if (keycode === KEYCODE.ESCAPE && this.props.mode.isCreatingNode) {
        this.setModeDefault();
      }

      if (event.ctrlKey && keycode === KEYCODE.Z) {
        this.props.actions.undo(this.props.currentPatchId);
      }
      if (event.ctrlKey && keycode === KEYCODE.Y) {
        this.props.actions.redo(this.props.currentPatchId);
      }
    }
  }
  onPropUpdate(nodeId, propKey, propValue) {
    this.props.actions.updateNodeProperty(nodeId, propKey, propValue);
  }

  setEditorMode(mode) {
    this.props.actions.setMode(mode);
  }

  setModeCreating() {
    this.setEditorMode(EDITOR_MODE.CREATING_NODE);
  }

  setModeDefault() {
    this.setEditorMode(EDITOR_MODE.DEFAULT);
  }

  setSelectedNodeType(nodeTypeId) {
    this.props.actions.setSelectedNodeType(
      parseInt(nodeTypeId, 10)
    );
  }

  render() {
    return (
      <div>
        <EventListener target={document} onKeyDown={this.onKeyDown} />
        <ProjectBrowser />
        <Inspector
          selection={this.props.selection}
          nodes={this.props.nodes}
          nodeTypes={this.props.nodeTypes}
          onPropUpdate={this.onPropUpdate}
        />
        <Patch
          size={this.patchSize}
        />
      </div>
    );
  }
}

Editor.propTypes = {
  nodes: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
  size: React.PropTypes.object.isRequired,
  selection: React.PropTypes.array,
  selectedNodeType: React.PropTypes.number,
  currentPatchId: React.PropTypes.number,
  mode: React.PropTypes.object,
  actions: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  nodes: Selectors.Project.getNodes(state),
  editor: Selectors.Editor.getEditor(state),
  nodeTypes: Selectors.Project.getNodeTypes(state),
  selection: Selectors.Editor.getSelection(state),
  selectedNodeType: Selectors.Editor.getSelectedNodeType(state),
  currentPatchId: Selectors.Editor.getCurrentPatchId(state),
  mode: Selectors.Editor.getModeChecks(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    setMode: Actions.setMode,
    setSelectedNodeType: Actions.setSelectedNodeType,
    updateNodeProperty: Actions.updateNodeProperty,
    undo: Actions.undoPatch,
    redo: Actions.redoPatch,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
