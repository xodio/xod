import React from 'react';
import { storiesOf } from '@kadira/storybook';

import '../src/core/styles/main.scss';
import SnackBarMessage from '../src/messages/components/SnackBarMessage';
import { MESSAGE_TYPE } from '../src/messages/constants';

const err = {
  id: 1,
  payload: {
    message: 'Something bad just happened',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.ERROR,
};

const confirmationMsg = {
  id: 2,
  payload: {
    message: 'Please confirm something',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.CONFIRMATION,
};

const notificationMsg = {
  id: 3,
  payload: {
    message: 'Something happened. Just wanted you to know.',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.NOTIFICATION
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
    </ul>
  ));
