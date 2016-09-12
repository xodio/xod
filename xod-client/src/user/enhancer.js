import R from 'ramda';
import Cookies from 'js-cookie';
import { notNil } from 'xod-client/utils/ramda';
import { ApiActions, CALL_API } from 'xod-client/api';
import { userLens, userIdLens, accessTokenLens } from 'xod-client/user/selectors';
import {
  getProccesses,
  findProcessByType,
  filterNotFinished,
} from 'xod-client/processes/selectors';

const hasAuthData = R.pipe(
  R.prop('user'),
  R.allPass([
    R.propSatisfies(notNil, 'access_token'),
    R.propSatisfies(notNil, 'user_id'),
  ])
);
const hasUserData = R.pipe(
  R.prop('user'),
  R.allPass([
    R.propSatisfies(notNil, 'username'),
  ])
);

// key in cookies : lens to property in state
const cookieLenses = {
  access_token: R.compose(
    userLens,
    accessTokenLens
  ),
  user_id: R.compose(
    userLens,
    userIdLens
  ),
};

// :: key -> cookieValue
const getCookie = (key) => {
  const cook = Cookies.get(key);
  if (cook === 'undefined') { return null; }
  return cook;
};

// :: { key: lens } -> { key: valueFromCookies, ... }
const readCookies = R.pipe(
  R.toPairs,
  R.reduce(
    (p, [key, lens]) => {
      const cookieVal = getCookie(key);
      if (cookieVal === null) { return p; }

      return R.set(lens, cookieVal, p);
    },
    {}
  )
);

// :: { key: lens } -> state -> { key: valueFromState, ... }
const readState = R.curry(
  (state, lenses) => R.pipe(
    R.mapObjIndexed(
      R.flip(R.view)(state)
    ),
    R.reject(R.isNil)
  )(lenses)
);

// do we need to get user data?
const hasToGetUserData = state => (hasAuthData(state) && !hasUserData(state));


// get user data if needed
const getUserData = dispatch => dispatch(ApiActions.user.me());


export const authEnhancer = next => (reducer, initialState, enhancer) => {
  if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
    enhancer = initialState;  // eslint-disable-line
    initialState = undefined; // eslint-disable-line
  }

  let gettingDataRequest = false;
  let persistedState;
  let finalInitialState;

  // Load cookies on init
  try {
    persistedState = readCookies(cookieLenses);
    finalInitialState = R.merge(initialState, persistedState);
  } catch (e) {
    console.warn('Failed to retrieve initialize cookie state from cookies:', e); // eslint-disable-line
  }

  const store = next(reducer, finalInitialState, enhancer);

  // On init: check authorization
  if (hasToGetUserData(finalInitialState)) {
    getUserData(store.dispatch);
    gettingDataRequest = true;
  }

  // On change: write / delete cookies
  store.subscribe(() => {
    const state = store.getState();

    // Store cookies
    const stateValues = readState(state, cookieLenses);
    const cookieValues = readCookies(cookieLenses);

    if (R.equals(stateValues, cookieValues)) { return; }
    try {
      R.pipe(
        R.keys,
        R.forEach(
          key => {
            if (stateValues[key]) {
              Cookies.set(key, stateValues[key]);
            } else {
              Cookies.remove(key);
            }
          }
        )
      )(cookieLenses);
    } catch (e) {
      console.warn('Unable to sync cookies from state to browser:', e); // eslint-disable-line
    }

    // Get user data, if needed
    const type = ApiActions.user.me()[CALL_API].types[0].type;
    const processes = getProccesses(state);
    const gettingUserData = R.pipe(
      filterNotFinished,
      findProcessByType(type),
      notNil
    )(processes);

    if (hasToGetUserData(state) && !gettingUserData && gettingDataRequest === false) {
      getUserData(store.dispatch);
      gettingDataRequest = true;
    }
  });

  return store;
};
