import * as R from 'ramda';

const COMPLETE = 'complete';
const ERROR = 'error';
const PROCESS = 'process';

// =============================================================================
//
// Exports
//
// =============================================================================

export const STATES = {
  COMPLETE,
  ERROR,
  PROCESS,
};

export const getEventNameWithState = R.curry(
  (eventName, state) => `${eventName}:${state}`
);

export const getAllStatesForEvent = eventName =>
  R.compose(
    R.assoc('BEGIN', eventName),
    R.map(getEventNameWithState(eventName))
  )(STATES);
