import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { MESSAGE_TYPE } from '../constants';
import Button from '../../core/components/Button';
import CloseButton from '../../core/components/CloseButton';

const ANIMATION_TIMEOUT = 100;

class SnackBarMessage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hidden: true,
      display: true,
    };

    this.hide = this.hide.bind(this);
    this.onCloseMessage = this.onCloseMessage.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setHidden(false);
    });
  }

  onCloseMessage() {
    this.props.onCloseMessage(this.props.message.id);
  }

  getMessageContent() {
    const { message, onClickMessageButton } = this.props;

    const button = R.unless(
      R.isNil,
      text => (
        <Button
          small
          light
          onClick={() => onClickMessageButton(message.id)}
        >
          {text}
        </Button>
      )
    )(message.payload.button);

    return [
      <div className="message-text" key="text">
        <span className="title">
          {message.payload.title}
        </span>
        {message.payload.note}
      </div>,
      <div className="message-buttons" key="buttons">
        {button}
      </div>,
    ];
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
    const { message } = this.props;
    const cls = classNames('SnackBarMessage', {
      hidden: this.state.hidden,
      display: this.state.display,
      error: message.type === MESSAGE_TYPE.ERROR,
      confirmation: message.type === MESSAGE_TYPE.CONFIRMATION,
      notification: message.type === MESSAGE_TYPE.NOTIFICATION,
      persistent: message.persistent,
    });
    const messageContent = this.getMessageContent();

    return (
      <li
        className={cls}
      >
        <a
          className="message-content"
          tabIndex={message.id}
        >
          <CloseButton onClick={this.onCloseMessage} />
          {messageContent}
        </a>
      </li>
    );
  }
}

SnackBarMessage.propTypes = {
  message: PropTypes.shape({
    /* eslint-disable react/no-unused-prop-types */
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    type: PropTypes.string,
    persistent: PropTypes.bool,
    payload: PropTypes.shape({
      title: PropTypes.string.isRequired,
      note: PropTypes.string,
      button: PropTypes.string,
    }),
    /* eslint-enable react/no-unused-prop-types */
  }),
  onClickMessageButton: PropTypes.func,
  onCloseMessage: PropTypes.func.isRequired,
};

SnackBarMessage.defaultProps = {
  onClickMessageButton: () => {},
};

export default SnackBarMessage;
