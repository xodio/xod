import R from 'ramda';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SnackBarList from '../components/SnackBarList';
import SnackBarError from '../components/SnackBarError';
import Selectors from '../selectors';
import { hideError } from '../actions';

class SnackBar extends React.Component {
  constructor(props) {
    super(props);
    this.errors = {};
    this.hideError = this.hideError.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    this.addNewErrors(nextProps.errors);
  }

  addNewErrors(errors) {
    errors.forEach((err, i) => {
      if (!this.errors.hasOwnProperty(err.timestamp)) {
        this.errors[err.timestamp] = (
          <SnackBarError
            key={i}
            onHide={this.hideError}
            error={err}
          />
        );
      }
    });
  }

  hideError(timestamp) {
    delete this.errors[timestamp];
    this.props.hideError(timestamp);
  }

  render() {
    const errors = R.values(this.errors);
    return (
      <SnackBarList>
        {errors.map(error => error)}
      </SnackBarList>
    );
  }
}


SnackBar.propTypes = {
  errors: React.PropTypes.array,
  hideError: React.PropTypes.func,
};

const mapStateToProps = (state) => ({
  errors: Selectors.Errors.getErrors(state),
});

const mapDispatchToProps = (dispatch) => (bindActionCreators({ hideError }, dispatch));

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
