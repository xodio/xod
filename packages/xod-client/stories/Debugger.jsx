import React from 'react';
import { createStore as createReduxStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Debugger from '../src/debugger/containers/Debugger';
import DebuggerReducer from '../src/debugger/reducer';
import { getLogForCurrentTab } from '../src/debugger/selectors';
import {
  addMessagesToDebuggerLog,
  startDebuggerSession,
  echoSentLineToDebuggerLog,
} from '../src/debugger/actions';

import '../src/core/styles/main.scss';

// =============================================================================
//
// Utils
//
// =============================================================================

const createStore = () =>
  createReduxStore(
    combineReducers({
      debugger: DebuggerReducer,
    })
  );

const addMessages = store => {
  store.dispatch(
    addMessagesToDebuggerLog([
      {
        type: 'log',
        message: 'Just a simple log message, that readed from Serial',
      },
      {
        type: 'log',
        message: 'Just another log message',
      },
      {
        type: 'xod',
        prefix: '+XOD',
        timecode: Date.now().toString(),
        nodeId: '32',
        content: 'Some text for watch node goes here!',
      },
      {
        type: 'xod',
        prefix: '+XOD',
        timecode: Date.now().toString(),
        nodeId: '12',
        content: (Math.random() * 1000 + Math.random()).toString(),
      },
    ])
  );
};

const addError = store => {
  store.dispatch(
    addMessagesToDebuggerLog([
      {
        type: 'error',
        message:
          'Error: Some error could be occured and displayed in the Debugger!',
        stack: 'And it could have a stack trace...',
      },
    ])
  );
};

const addUploadingLog = store => {
  store.dispatch({
    type: 'UPLOAD',
    meta: {
      status: 'started',
    },
  });

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message: 'Project was successfully transpiled. Searching for device...',
      percentage: 10,
      id: 1,
    },
    meta: {
      status: 'progressed',
    },
  });

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message:
        'Port with connected Arduino was found. Installing toolchains...',
      percentage: 15,
      id: 1,
    },
    meta: {
      status: 'progressed',
    },
  });

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message: 'Toolchain is installed. Uploading...',
      percentage: 30,
      id: 1,
    },
    meta: {
      status: 'progressed',
    },
  });
};

const startDebugSession = store => {
  store.dispatch(
    startDebuggerSession(
      {
        type: 'system',
        message: 'Debug session has been started! (system message)',
      },
      {}
    )
  );
};

// Container that shows Log length
const LogLength = connect(state => ({ log: getLogForCurrentTab(state) }))(
  ({ log }) => <div>Log length: {log.length}</div>
);

// =============================================================================
//
// Stories
//
// =============================================================================

const idle = () => {
  const store = createStore();

  storiesOf('Debugger', module)
    .addDecorator(story => <Provider store={store}>{story()}</Provider>)
    .add('idle', () => (
      <Debugger
        onUploadClick={action('onUploadClick')}
        onUploadAndDebugClick={action('onUploadAndDebugClick')}
        onSendToSerial={action('onSendToSerial')}
      />
    ));
};

const uploading = () => {
  const store = createStore();
  addUploadingLog(store);

  storiesOf('Debugger', module)
    .addDecorator(story => <Provider store={store}>{story()}</Provider>)
    .add('uploading', () => (
      <Debugger
        onUploadClick={action('onUploadClick')}
        onUploadAndDebugClick={action('onUploadAndDebugClick')}
        onSendToSerial={action('onSendToSerial')}
      />
    ));
};

