import R from 'ramda';
import { createSelector } from 'reselect';

export const getUserState = R.prop('user');

export const getCompileLimit = createSelector(
  getUserState,
  R.prop('limit')
);

export const getCompileLimitLeft = createSelector(
  getCompileLimit,
  limit => (limit ? limit.limit - limit.pending - limit.used : null)
);
