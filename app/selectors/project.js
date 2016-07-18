import R from 'ramda';

export const getProject = R.prop('project');
export const getJSON = (state) => JSON.stringify(R.prop('project', state));
