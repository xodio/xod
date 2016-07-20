import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import DevTools from './containers/DevTools';

export const EditorMiddleware = compose(
  applyMiddleware(thunk),
  DevTools.instrument()
);
