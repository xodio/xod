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
import Inspector from '../components/Inspector';
import * as BrowserUtils from '../utils/browser';

const styles = {
  patchContainer: {
    position: 'relative',
    marginLeft: '200px',
    background: '#eee',
    padding: '20px',
    width: 'auto',
    height: '100%',
    overflow: 'scroll',
    boxShadow: 'inset 2px 0 10px rgba(0,0,30,.3)',
  },
};

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.setSelectedNodeType = this.setSelectedNodeType.bind(this);

    this.patchSize = this.props.size;
  }

  componentDidMount() {
    this.updateSize();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hasOwnProperty('size') && this.props.size !== nextProps.size) {
      this.updateSize();
    }
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
    this.props.actions.setSelectedNodeType(
      parseInt(nodeTypeId, 10)
    );
  }

  updateSize() {
    const container = this.refs.patchContainer;
    const padding = parseInt(BrowserUtils.getStyle(container, 'padding'), 10);
    const width = container.offsetWidth - padding;
    const height = container.offsetHeight - padding;

    this.patchSize = { width, height };
    this.forceUpdate();
  }

  render() {
    return (
      <div>
        <EventListener target={document} onKeyDown={this.onKeyDown} />
        <Inspector
          selections={this.props.selection}
          nodeTypes={this.props.nodeTypes}
          onPropUpdate={this.onPropUpdate}
        />
        <div style={styles.patchContainer} ref="patchContainer">
          <CreateNodeWidget
            nodeTypes={this.props.nodeTypes}
            selectedNodeType={this.props.selectedNodeType}
            onNodeTypeChange={this.setSelectedNodeType}
            onAddNodeClick={this.setModeCreating}
          />
          <Patch size={this.patchSize} />
        </div>
      </div>
    );
  }
}

Editor.propTypes = {
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
  size: React.PropTypes.object.isRequired,
  selection: React.PropTypes.array,
  selectedNodeType: React.PropTypes.number,
  mode: React.PropTypes.object,
  actions: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  editor: Selectors.Editor.getEditor(state),
  nodeTypes: Selectors.NodeType.getNodeTypes(state),
  selection: Selectors.Editor.getSelection(state),
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
