import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import DevTools from '../../utils/devtools';
import generateReducers from '../reducer';
import { default as defaultInitialState } from '../state';
import EditorMiddleware from '../middlewares';

export default class Root extends React.Component {

  constructor(props) {
    super(props);

    this.store = createStore(
      generateReducers(this.props.extraReducers),
      props.initialState,
      EditorMiddleware
    );
  }

  render() {
    return (
      <Provider store={this.store}>
        <div>
          {this.props.children}
          {DevTools}
        </div>
      </Provider>
    );
  }
}

React.defaultProps = {
  initialState: defaultInitialState,
};

Root.propTypes = {
  children: React.PropTypes.element.isRequired,
  extraReducers: React.PropTypes.object,
  initialState: React.PropTypes.object,
};
