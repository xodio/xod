import { compose, applyMiddleware } from 'redux';
import * as ActionTypes from './actionTypes';
import * as Actions from './actions';

function updateViewState({ getState, dispatch }) {
  return (next) => (action) => {
    const actionObj = next(action);
    if (action.type !== ActionTypes.VIEWSTATE_UPDATE) {
      dispatch(Actions.viewstateUpdate(getState()));
    }
    return actionObj;
  };
}

export const EditorMiddleware = compose(
  applyMiddleware(updateViewState),
  typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ?
    window.devToolsExtension() : f => f
);
