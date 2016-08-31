import Routes from './routes';
import { generateType } from './utils';

export default {
  profile: {
    login: generateType(Routes.profile.login),
    logout: generateType(Routes.profile.logout),
  },
};
