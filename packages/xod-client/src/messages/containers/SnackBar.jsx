import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
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

    // :: Map Number { timeout :: Number, data :: MessageData, element :: ReactElement }
    this.messages = {};

    this.addMessages(props.errors);

    this.hideMessage = this.hideMessage.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onButtonClicked = this.onButtonClicked.bind(this);
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

  onButtonClicked(buttonId, messageData) {
    this.props.onClickMessageButton(buttonId, messageData);
    this.hideMessage(messageData.id);
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
      .then(() => this.props.deleteMessage(id));
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
  onClickMessageButton: PropTypes.func,
  deleteMessage: PropTypes.func,
};

const mapStateToProps = state => ({
  errors: ErrorSelectors.getErrors(state),
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      deleteMessage,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
