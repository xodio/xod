import R from 'ramda';

const getProjectState = (state, path) => {
  if (path.length > 0 && R.has(path[0], state)) {
    return getProjectState(
      R.prop(path.shift(), state),
      path
    );
  }
  return state;
};

export const getProject = (state) => {
  const path = ['project', 'present'];
  return getProjectState(state, path);
};

export const getJSON = (state) => JSON.stringify(getProject(state));

export const getMeta = R.pipe(
  getProject,
  R.prop('meta')
);
