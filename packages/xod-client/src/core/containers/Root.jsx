import React from 'react';
import PropTypes from 'prop-types';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import generateReducers from '../reducer';
import { default as defaultInitialState } from '../state';
import composeMiddlewares from '../middlewares';

export default class Root extends React.Component {

  constructor(props) {
    super(props);

    this.store = createStore(
      generateReducers(this.props.extraReducers),
      this.props.initialState,
      composeMiddlewares(this.props.extraMiddlewares)
    );
  }

  render() {
    return (
      <Provider store={this.store}>
        {this.props.children}
      </Provider>
    );
  }
}

Root.defaultProps = {
  initialState: defaultInitialState,
  extraMiddlewares: [],
};

Root.propTypes = {
  children: PropTypes.element.isRequired,
  extraReducers: PropTypes.object,
  extraMiddlewares: PropTypes.arrayOf(PropTypes.func),
  initialState: PropTypes.object,
};
