import { getCompileLimitUrl } from '../utils/urls';
import { UPDATE_COMPILE_LIMIT } from './actionTypes';

export const updateCompileLimit = (startup = false) => dispatch =>
  fetch(getCompileLimitUrl(), {
    headers: startup ? { 'x-launch': 'true' } : {},
  }).then(res => (res.ok ? res.json() : null))
    .catch(() => null)
    .then(limit => dispatch({
      type: UPDATE_COMPILE_LIMIT,
      payload: limit,
    }));
export default {};
