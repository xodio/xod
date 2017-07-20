import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import '../src/core/styles/main.scss';
import SnackBarMessage from '../src/messages/components/SnackBarMessage';
import { MESSAGE_TYPE } from '../src/messages/constants';

const err = {
  id: 1,
  payload: {
    message: 'Something bad just happened',
    buttons: [],
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.ERROR,
};

const confirmationMsg = {
  id: 2,
  payload: {
    message: 'Please confirm something',
    buttons: [],
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.CONFIRMATION,
};

const notificationMsg = {
  id: 3,
  payload: {
    message: 'Something happened. Just wanted you to know.',
    buttons: [],
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.NOTIFICATION,
};

const notificationWithBtns = {
  id: 4,
  payload: {
    message: 'Something happened. What should we do with it?',
    buttons: [
      { id: 'abort', text: 'Abort' },
      { id: 'retry', text: 'Retry' },
      { id: 'ignore', text: 'Ignore' },
    ],
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.CONFIRMATION,
};

storiesOf('SnackBarMessage', module)
  .addDecorator(story => (
    <div>
      {story()}
    </div>
  ))
  .add('error', () => (
    <SnackBarMessage
      message={err}
    />
  ))
  .add('confirmation', () => (
    <SnackBarMessage
      message={confirmationMsg}
    />
  ))
  .add('notification', () => (
    <SnackBarMessage
      message={notificationMsg}
    />
  ))
  .add('notification with buttons', () => (
    <SnackBarMessage
      message={notificationWithBtns}
      onClickMessageButton={action('OnButton')}
    />
  ))
  .add('multiple messages', () => (
    <ul className="SnackBarList">
      <SnackBarMessage
        message={err}
      />
      <SnackBarMessage
        message={confirmationMsg}
      />
      <SnackBarMessage
        message={notificationMsg}
      />
      <SnackBarMessage
        message={notificationWithBtns}
        onClickMessageButton={action('OnButton')}
      />
    </ul>
  ));
