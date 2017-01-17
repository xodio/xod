import R from 'ramda';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SnackBarList from '../components/SnackBarList';
import SnackBarMessage from '../components/SnackBarMessage';
import * as ErrorSelectors from '../selectors';
import { deleteMessage } from '../actions';

const ERROR_TIMEOUT = 3000;

class SnackBar extends React.Component {
  constructor(props) {
    super(props);

    this.errors = {};
    this.state = {
      mouseover: false,
    };

    this.addMessages(props.errors);

    this.hideError = this.hideError.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.addMessages(nextProps.errors);
  }

  onMouseOver() {
    if (this.state.mouseover) return;

    this.setState(
      R.assoc('mouseover', true, this.state)
    );
  }

  onMouseOut() {
    if (!this.state.mouseover) return;

    this.setState(
      R.assoc('mouseover', false, this.state)
    );

    this.restartTimeouts();
  }

  setTimeout(id) {
    return setTimeout(() => {
      if (!this.state.mouseover) {
        this.hideError(id);
      }
    }, ERROR_TIMEOUT);
  }

  restartTimeouts() {
    R.pipe(
      R.values,
      R.forEach((error) => {
        const id = error.data.id;
        clearTimeout(error.timeout);
        this.errors[id].timeout = this.setTimeout(id);
      })
    )(this.errors);
  }

  hideError(id) {
    const element = this.errors[id].ref;

    if (!element) return;

    element
      .hide()
      .then(() => delete this.errors[id])
      .then(() => this.props.deleteMessage(id));
  }

  addMessages(errors) {
    R.pipe(
      R.values,
      R.forEach((error) => {
        if (R.has(error.id, this.errors)) {
          return;
        }

        const assignRef = (el) => {
          if (R.has(error.id, this.errors)) {
            this.errors[error.id].ref = el;
          }
        };

        this.errors[error.id] = {
          timeout: this.setTimeout(error.id),
          data: error,
          element: (
            <SnackBarMessage
              ref={assignRef}
              key={error.id}
              message={error}
            />
          ),
        };
      })
    )(errors);
  }

  render() {
    const errors = R.values(this.errors);
    return (
      <SnackBarList
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
      >
        {errors.map(error => error.element)}
      </SnackBarList>
    );
  }
}


SnackBar.propTypes = {
  errors: React.PropTypes.object,
  deleteMessage: React.PropTypes.func,
};

const mapStateToProps = state => ({
  errors: ErrorSelectors.getErrors(state),
});

const mapDispatchToProps = dispatch => (bindActionCreators({
  deleteMessage,
}, dispatch));

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
