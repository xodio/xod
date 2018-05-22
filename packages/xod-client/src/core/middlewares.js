import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import resolveLibsMiddleware from '../project/resolveLibsMiddleware';
import devtoolsMiddleware from '../utils/devtoolsMiddleware';
import sidebarsMiddleware from '../editor/sidebarsMiddleware';
import crashReporter from './crashReporterMiddleware';

export default (extraMiddlewares = []) =>
  compose(
    applyMiddleware(
      crashReporter,
      thunk,
      resolveLibsMiddleware,
      sidebarsMiddleware,
      ...extraMiddlewares
    ),
    devtoolsMiddleware
  );
