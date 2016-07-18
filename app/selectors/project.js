import R from 'ramda';

export const getProject = R.view(R.lensPath(['project', 'present']));
export const getJSON = (state) => JSON.stringify(R.prop('project', state));
