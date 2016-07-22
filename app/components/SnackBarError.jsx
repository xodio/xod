import R from 'ramda';
import React from 'react';
import * as STATUS from '../constants/statuses';
import { checkForMouseBubbling } from '../utils/browser';

class SnackBarError extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mouseOver: false,
    };

    this.hide = this.hide.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.refs.body.classList.remove('hide');
    }, 5);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.error.status === STATUS.SUCCEEDED &&
      !this.state.mouseOver
    ) {
      this.hide();
    }
  }

  onClick() {
    this.hide();
  }
  onMouseOver() {
    if (this.state.mouseOver) {
      return;
    }

    this.setMouseOver(true);
  }
  onMouseOut(event) {
    if (
      !this.state.mouseOver ||
      checkForMouseBubbling(event, this.refs.body)
    ) {
      return;
    }

    this.setMouseOver(false);
    this.props.keepError(this.props.error.id);
  }

  setMouseOver(val) {
    this.setState(
      R.assoc('mouseOver', val, this.state)
    );
  }

  hide() {
    this.refs.body.classList.add('hide');

    setTimeout(() => {
      this.props.onHide(this.props.error.id);
    }, 500);
  }

  render() {
    const error = this.props.error;
    return (
      <li
        ref="body"
        className="SnackBar-Error hide"
        onClick={this.onClick}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        dataId={error.id}
      >
        <small>
          {error.timestamp}:
        </small>
        <br />
        {error.payload.message}
      </li>
    );
  }
}

SnackBarError.propTypes = {
  error: React.PropTypes.object,
  onHide: React.PropTypes.func,
  keepError: React.PropTypes.func,
};

export default SnackBarError;
