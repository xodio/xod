import R from 'ramda';

import { REDUCER_STATUS, PROJECT_STATUS } from './constants';
import { LOAD_PROJECT_LIST } from '../view/actionTypes';
import { STATUS } from 'xod-client';

const initialState = {
  status: REDUCER_STATUS.INITIAL,
  list: [],
};

const createProjectMeta = R.merge({
  path: '',
  name: null,
  author: null,
  libs: [],
  status: PROJECT_STATUS.OK,
  message: null,
});

// :: payload:loadedProjectList -> [ { path, name, author, libs, status, message }, ... ]
const transformPayloadIntoProjectMetas = R.map(project => {
  if (project.error) {
    return createProjectMeta({
      path: project.path,
      status: PROJECT_STATUS.ERROR,
      message: project.message,
    });
  }

  return createProjectMeta({
    path: project.path,
    name: project.meta.name,
    author: project.meta.author,
    libs: project.libs,
  });
});

const projectsReducer = (state = initialState, action) => {
  const isLoadingProject = act => (act.type === LOAD_PROJECT_LIST);
  const isProgressed = act => (act.meta && act.meta.status === STATUS.PROGRESSED);
  const isSucceeded = act => (act.meta && act.meta.status === STATUS.SUCCEEDED);

  if (R.both(isLoadingProject, isProgressed)(action)) {
    return R.assoc('status', REDUCER_STATUS.PENDING, state);
  }

  if (R.both(isLoadingProject, isSucceeded)(action)) {
    return R.pipe(
      R.assoc('status', REDUCER_STATUS.LOADED),
      R.assoc('list', transformPayloadIntoProjectMetas(action.payload.data))
    )(state);
  }

  return state;
};

export default projectsReducer;
