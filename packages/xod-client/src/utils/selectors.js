import { getMeta, getId, getProjectPojo } from 'xod-core';
import * as user from '../user/selectors';

const dataForSync = (state) => {
  const userData = user.user(state);
  const userProjects = user.projects(userData) || {};

  const projectPojo = getProjectPojo(state);
  const meta = getMeta(projectPojo);
  const curProjectId = getId(meta);

  const lastSyncProject = (curProjectId) ? userProjects[curProjectId] : null;

  return {
    projectId: curProjectId,
    lastSyncProject,
    currentProject: projectPojo,
  };
};

// TODO: stub method. all the user stuff will be reimplemented
export const projectHasChanges = () => false;

export const projectCanBeLoaded = (state) => {
  const { projectId, lastSyncProject, currentProject } = dataForSync(state);

  return (
    projectId &&
    lastSyncProject &&
    lastSyncProject.pojo !== JSON.stringify(currentProject)
  ) || false;
};
