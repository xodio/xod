import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { showError } from './actions';
import DevTools from './containers/DevTools';
import ValidationError from './utils/validationError';

const validationErrorReporter = store => next => action => {
  try {
    return next(action);
  } catch (err) {
    if (err instanceof ValidationError) {
      return store.dispatch(showError(err));
    }

    throw err;
  }
};

export const EditorMiddleware = compose(
  applyMiddleware(validationErrorReporter, thunk),
  DevTools.instrument()
);
