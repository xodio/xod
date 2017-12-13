import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../src/core/styles/main.scss';
import SnackBarMessage from '../src/messages/components/SnackBarMessage';
import { MESSAGE_TYPE } from '../src/messages/constants';

const errMsg = {
  id: 0,
  payload: {
    title: 'Error',
    note: 'Something bad just happened. And we just want to notify you. Without any actions required.',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.ERROR,
};
const errMsgWithButton = {
  id: 'errorWithButton',
  persistent: true,
  payload: {
    title: 'Error occured. What shall we do now?',
    note: 'Just showed error message, choose what to do now to fix it up?',
    button: 'Retry',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.ERROR,
};

const confirmationMsg = {
  id: 1,
  payload: {
    title: 'Confirmation',
    note: 'Message that confirms something. For example, it tells User that Project was successfully saved.',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.CONFIRMATION,
};

const confirmationMsgWithButton = {
  id: 'confirmationWithButton',
  persistent: true,
  payload: {
    title: 'Confirmation with buttons',
    note: 'We have a new update of XOD. What do you want to do with it?',
    button: 'Download & Install',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.CONFIRMATION,
};

const notificationMsg = {
  id: 2,
  payload: {
    title: 'Some notification',
    note: 'Something happened. Just wanted you to know.',
  },
  timestamp: 1234567890,
  type: MESSAGE_TYPE.NOTIFICATION,
};

const notificationWithButton = {
  id: 'notificationWithButton',
  persistent: true,
  payload: {
    title: 'Notification with buttons',
    note: 'Something happened. What should we do with it?',
    button: 'Learn more',
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
      message={errMsg}
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
      message={notificationWithButton}
      onClickMessageButton={action('OnButton')}
    />
  ))
  .add('multiple messages', () => (
    <ul className="SnackBarList">
      <SnackBarMessage
        message={errMsg}
        onClickMessageButton={action('OnButton')}
      />
      <SnackBarMessage
        message={errMsgWithButton}
        onClickMessageButton={action('OnButton')}
      />
      <SnackBarMessage
        message={confirmationMsg}
        onClickMessageButton={action('OnButton')}
      />
      <SnackBarMessage
        message={confirmationMsgWithButton}
        onClickMessageButton={action('OnButton')}
      />
      <SnackBarMessage
        message={notificationMsg}
        onClickMessageButton={action('OnButton')}
      />
      <SnackBarMessage
        message={notificationWithButton}
        onClickMessageButton={action('OnButton')}
      />
    </ul>
  ));
