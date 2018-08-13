import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import resolveLibsMiddleware from '../project/resolveLibsMiddleware';
import devtoolsMiddleware from '../utils/devtoolsMiddleware';
import sidebarsMiddleware from '../editor/sidebarsMiddleware';
import crashReporter from './crashReporterMiddleware';
import hintingMiddleware from '../hinting/middleware';

export default (extraMiddlewares = []) =>
  compose(
    applyMiddleware(
      crashReporter,
      thunk,
      resolveLibsMiddleware,
      sidebarsMiddleware,
      hintingMiddleware,
      ...extraMiddlewares
    ),
    devtoolsMiddleware
  );
