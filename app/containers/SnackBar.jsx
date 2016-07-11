import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Selectors from '../selectors';
import { hideError } from '../actions';

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: '200px',
  },
  error: {
    display: 'block',
    marginTop: '1px',
    padding: '8px 16px',
    color: '#fff',
    background: '#600',
    borderBottom: '1px solid #400',
  },
};

const SnackBar = ({ errors, actions }) => {
  const onClick = (timestamp) => actions.hideError.bind(undefined, timestamp);

  return (
    <ul style={styles.container}>
      {errors.map((error, i) =>
        <li
          key={i}
          onClick={onClick(error.timestamp)}
          style={styles.error}
        >
          {error.timestamp}:<br />
          {error.message}
        </li>
      )}
    </ul>
  );
};
SnackBar.propTypes = {
  errors: React.PropTypes.array,
  actions: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  errors: Selectors.Errors.getErrors(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({ hideError }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
