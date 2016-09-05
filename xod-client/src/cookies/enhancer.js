import R from 'ramda';
import Cookies from 'js-cookie';
import { cookies } from './selectors';

// :: [keys] -> { key: value, ... }
const readCookies = R.reduce(
  (p, key) => R.assoc(key, Cookies.get(key), p),
  {}
);

export const cookieSync = cookieKeys => next => (reducer, initialState, enhancer) => {
  if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
    enhancer = initialState;  // eslint-disable-line
    initialState = undefined; // eslint-disable-line
  }

  cookieKeys = cookieKeys || []; // eslint-disable-line

  let persistedState;
  let finalInitialState;

  // Load cookies on init
  try {
    persistedState = { cookies: readCookies(cookieKeys) };
    finalInitialState = R.merge(initialState, persistedState);
  } catch (e) {
    console.warn('Failed to retrieve initialize cookie state from cookies:', e); // eslint-disable-line
  }

  const store = next(reducer, finalInitialState, enhancer);

  // Write cookies
  store.subscribe(() => {
    const state = store.getState();
    const cookieState = cookies(state);

    try {
      R.mapObjIndexed(R.flip(Cookies.set), cookieState);
    } catch (e) {
      console.warn('Unable to sync cookies from state to browser:', e); // eslint-disable-line
    }
  });

  return store;
};
