import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import Reducers from '../reducers/';
import Serializer from '../serializers/mock';
import { EditorMiddleware } from '../middlewares';

import App from './App';

export default class Root extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();
    const initialState = this.serializer.getState();

    this.store = createStore(Reducers, initialState, EditorMiddleware);
  }

  render() {
    console.log(this.store.getState());
    return (
      <Provider store={this.store}>
        <App />
      </Provider>
    );
  }
}
