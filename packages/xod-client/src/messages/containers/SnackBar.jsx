import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SnackBarList from '../components/SnackBarList';
import SnackBarMessage from '../components/SnackBarMessage';
import * as ErrorSelectors from '../selectors';
import { deleteMessage, messageButtonClick } from '../actions';

const ERROR_TIMEOUT = 3000;

class SnackBar extends React.Component {
  constructor(props) {
    super(props);

    // :: Map Number { timeout :: Number, data :: MessageData, element :: ReactElement }
    this.messages = {};

    this.addMessages(props.errors);

    this.hideMessage = this.hideMessage.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onButtonClicked = this.onButtonClicked.bind(this);
    this.onCloseMessage = this.onCloseMessage.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.addMessages(nextProps.errors);
  }

  onMouseOver() {
    R.pipe(
      R.values,
      R.forEach(message => {
        clearTimeout(message.timeout);
      })
    )(this.messages);
  }

  onMouseOut() {
    R.pipe(
      R.values,
      R.forEach(msg => {
        this.messages[msg.data.id].timeout = this.setHideTimeout(msg.data);
      })
    )(this.messages);
  }

  onButtonClicked(messageId) {
    this.props.onMessageButtonClick(messageId);
    this.hideMessage(messageId);
  }

  onCloseMessage(messageId) {
    this.hideMessage(messageId);
  }

  setHideTimeout(messageData) {
    if (messageData.persistent) return null;

    return setTimeout(() => {
      this.hideMessage(messageData.id);
    }, ERROR_TIMEOUT);
  }

  hideMessage(id) {
    const element = this.messages[id].ref;

    if (!element) return;

    element
      .hide()
      .then(() => delete this.messages[id])
      .then(() => this.props.onDeleteMessage(id));
  }

  addMessages(messages) {
    R.pipe(
      R.values,
      R.forEach(messageData => {
        if (R.has(messageData.id, this.messages)) {
          return;
        }

        const assignRef = el => {
          if (R.has(messageData.id, this.messages)) {
            this.messages[messageData.id].ref = el;
          }
        };

        this.messages[messageData.id] = {
          timeout: this.setHideTimeout(messageData),
          data: messageData,
          element: (
            <SnackBarMessage
              ref={assignRef}
              key={messageData.id}
              message={messageData}
              onClickMessageButton={this.onButtonClicked}
              onCloseMessage={this.onCloseMessage}
            />
          ),
        };
      })
    )(messages);
  }

  render() {
    const messages = R.compose(R.map(R.prop('element')), R.values)(
      this.messages
    );

    return (
      <SnackBarList onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut}>
        {messages}
      </SnackBarList>
    );
  }
}

SnackBar.propTypes = {
  errors: PropTypes.object,
  onDeleteMessage: PropTypes.func,
  onMessageButtonClick: PropTypes.func,
};

const mapStateToProps = state => ({
  errors: ErrorSelectors.getErrors(state),
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onDeleteMessage: deleteMessage,
      onMessageButtonClick: messageButtonClick,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
