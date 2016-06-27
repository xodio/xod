import { compose } from 'redux';

export const EditorMiddleware = compose(
  typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ?
    window.devToolsExtension() : f => f
);
