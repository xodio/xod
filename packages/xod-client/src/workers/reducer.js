import * as R from 'ramda';
import * as EAT from '../editor/actionTypes';

const workersReducer = (state = [], action) => {
  switch (action.type) {
    case EAT.SIMULATION_LAUNCHED:
    case EAT.TABTEST_LAUNCHED: {
      return R.append(action.payload.worker, state);
    }
    case EAT.SIMULATION_ABORT:
    case EAT.SIMULATION_ERROR:
    case EAT.TABTEST_RUN_FINISHED:
    case EAT.TABTEST_ABORT:
    case EAT.TABTEST_ERROR: {
      const worker = R.path(['meta', 'worker'], action);
      return R.reject(R.identical(worker), state);
    }
    default:
      return state;
  }
};

export default workersReducer;
