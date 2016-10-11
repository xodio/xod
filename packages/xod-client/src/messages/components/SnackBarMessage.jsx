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

  hide() {
    return new Promise((resolve) => {
      this.setHidden(true);
      setTimeout(resolve, ANIMATION_TIMEOUT);
    });
  }

  render() {
    const message = this.props.message;
    const cls = classNames('SnackBarMessage', {
      hidden: this.state.hidden,
      error: message.type === MESSAGE_TYPE.ERROR,
      confirmation: message.type === MESSAGE_TYPE.CONFIRMATION,
      notification: message.type === MESSAGE_TYPE.NOTIFICATION,
    });
    const messageContent = this.getMessageContent();

    return (
      <li
        ref="body"
        className={cls}
        onClick={this.onClick}
        dataId={message.id}
      >
        {messageContent}
      </li>
    );
  }
}

SnackBarMessage.propTypes = {
  message: React.PropTypes.object,
  onHide: React.PropTypes.func,
};

export default SnackBarMessage;
