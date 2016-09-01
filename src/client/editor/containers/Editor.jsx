import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as Actions from '../actions';
import * as ProjectActions from 'xod/client/project/actions';
import * as EditorSelectors from '../selectors';
import * as ProjectSelectors from 'xod/client/project/selectors';

import { HotKeys } from 'react-hotkeys';
import { COMMAND } from 'xod/client/utils/constants';
import { EDITOR_MODE } from 'xod/client/editor/constants';

import Patch from './Patch';
import ProjectBrowser from 'xod/client/projectBrowser/containers/ProjectBrowser';
import Sidebar from 'xod/client/utils/components/Sidebar';
import Workarea from 'xod/client/utils/components/Workarea';

import Tabs from '../containers/Tabs';
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
      [COMMAND.SET_MODE_CREATING]: this.setModeCreating,
      [COMMAND.SET_MODE_DEFAULT]: this.setModeDefault,
      [COMMAND.UNDO]: () => this.props.actions.undo(this.props.currentPatchId),
      [COMMAND.REDO]: () => this.props.actions.redo(this.props.currentPatchId),
    };
  }

  render() {
    return (
      <HotKeys handlers={this.getHotkeyHandlers()} className="Editor">
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
            patchId={this.props.currentPatchId}
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
  const project = ProjectSelectors.getProject(state);
  const curPatchId = EditorSelectors.getCurrentPatchId(state);

  return {
    nodes: ProjectSelectors.dereferencedNodes(project, curPatchId),
    nodeTypes: ProjectSelectors.dereferencedNodeTypes(state),
    editor: EditorSelectors.getEditor(state),
    selection: EditorSelectors.getSelection(state),
    selectedNodeType: EditorSelectors.getSelectedNodeType(state),
    currentPatchId: curPatchId,
    mode: EditorSelectors.getModeChecks(state),
  };
};

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    updateNodeProperty: ProjectActions.updateNodeProperty,
    undo: ProjectActions.undoPatch,
    redo: ProjectActions.redoPatch,

    setMode: Actions.setMode,
    setSelectedNodeType: Actions.setSelectedNodeType,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
