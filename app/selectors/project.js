import R from 'ramda';

const getProjectState = (state, path) => {
  if (path.length > 0 && state.hasOwnProperty(path[0])) {
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

export const getJSON = (state) => JSON.stringify(R.prop('project', state));
