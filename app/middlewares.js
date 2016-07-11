import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

export const EditorMiddleware = compose(
  DevTools.instrument()
);
