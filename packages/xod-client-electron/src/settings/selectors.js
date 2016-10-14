import R from 'ramda';

export const getSettings = R.prop('settings');

export const getWorkspace = R.prop('workspace');

export default {
  getSettings,
  getWorkspace,
};
