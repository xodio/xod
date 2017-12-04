import 'url-search-params-polyfill';

import {
  getCompileLimitUrl,
  getWhoamiUrl,
  getLoginUrl,
  getLogoutUrl,
} from '../utils/urls';
import { addError } from '../messages/actions';
import * as ActionTypes from './actionTypes';
import * as Messages from './messages';

export const updateCompileLimit = (startup = false) => dispatch =>
  fetch(getCompileLimitUrl(), {
    headers: startup ? { 'x-launch': 'true' } : {},
  }).then(res => (res.ok ? res.json() : null))
    .catch(() => null)
    .then(limit => dispatch({
      type: ActionTypes.UPDATE_COMPILE_LIMIT,
      payload: limit,
    }));

export const toggleAccountPane = () => ({
  type: ActionTypes.TOGGLE_ACCOUNT_PANE,
});

const setGrant = grant => ({
  type: ActionTypes.SET_AUTH_GRANT,
  payload: grant,
});

/**
 * User has a cookie with only a session id.
 * To know his username and other data we need to fetch
 * a keycloak grant from server
 */
export const fetchGrant = () => dispatch =>
  fetch(getWhoamiUrl(), { credentials: 'include' })
    .then(res => (res.ok ? res.json() : null))
    .catch(() => null)
    .then((grant) => {
      dispatch(setGrant(grant));
      dispatch(updateCompileLimit(false));

      return grant;
    });

export const login = (username, password) => (dispatch) => {
  const form = new URLSearchParams();
  form.set('username', username);
  form.set('password', password);

  dispatch({ type: ActionTypes.LOGIN_STARTED });

  fetch(getLoginUrl(), { method: 'POST', credentials: 'include', body: form })
    .then((res) => {
      if (!res.ok) {
        const err = new Error(res.statusText);
        err.status = res.status;
        throw err;
      }

      return dispatch(fetchGrant());
    })
    .catch((err) => {
      const errMessage = err.status === 403
        ? Messages.INCORRECT_CREDENTIALS
        : Messages.SERVICE_UNAVAILABLE;
      dispatch(addError(errMessage));

      dispatch({ type: ActionTypes.LOGIN_FAILED });
    });
};

export const logout = () => (dispatch) => {
  fetch(getLogoutUrl(), { credentials: 'include' })
    .then(() => {
      dispatch(setGrant(null));
      dispatch(updateCompileLimit(false));
    })
    .catch(() => dispatch(addError(Messages.SERVICE_UNAVAILABLE)));
};

export default {};
