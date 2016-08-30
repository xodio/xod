import R from 'ramda';
import Cookies from 'js-cookie';

import { cookies } from './selectors';
import { UPDATE_COOKIES } from './constants';

const writeCookie = (key, value) => Cookies.set(key, value);

// Sync state -> browser
export const cookieSync = store => next => action => {
  const oldState = cookies(store.getState());
  next(action);
  const newState = cookies(store.getState());

  const newCookies = R.pipe(
    R.mapObjIndexed(
      (cookie, key) => {
        if (oldState[key] !== cookie) {
          writeCookie(key, cookie);
        }

        return cookie;
      }
    )
  )(newState);
};
