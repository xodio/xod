import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import resolveLibsMiddleware from '../project/resolveLibsMiddleware';
import { devToolMiddleware } from '../utils/devtools';

export default (extraMiddlewares = []) => compose(
  applyMiddleware(
    thunk,
    resolveLibsMiddleware,
    ...extraMiddlewares
  ),
  devToolMiddleware
);
