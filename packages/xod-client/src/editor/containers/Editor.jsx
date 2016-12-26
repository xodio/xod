import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import core from 'xod-core';

import * as Actions from '../actions';
import * as ProjectActions from '../../project/actions';
import * as EditorSelectors from '../selectors';

import { HotKeys } from 'react-hotkeys';
import { COMMAND } from '../../utils/constants';
import { EDITOR_MODE } from '../../editor/constants';

import Patch from './Patch';
import { ProjectBrowser } from '../../projectBrowser';
import Sidebar from '../../utils/components/Sidebar';
import Workarea from '../../utils/components/Workarea';

import Tabs from '../containers/Tabs';
import Inspector from '../components/Inspector';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.onPropUpdate = this.onPropUpdate.bind(this);
    this.onPinModeSwitch = this.onPinModeSwitch.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);

    this.patchSize = this.props.size;
  }

  onPropUpdate(nodeId, propKind, propKey, propValue) {
    this.props.actions.updateNodeProperty(nodeId, propKind, propKey, propValue);
  }

  onPinModeSwitch(nodeId, pinKey, injected, val) {
    this.props.actions.changePinMode(nodeId, pinKey, injected, val);
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

  getHotkeyHandlers() {
    return {
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
            onPinModeSwitch={this.onPinModeSwitch}
          />
        </Sidebar>
        <Workarea>
          <Tabs />
          <Patch
            patchId={this.props.currentPatchId}
            size={this.patchSize}
            setModeCreating={this.setModeCreating}
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
  currentPatchId: React.PropTypes.string,
  mode: React.PropTypes.object,
  actions: React.PropTypes.object,
  p: React.PropTypes.any,
};

const mapStateToProps = (state) => {
  const project = core.getProject(state);
  const curPatchId = EditorSelectors.getCurrentPatchId(state);

  return {
    nodes: core.dereferencedNodes(project, curPatchId),
    nodeTypes: core.dereferencedNodeTypes(state),
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
    changePinMode: ProjectActions.changePinMode,
    undo: ProjectActions.undoPatch,
    redo: ProjectActions.redoPatch,

    setMode: Actions.setMode,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
