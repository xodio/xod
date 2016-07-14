import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Selectors from '../selectors';
import * as Actions from '../actions';

const styles = {
  toolbar: {
    position: 'relative',
    display: 'block',
    background: '#1E2329',
    color: '#fff',
  },
  toolbar__logo: {
    display: 'inline-block',
    padding: '5px 10px',
    color: '#7A838F',
  },
  projectMeta: {
    display: 'inline-block',
    padding: '5px 10px',
    margin: '0 5px',
  },
  'toolbar__upload-button': {
    position: 'absolute',
    top: 0,
    right: 0,
    display: 'block',
    background: '#7E6403',
    color: '#fff',
    padding: '8px 18px 9px',
    border: 0,
  },
};

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
      <div className="toolbar" style={styles.toolbar}>
        <div className="toolbar__logo" style={styles.toolbar__logo}>
          XOD
        </div>
        <div className="projectMeta" style={styles.projectMeta}>
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
          style={styles['toolbar__upload-button']}
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
