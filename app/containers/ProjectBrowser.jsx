import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// import * as Actions from '../actions';
import Selectors from '../selectors';
import ProjectBrowserTree from '../components/ProjectBrowserTree';


class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.onTreeChange = this.onTreeChange.bind(this);
  }

  onTreeChange(newTree) {
    console.log('tree changed!', newTree);
  }

  render() {
    return (
      <div className="ProjectBrowser">
        <small className="title">Project browser</small>
        <ProjectBrowserTree
          tree={this.props.tree}
          currentPatchId={this.props.currentPatchId}
          onChange={this.onTreeChange}
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
  actions: bindActionCreators({}, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
