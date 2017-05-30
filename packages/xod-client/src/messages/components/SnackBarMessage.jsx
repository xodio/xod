import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { MESSAGE_TYPE } from '../constants';

const ANIMATION_TIMEOUT = 500;

class SnackBarMessage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hidden: true,
      display: true,
    };

    this.hide = this.hide.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setHidden(false);
    });
  }

  getMessageContent() {
    const message = this.props.message;

    if (message.type === MESSAGE_TYPE.ERROR) {
      return (
        <p>
          <small>
            {message.timestamp}:
          </small>
          <br />
          {message.payload.message}
        </p>
      );
    }

    return (
      <p>
        {message.payload.message}
      </p>
    );
  }

  setHidden(val) {
    this.setState(
      R.assoc('hidden', val, this.state)
    );
  }

  setDisplay(val) {
    this.setState(
      R.assoc('display', val, this.state)
    );
  }

  hide() {
    return new Promise((resolve) => {
      this.setHidden(true);
      setTimeout(resolve, ANIMATION_TIMEOUT);
    }).then(() => {
      this.setDisplay(false);
    });
  }

  render() {
    const message = this.props.message;
    const cls = classNames('SnackBarMessage', {
      hidden: this.state.hidden,
      display: this.state.display,
      error: message.type === MESSAGE_TYPE.ERROR,
      confirmation: message.type === MESSAGE_TYPE.CONFIRMATION,
      notification: message.type === MESSAGE_TYPE.NOTIFICATION,
    });
    const messageContent = this.getMessageContent();

    return (
      <li
        className={cls}
        dataId={message.id}
      >
        <a tabIndex={message.id} >
          {messageContent}
        </a>
      </li>
    );
  }
}

SnackBarMessage.propTypes = {
  message: React.PropTypes.object,
};

export default SnackBarMessage;
