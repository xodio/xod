import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import Selectors from '../selectors';

import { findParentByClassName } from '../utils/browser';

import ProjectBrowserTree from '../components/ProjectBrowserTree';
import ProjectBrowserToolbar from '../components/ProjectBrowserToolbar';

class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.onTreeChange = this.onTreeChange.bind(this);
    this.onSwitchPatch = this.onSwitchPatch.bind(this);
    this.onMissClick = this.onMissClick.bind(this);
  }

  onMissClick(event) {
    const treeView = findParentByClassName(event.target, 'ProjectBrowserTree');
    if (treeView) { return; }

    if (this.refs.treeView && this.refs.treeView.deselect) {
      this.refs.treeView.deselect();
    }
  }

  onTreeChange(newTree) {
    console.log('tree changed:', Selectors.Project.parseTreeView(newTree));
  }

  onSwitchPatch(id) {
    this.props.actions.switchPatch(id);
  }

  render() {
    return (
      <div
        className="ProjectBrowser"
        onClick={this.onMissClick}
      >
        <small className="title">Project browser</small>
        <ProjectBrowserToolbar />
        <ProjectBrowserTree
          ref="treeView"
          tree={this.props.tree}
          currentPatchId={this.props.currentPatchId}
          onChange={this.onTreeChange}
          onSwitchPatch={this.onSwitchPatch}
        />
      </div>
    );
  }
}

ProjectBrowser.propTypes = {
  tree: React.PropTypes.object.isRequired,
  actions: React.PropTypes.object,
  patches: React.PropTypes.object,
  currentPatchId: React.PropTypes.number,
};

const mapStateToProps = (state) => ({
  tree: Selectors.Project.getTreeView(state),
  patches: Selectors.Project.getPatches(state),
  currentPatchId: Selectors.Editor.getCurrentPatchId(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    switchPatch: Actions.switchPatch,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
