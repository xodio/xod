import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import Selectors from '../selectors';
import * as EDITOR_MODE from '../constants/editorModes';
import * as KEYCODE from '../constants/keycodes';
import Patch from './Patch';
import EventListener from 'react-event-listener';
import CreateNodeWidget from '../components/CreateNodeWidget';

const styles = {
  patchContainer: {
    position: 'relative',
  },
};

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.setSelectedNodeType = this.setSelectedNodeType.bind(this);
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;

    if (keycode === KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    if (keycode === KEYCODE.N) {
      this.setModeCreating();
    }
    if (keycode === KEYCODE.ESCAPE && this.props.mode.isCreatingNode) {
      this.setModeDefault();
    }
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
    this.props.actions.setSelectedNodeType(nodeTypeId);
  }

  render() {
    return (
      <div>
        <EventListener target={document} onKeyDown={this.onKeyDown} />
        <div style={styles.patchContainer}>
          <CreateNodeWidget
            nodeTypes={this.props.nodeTypes}
            selectedNodeType={this.props.selectedNodeType}
            onNodeTypeChange={this.setSelectedNodeType}
            onAddNodeClick={this.setModeCreating}
          />
          <Patch size={this.props.size} />
        </div>
      </div>
    );
  }
}

Editor.propTypes = {
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
  size: React.PropTypes.object.isRequired,
  selectedNodeType: React.PropTypes.number,
  mode: React.PropTypes.object,
  actions: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  editor: Selectors.Editor.getEditor(state),
  nodeTypes: Selectors.NodeType.getNodeTypes(state),
  selectedNodeType: Selectors.Editor.getSelectedNodeType(state),
  mode: Selectors.Editor.getModeChecks(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    setMode: Actions.setMode,
    setSelectedNodeType: Actions.setSelectedNodeType,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
