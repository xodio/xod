import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
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
  }

  componentDidMount() {
    setTimeout(() => {
      this.setHidden(false);
    });
  }

  getMessageContent() {
    const { message, onClickMessageButton } = this.props;

    const buttons = R.unless(
      R.isEmpty,
      R.compose(
        btns => React.createElement(
          'div',
          { className: 'SnackBar-buttons-container' },
          btns
        ),
        R.map(({ id, text }) => (
          <button
            className="Button Button--small"
            key={id}
            onClick={() => onClickMessageButton(id, message)}
          >
            {text}
          </button>
        ))
      )
    )(message.payload.buttons);

    return (
      <div className="message-content">
        {message.payload.message}
        {buttons}
      </div>
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

  hide = () => new Promise((resolve) => {
    this.setHidden(true);
    setTimeout(resolve, ANIMATION_TIMEOUT);
  }).then(() => {
    this.setDisplay(false);
  });

  render() {
    const { message } = this.props;
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
      >
        <a tabIndex={message.id} >
          {messageContent}
        </a>
      </li>
    );
  }
}

SnackBarMessage.propTypes = {
  message: PropTypes.shape({
    /* eslint-disable react/no-unused-prop-types */
    id: PropTypes.number,
    type: PropTypes.string,
    persistent: PropTypes.bool,
    payload: PropTypes.shape({
      message: PropTypes.string.isRequired,
      buttons: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        text: PropTypes.string,
      })).isRequired,
    }),
    /* eslint-enable react/no-unused-prop-types */
  }),
  onClickMessageButton: PropTypes.func,
};

SnackBarMessage.defaultProps = {
  onClickMessageButton: () => {},
};

export default SnackBarMessage;
