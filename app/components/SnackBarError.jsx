import R from 'ramda';
import React from 'react';
import classNames from 'classnames';

class SnackBarError extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hidden: true,
    };

    this.hide = this.hide.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setHidden(false);
    }, 5);
  }

  onClick() {
    this.hide();
  }

  setHidden(val) {
    this.setState(
      R.assoc('hidden', val, this.state)
    );
  }

  hide() {
    return new Promise((resolve) => {
      this.setHidden(true);
      setTimeout(() => resolve(), 500);
    });
  }

  render() {
    const error = this.props.error;
    const cls = classNames('SnackBarError', {
      hidden: this.state.hidden,
    });
    return (
      <li
        ref="body"
        className={cls}
        onClick={this.onClick}
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
};

export default SnackBarError;
