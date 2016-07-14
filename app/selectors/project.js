import R from 'ramda';

export const getJSON = (state) => JSON.stringify(R.prop('project', state));