const uploadingSuccess = () => {
  const store = createStore();
  addUploadingLog(store);

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message:
        '\nConnecting to programmer: .\nFound programmer: Id = "CATERIN"; type = S\n    Software Version = 1.0; No Hardware Version given.\nProgrammer supports auto addr increment.\nProgrammer supports buffered memory access with buffersize=128 bytes.\n\nProgrammer supports the following devices:\n    Device code: 0x44\n\navrdude: AVR device initialized and ready to accept instructions\n\nReading | ################################################## | 100% 0.00s\n\navrdude: Device signature = 0x1e9587 (probably m32u4)\navrdude: reading input file "/Users/user/Library/Application Support/xod-client-electron/upload-temp/build/xod-arduino-sketch.cpp.hex"\navrdude: writing flash (6884 bytes):\n\nWriting | ################################################## | 100% 0.53s\n\navrdude: 6884 bytes of flash written\navrdude: verifying flash memory against /Users/user/Library/Application Support/xod-client-electron/upload-temp/build/xod-arduino-sketch.cpp.hex:\navrdude: load data flash data from input file /Users/user/Library/Application Support/xod-client-electron/upload-temp/build/xod-arduino-sketch.cpp.hex:\navrdude: input file /Users/user/Library/Application Support/xod-client-electron/upload-temp/build/xod-arduino-sketch.cpp.hex contains 6884 bytes\navrdude: reading on-chip flash data:\n\nReading | ################################################## | 100% 0.07s\n\navrdude: verifying ...\navrdude: 6884 bytes of flash verified\n\navrdude done.  Thank you.\n\n\n\n',
      id: 1,
    },
    meta: {
      status: 'succeeded',
    },
  });

  storiesOf('Debugger', module)
    .addDecorator(story => <Provider store={store}>{story()}</Provider>)
    .add('uploading sussess', () => (
      <Debugger
        onUploadClick={action('onUploadClick')}
        onUploadAndDebugClick={action('onUploadAndDebugClick')}
        onSendToSerial={action('onSendToSerial')}
      />
    ));
};

const uploadingFail = () => {
  const store = createStore();
  addUploadingLog(store);

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message: 'Error occured during uploading: Some horrible stuff happened',
      percentage: 30,
      id: 1,
    },
    meta: {
      status: 'failed',
    },
  });

  storiesOf('Debugger', module)
    .addDecorator(story => <Provider store={store}>{story()}</Provider>)
    .add('uploading fail', () => (
      <Debugger
        onUploadClick={action('onUploadClick')}
        onUploadAndDebugClick={action('onUploadAndDebugClick')}
        onSendToSerial={action('onSendToSerial')}
      />
    ));
};

const running = () => {
  const store = createStore();
  startDebugSession(store);
  setInterval(() => addMessages(store), 100);
  setInterval(() => addError(store), 3000);

  storiesOf('Debugger', module)
    .addDecorator(story => <Provider store={store}>{story()}</Provider>)
    .add('running', () => (
      <div>
        <LogLength />
        <Debugger
          onUploadClick={action('onUploadClick')}
          onUploadAndDebugClick={action('onUploadAndDebugClick')}
          onSendToSerial={action('onSendToSerial')}
        />
      </div>
    ));
};

const longMessages = () => {
  const store = createStore();

  const errorMessage = [
    'Error occured during uploading:',
    'Here goes some stacktrace with very long lines\n',
    'command /Users/user/xod/very-long-path/verylongpath/very-long-path/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/gcc',
    "can't find file /Users/user/xod/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/file.cpp",
  ].join('\n');

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message: errorMessage,
      percentage: 30,
      id: 1,
    },
    meta: {
      status: 'failed',
    },
  });
  for (let i = 0; i < 300; i += 1) {
    addMessages(store);

    if (i % 10 === 0) {
      store.dispatch(
        addMessagesToDebuggerLog([
          {
            type: 'error',
            message: errorMessage,
            stack: 'And it could have a stack trace...',
          },
        ])
      );
    }
  }

  const onSendToSerial = line =>
    store.dispatch(echoSentLineToDebuggerLog(line));

  storiesOf('Debugger', module)
    .addDecorator(story => <Provider store={store}>{story()}</Provider>)
    .add('long messages', () => (
      <div>
        <LogLength />
        <Debugger
          onUploadClick={action('onUploadClick')}
          onUploadAndDebugClick={action('onUploadAndDebugClick')}
          onSendToSerial={onSendToSerial}
        />
      </div>
    ));
};

// =============================================================================
//
// Run stories
//
// =============================================================================

idle();
uploading();
uploadingSuccess();
uploadingFail();
running();
longMessages();
