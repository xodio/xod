export const API_BASEPATH = 'http://0.0.0.0:3000/api';

const route = (path, method) => ({ path, method });

export default {
  user: {
    login: route('/users/login', 'post'),
    logout: route('/users/logout', 'post'),
    findById: route('/users/:userId', 'get'),
    projects: route('/users/:userId/projects', 'get'),
  },
  project: {
    save: route('/projects', 'put'),
    load: route('/projects/:projectId', 'get'),
  },
};
