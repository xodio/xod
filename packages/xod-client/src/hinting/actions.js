import * as AT from './actionTypes';

export const updateDeducedTypes = deducedTypes => ({
  type: AT.UPDATE_DEDUCED_TYPES,
  payload: deducedTypes,
});

export const updateErrors = errors => ({
  type: AT.UPDATE_ERRORS,
  payload: errors,
});
