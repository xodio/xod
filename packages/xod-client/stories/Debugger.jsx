import React from 'react';
import {
  createStore as createReduxStore,
  combineReducers,
} from 'redux';
import { Provider, connect } from 'react-redux';
import { storiesOf } from '@storybook/react';

import Debugger from '../src/debugger/containers/Debugger';
import DebuggerReducer from '../src/debugger/reducer';
import { getLog } from '../src/debugger/selectors';
import {
  addMessagesToDebuggerLog,
  startDebuggerSession,
} from '../src/debugger/actions';

import '../src/core/styles/main.scss';


// =============================================================================
//
// Utils
//
// =============================================================================

const createStore = () => createReduxStore(combineReducers({
  debugger: DebuggerReducer,
}));

const addMessages = (store) => {
  store.dispatch(addMessagesToDebuggerLog([{
    type: 'log',
    message: 'Just a simple log message, that readed from Serial',
  }, {
    type: 'log',
    message: 'Just another log message',
  }, {
    type: 'xod',
    prefix: '+XOD',
    timecode: Date.now().toString(),
    nodeId: '32',
    content: 'Some text for watch node goes here!',
  }, {
    type: 'xod',
    prefix: '+XOD',
    timecode: Date.now().toString(),
    nodeId: '12',
    content: ((Math.random() * 1000) + Math.random()).toString(),
  }]));
};

const addError = (store) => {
  store.dispatch(addMessagesToDebuggerLog([{
    type: 'error',
    message: 'Error: Some error could be occured and displayed in the Debugger!',
    stack: 'And it could have a stack trace...',
  }]));
};

const startDebugSession = (store) => {
  store.dispatch(startDebuggerSession({
    type: 'system',
    message: 'Debug session has been started! (system message)',
  }, {}));
};

// Container that shows Log length
const LogLength = connect(
  state => ({ log: getLog(state) })
)(({ log }) => (
  <div>
    Log length: {log.length}
  </div>
));

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
      <Debugger />
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
        <Debugger />
      </div>
    ));
};

// =============================================================================
//
// Run stories
//
// =============================================================================

idle();
running();
