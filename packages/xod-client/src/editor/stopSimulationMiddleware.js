/**
 * Middleware stops simulation on close debugger tab
 */

import { isSimulationAbortable } from '../debugger/selectors';
import { abortSimulation } from './actions';
import { TAB_CLOSE } from './actionTypes';
import { DEBUGGER_TAB_ID } from './constants';
import { SIMULATION_STOPPED_BY_CLOSING_TAB } from './messages';
import { addError } from '../messages/actions';

export default store => next => action => {
  const result = next(action);

  if (
    isSimulationAbortable(store.getState()) &&
    action.type === TAB_CLOSE &&
    action.payload.id === DEBUGGER_TAB_ID
  ) {
    store.dispatch(abortSimulation());
    store.dispatch(addError(SIMULATION_STOPPED_BY_CLOSING_TAB));
  }

  return result;
};
