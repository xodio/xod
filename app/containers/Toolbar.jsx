import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Selectors from '../selectors';
import * as Actions from '../actions';

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.onProjectNameClick = this.onProjectNameClick.bind(this);
  }
  onProjectNameClick() {
    return this.props.actions.updateMeta({
      name: 'Mega project',
    });
  }
  render() {
    const meta = this.props.meta;

    return (
      <div className="toolbar">
        <div className="toolbar__logo">
          XOD
        </div>
        <div className="projectMeta">
          <span
            className="projectMeta__name"
            onClick={this.onProjectNameClick}
          >
            {meta.name}
          </span>
          <span
            className="projectMeta__author"
          >
            {(meta.author) ? `by ${meta.author}` : ''}
          </span>
        </div>
        <button
          className="toolbar__upload-button"
          onClick={this.props.onUpload}
        >
          UPLOAD
        </button>
      </div>
    );
  }
}

Toolbar.propTypes = {
  meta: React.PropTypes.object,
  actions: React.PropTypes.object,
  onUpload: React.PropTypes.func,
};

const mapStateToProps = (state) => ({
  meta: Selectors.Meta.getMeta(state),
});
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    updateMeta: Actions.updateMeta,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar);
