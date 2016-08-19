import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import DevTools from './containers/DevTools';

const devTools = (typeof window === 'object' && typeof window.devToolsExtension !== 'undefined') ?
  window.devToolsExtension() : DevTools.instrument();

export const EditorMiddleware = compose(
  applyMiddleware(thunk),
  devTools
);
