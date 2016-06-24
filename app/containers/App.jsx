import React from 'react';
import Patch from '../containers/Patch';
import { createStore, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import Reducers from '../reducers/';
import { getViewableSize } from '../utils/browser';

import Serializer from '../serializers/mock';
import ViewStateGenerator from '../utils/ViewStateGenerator';

const vsGenerator = new ViewStateGenerator();

// @TODO: Move it into ../middlewares/ folder
function addView({ getState, dispatch }) {
  return (next) => (action) => {
    const actionObj = next(action);
    // @TODO: Use const instead of string action name!
    if (action.type !== 'VIEWSTATE_UPDATE') {
      dispatch({ type: 'VIEWSTATE_UPDATE', state: getState() });
    }
    return actionObj;
  };
}

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();
    const initialState = this.serializer.getState();

    this.store = createStore(Reducers, initialState, compose(
      applyMiddleware(addView),
      typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ?
        window.devToolsExtension() : f => f
    ));

    this.canvasSize = getViewableSize(800, 600);
  }

  updateViewState() {
    this.setState({
      view: vsGenerator.create(this.store.getState()),
    });
  }

  render() {
    const state = this.store.getState();
    const projectMeta = state.project.meta;

    const changeAuthor = () => {
      this.store.dispatch({
        type: 'META_UPDATE',
        data: {
          name: 'Mega project',
        }
      });
    };

    return (
      <div>
        <h1 onClick={changeAuthor}>
        {projectMeta.name} {(projectMeta.author) ? `by ${projectMeta.author}` : ''}
        </h1>

        <Provider store={this.store}>
          <Patch size={this.canvasSize} />
        </Provider>
      </div>
    );
  }
}