import { getMeta, getServerId, getProjectPojo } from 'xod-client/project/selectors';
import * as user from 'xod-client/user/selectors';

const dataForSync = (state) => {
  const userData = user.user(state);
  const userProjects = user.projects(userData) || {};

  const projectPojo = getProjectPojo(state);
  const meta = getMeta(projectPojo);
  const curProjectId = getServerId(meta);

  const lastSyncProject = (curProjectId) ? userProjects[curProjectId] : null;

  return {
    projectId: curProjectId,
    lastSyncProject,
    currentProject: projectPojo,
  };
};

export const projectHaveChanges = (state) => {
  const { lastSyncProject, currentProject } = dataForSync(state);

  return !(
    lastSyncProject &&
    lastSyncProject.pojo === JSON.stringify(currentProject)
  );
};

export const projectCanBeLoaded = (state) => {
  const { projectId, lastSyncProject, currentProject } = dataForSync(state);

  return (
    projectId &&
    lastSyncProject &&
    lastSyncProject.pojo !== JSON.stringify(currentProject)
  ) || false;
};
