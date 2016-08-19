import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as Actions from '../actions';
import Selectors from '../selectors';
import * as EDITOR_MODE from '../constants/editorModes';

import { HotKeys } from 'react-hotkeys';
import CMD from '../constants/commands';


import Patch from './Patch';
import ProjectBrowser from './ProjectBrowser';
import Tabs from './Tabs';
import Sidebar from '../components/Sidebar';
import Workarea from '../components/Workarea';
import Inspector from '../components/Inspector';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.onPropUpdate = this.onPropUpdate.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.setSelectedNodeType = this.setSelectedNodeType.bind(this);
    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);

    this.patchSize = this.props.size;
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

  getHotkeyHandlers() {
    return {
      [CMD.SET_MODE_CREATING]: this.setModeCreating,
      [CMD.SET_MODE_DEFAULT]: this.setModeDefault,
      [CMD.UNDO]: () => this.props.actions.undo(this.props.currentPatchId),
      [CMD.REDO]: () => this.props.actions.redo(this.props.currentPatchId),
    };
  }

  render() {
    return (
      <HotKeys handlers={this.getHotkeyHandlers()}>
        <Sidebar>
          <ProjectBrowser />
          <Inspector
            selection={this.props.selection}
            nodes={this.props.nodes}
            nodeTypes={this.props.nodeTypes}
            onPropUpdate={this.onPropUpdate}
          />
        </Sidebar>
        <Workarea>
          <Tabs />
          <Patch
            size={this.patchSize}
          />
        </Workarea>
      </HotKeys>
    );
  }
}

Editor.propTypes = {
  nodes: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
  size: React.PropTypes.object.isRequired,
  selection: React.PropTypes.array,
  selectedNodeType: React.PropTypes.string,
  currentPatchId: React.PropTypes.number,
  mode: React.PropTypes.object,
  actions: React.PropTypes.object,
  p: React.PropTypes.any,
};

const mapStateToProps = (state) => {
  const project = Selectors.Project.getProject(state);
  const curPatchId = Selectors.Editor.getCurrentPatchId(state);

  return {
    nodes: Selectors.Project.getPreparedNodes(project, curPatchId),
    nodeTypes: Selectors.Project.getPreparedNodeTypes(state),
    editor: Selectors.Editor.getEditor(state),
    selection: Selectors.Editor.getSelection(state),
    selectedNodeType: Selectors.Editor.getSelectedNodeType(state),
    currentPatchId: curPatchId,
    mode: Selectors.Editor.getModeChecks(state),
  };
};

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
