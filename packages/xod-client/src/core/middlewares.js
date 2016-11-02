import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { apiMiddleware } from 'redux-api-middleware';

import { authEnhancer } from '../user/enhancer';
import { devToolMiddleware } from '../utils/devtools';

export const EditorMiddleware = compose(
  authEnhancer,
  applyMiddleware(thunk, apiMiddleware),
  devToolMiddleware
);
