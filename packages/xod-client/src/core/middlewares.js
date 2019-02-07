import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import resolveLibsMiddleware from '../project/resolveLibsMiddleware';
import devtoolsMiddleware from '../utils/devtoolsMiddleware';
import sidebarsMiddleware from '../editor/sidebarsMiddleware';
import crashReporter from './crashReporterMiddleware';
import hintingMiddleware from '../hinting/middleware';
import domSideeffectsMiddleware from './domSideeffectsMiddleware';
import outdaterMiddleware from '../debugger/outdaterMiddleware';
import sendToSimulationSerialMiddleware from '../debugger/sendToSimulationSerialMiddleware';
import stopSimulationMiddleware from '../editor/stopSimulationMiddleware';

export default (extraMiddlewares = []) =>
  compose(
    applyMiddleware(
      crashReporter,
      thunk,
      resolveLibsMiddleware,
      sidebarsMiddleware,
      hintingMiddleware,
      domSideeffectsMiddleware,
      outdaterMiddleware,
      stopSimulationMiddleware,
      sendToSimulationSerialMiddleware,
      ...extraMiddlewares
    ),
    devtoolsMiddleware
  );
