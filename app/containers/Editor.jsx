import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as Actions from '../actions';
import Selectors from '../selectors';
import * as EDITOR_MODE from '../constants/editorModes';
import CMD from '../constants/commands';

import Patch from './Patch';
import ProjectBrowser from './ProjectBrowser';
import Sidebar from '../components/Sidebar';
import Inspector from '../components/Inspector';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.onPropUpdate = this.onPropUpdate.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.setSelectedNodeType = this.setSelectedNodeType.bind(this);
    this.onPatchHotkeys = this.onPatchHotkeys.bind(this);
    this.onBrowserHotkeys = this.onBrowserHotkeys.bind(this);

    this.patchSize = this.props.size;
    this.hotkeys = {};
  }

  componentDidMount() {
    this.props.hotkeys(this.getHotkeyHandlers());
  }

  onPropUpdate(nodeId, propKey, propValue) {
    this.props.actions.updateNodeProperty(nodeId, propKey, propValue);
  }

  onPatchHotkeys(hotkeys) {
    this.hotkeys.patch = hotkeys;
  }
  onBrowserHotkeys(hotkeys) {
    this.hotkeys.browser = hotkeys;
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
    return this.mergeCommands([
      {
        [CMD.SET_MODE_CREATING]: this.setModeCreating,
        [CMD.ESCAPE]: this.setModeDefault,
        [CMD.UNDO]: () => this.props.actions.undo(this.props.currentPatchId),
        [CMD.REDO]: () => this.props.actions.redo(this.props.currentPatchId),
      },
      this.hotkeys.patch,
      this.hotkeys.browser,
    ]);
    // return R.mergeAll([
    //   {
    //     [CMD.SET_MODE_CREATING]: this.setModeCreating,
    //     [CMD.ESCAPE]: this.setModeDefault,
    //     [CMD.UNDO]: () => this.props.actions.undo(this.props.currentPatchId),
    //     [CMD.REDO]: () => this.props.actions.redo(this.props.currentPatchId),
    //   },
    //   this.hotkeys.patch,
    //   this.hotkeys.browser,
    // ]);
  }
  mergeCommand(obj1, obj2) {
    const result = R.clone(obj1);
    const arr2 = R.keys(obj2);
    const hasKey = R.flip(R.has)(obj1);
    arr2.forEach(key => {
      result[key] = hasKey(key) ? R.compose(obj1[key], obj2[key]) : obj2[key];
    });

    return result;
  }

  mergeCommands(array) {
    if (array.length === 1) {
      return array[0];
    }
    const cutArray = R.slice(2, Infinity);
    const getResult = R.flip(R.prepend)(cutArray(array));
    const newArray = getResult(this.mergeCommand(array[0], array[1]));

    const nextMerge = this.mergeCommands(newArray);

    return nextMerge;
  }

  render() {
    return (
      <div>
        <Sidebar>
          <ProjectBrowser hotkeys={this.onBrowserHotkeys} />
          <Inspector
            selection={this.props.selection}
            nodes={this.props.nodes}
            nodeTypes={this.props.nodeTypes}
            onPropUpdate={this.onPropUpdate}
          />
        </Sidebar>
        <Patch
          hotkeys={this.onPatchHotkeys}
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
  hotkeys: React.PropTypes.func,
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
