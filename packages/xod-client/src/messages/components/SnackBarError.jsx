import R from 'ramda';
import React from 'react';
import classNames from 'classnames';

const ANIMATION_TIMEOUT = 500;

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
    });
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
      setTimeout(resolve, ANIMATION_TIMEOUT);
    });
  }

  render() {
    const error = this.props.error;
    const cls = classNames('SnackBarError', {
      hidden: this.state.hidden,
    });
    return (
      <li
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
};

export default SnackBarError;
