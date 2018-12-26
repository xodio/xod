import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import resolveLibsMiddleware from '../project/resolveLibsMiddleware';
import devtoolsMiddleware from '../utils/devtoolsMiddleware';
import sidebarsMiddleware from '../editor/sidebarsMiddleware';
import crashReporter from './crashReporterMiddleware';
import hintingMiddleware from '../hinting/middleware';
import domSideeffectsMiddleware from './domSideeffectsMiddleware';

export default (extraMiddlewares = []) =>
  compose(
    applyMiddleware(
      crashReporter,
      thunk,
      resolveLibsMiddleware,
      sidebarsMiddleware,
      hintingMiddleware,
      domSideeffectsMiddleware,
      ...extraMiddlewares
    ),
    devtoolsMiddleware
  );
