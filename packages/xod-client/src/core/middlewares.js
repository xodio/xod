import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import resolveLibsMiddleware from '../project/resolveLibsMiddleware';
import devtoolsMiddleware from '../utils/devtoolsMiddleware';

export default (extraMiddlewares = []) => compose(
  applyMiddleware(
    thunk,
    resolveLibsMiddleware,
    ...extraMiddlewares
  ),
  devtoolsMiddleware
);
