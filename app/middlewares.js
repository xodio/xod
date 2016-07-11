import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { showError } from './actions';
import DevTools from './containers/DevTools';

const crashReporter = store => next => action => {
  try {
    return next(action);
  } catch (err) {
    return store.dispatch(showError(err));
  }
};

export const EditorMiddleware = compose(
  applyMiddleware(crashReporter, thunk),
  DevTools.instrument()
);
