import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { apiMiddleware } from 'redux-api-middleware';
import DevTools from './containers/DevTools';

const devTools = (typeof window === 'object' && typeof window.devToolsExtension !== 'undefined') ?
  window.devToolsExtension() : DevTools.instrument();

export const EditorMiddleware = compose(
  applyMiddleware(thunk),
  applyMiddleware(apiMiddleware),
  devTools
);
