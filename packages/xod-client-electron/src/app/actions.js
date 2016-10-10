import saver from 'xod-core/fs/saver';
import { getWorkspace } from '../settings/selectors';

export const saveProject = (pojo) => (dispatch, getState) => {
  const workspace = getWorkspace(getState().settings);

  saver(
    pojo,
    workspace,
    () => {
      dispatch({
        type: 'SAVE_COMPLETE',
      });
    },
    (err) => { throw err; }
  );
};
