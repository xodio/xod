import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { devToolMiddleware } from '../utils/devtools';

export default (extraMiddlewares = []) =>
  compose(applyMiddleware(thunk, ...extraMiddlewares), devToolMiddleware);
