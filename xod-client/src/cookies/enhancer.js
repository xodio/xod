import R from 'ramda';
import Cookies from 'js-cookie';

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

export const cookieSync = cookieLenses => next => (reducer, initialState, enhancer) => {
  if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
    enhancer = initialState;  // eslint-disable-line
    initialState = undefined; // eslint-disable-line
  }

  cookieLenses = cookieLenses || {}; // eslint-disable-line

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

  // Write cookies
  store.subscribe(() => {
    const state = store.getState();
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
  });

  return store;
};
