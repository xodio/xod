import path from 'path';
import {
  SET_WORKSPACE,
} from './actionTypes';

export const setWorkspace = newPath => ({
  type: SET_WORKSPACE,
  payload: path.resolve(newPath),
});

export default {
  setWorkspace,
};
