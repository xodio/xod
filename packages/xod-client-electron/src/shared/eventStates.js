import { curry } from 'ramda';

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

export const getEventNameWithState = curry(
  (eventName, state) => `${eventName}:${state}`
);
