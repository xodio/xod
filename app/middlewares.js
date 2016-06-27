import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

export const EditorMiddleware = compose(
  applyMiddleware(thunk),
  typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ?
    window.devToolsExtension() : f => f
);
