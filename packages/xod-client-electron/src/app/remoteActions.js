import saver from 'xod-core/fs/saver';

export const saveProject = (pojo, workspace, onFinish) => saver(
  pojo,
  workspace,
  onFinish,
  (err) => { throw err; }
);
