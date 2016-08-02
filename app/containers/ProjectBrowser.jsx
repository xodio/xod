import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import Selectors from '../selectors';


class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = 'ProjectBrowser';
  }
  render() {
    return <div>ProjectBrowser</div>;
  }
}

ProjectBrowser.propTypes = {
  actions: React.PropTypes.object,
  patches: React.PropTypes.object,
  currentPatchId: React.PropTypes.number,
};

const mapStateToProps = (state) => ({
  patches: Selectors.Project.getPatches(state),
  currentPatchId: Selectors.Editor.getCurrentPatchId(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({}, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
