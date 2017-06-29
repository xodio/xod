import React from 'react';
import PropTypes from 'prop-types';
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
      this.props.initialState,
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

Root.defaultProps = {
  initialState: defaultInitialState,
};

Root.propTypes = {
  children: PropTypes.element.isRequired,
  extraReducers: PropTypes.object,
  initialState: PropTypes.object,
};
