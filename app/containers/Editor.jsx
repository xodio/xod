import React from 'react';
import { connect } from 'react-redux';
import * as Actions from '../actions';
import Selectors from '../selectors';
import * as EDITOR_MODE from '../constants/editorModes';
import * as KEYCODE from '../constants/keycodes';
import Patch from './Patch';
import EventListener from 'react-event-listener';
import Toolbar from '../components/Toolbar';

const styles = {
  patchContainer: {
    position: 'relative',
  },
};

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.onProjectNameClick = this.onProjectNameClick.bind(this);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.setSelectedNodeType = this.setSelectedNodeType.bind(this);
  }

  onProjectNameClick() {
    return this.props.dispatch(Actions.updateMeta({
      name: 'Mega project',
    }));
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;

    if (keycode === KEYCODE.N) {
      this.setModeCreating();
    }
    if (keycode === KEYCODE.ESCAPE && Selectors.Editor.isCreatingMode(this.props.editor)) {
      this.setModeDefault();
    }
  }

  setEditorMode(mode) {
    this.props.dispatch(Actions.setMode(mode));
  }

  setModeCreating() {
    this.setEditorMode(EDITOR_MODE.CREATING);
  }
  setModeDefault() {
    this.setEditorMode(EDITOR_MODE.DEFAULT);
  }

  setSelectedNodeType(nodeTypeId) {
    this.props.dispatch(Actions.setSelectedNodeType(nodeTypeId));
  }

  render() {
    const projectMeta = Selectors.Meta.getMeta(this.props.project);

    return (
      <div>
        <EventListener target={document} onKeyDown={this.onKeyDown} />
        <h1 onClick={this.onProjectNameClick}>
          {projectMeta.name} {(projectMeta.author) ? `by ${projectMeta.author}` : ''}
        </h1>
        <div style={styles.patchContainer}>
          <Toolbar
            nodeTypes={this.props.nodeTypes}
            selectedNodeType={this.props.editor.selectedNodeType}
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
  dispatch: React.PropTypes.func.isRequired,
  project: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
  size: React.PropTypes.any.isRequired,
};

export default connect(state => state)(Editor);
