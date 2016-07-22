import R from 'ramda';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SnackBarList from '../components/SnackBarList';
import SnackBarError from '../components/SnackBarError';
import Selectors from '../selectors';
import { deleteError, keepError } from '../actions';

class SnackBar extends React.Component {
  constructor(props) {
    super(props);

    this.errors = {};

    this.hideError = this.hideError.bind(this);
    this.keepError = this.keepError.bind(this);
  }

  hideError(id) {
    this.props.deleteError(id);
  }
  keepError(id) {
    this.props.keepError(id);
  }

  render() {
    const errors = R.values(this.props.errors);
    return (
      <SnackBarList>
        {errors.map((error, i) =>
          <SnackBarError
            key={i}
            onHide={this.hideError}
            keepError={this.keepError}
            error={error}
          />
        )}
      </SnackBarList>
    );
  }
}


SnackBar.propTypes = {
  errors: React.PropTypes.object,
  deleteError: React.PropTypes.func,
  keepError: React.PropTypes.func,
};

const mapStateToProps = (state) => ({
  errors: Selectors.Errors.getErrors(state),
});

const mapDispatchToProps = (dispatch) => (bindActionCreators({
  deleteError,
  keepError,
}, dispatch));

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
