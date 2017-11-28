import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
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

export const isAccountPaneVisible = createSelector(
  getUserState,
  R.prop('isAccountPaneVisible')
);

export const isAuthorising = createSelector(
  getUserState,
  R.prop('isAuthorising')
);

export const getUser = createSelector(
  getUserState,
  R.pipe(R.path(['grant', 'user']), Maybe)
);
