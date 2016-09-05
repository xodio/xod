import R from 'ramda';
import { userLens, userIdLens, accessTokenLens } from 'xod-client/user/selectors';

// (IMPORTANT): All selectors are always takes the root state

export default {
  access_token: R.compose(
    userLens,
    accessTokenLens
  ),
  user_id: R.compose(
    userLens,
    userIdLens
  ),
};
