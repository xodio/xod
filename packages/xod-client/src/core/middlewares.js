import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { devToolMiddleware } from '../utils/devtools';
import projectHistoryMiddleware from '../project/projectHistoryMiddleware';

export default compose(
  applyMiddleware(thunk, projectHistoryMiddleware),
  devToolMiddleware
);
