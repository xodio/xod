import Routes from './routes';
import { generateType } from './utils';

export default {
  user: {
    login: generateType(Routes.user.login, 'post'),
    logout: generateType(Routes.user.logout, 'post'),
    findById: generateType(Routes.user.findById, 'get'),
  },
  project: {
    save: generateType(Routes.project.save, 'put'),
    load: generateType(Routes.project.load, 'get'),
  },
};
