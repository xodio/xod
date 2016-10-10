import { saver } from 'xod-fs';

export const saveProject = (pojo, workspace, onFinish) => saver(
  pojo,
  workspace,
  onFinish,
  (err) => { throw err; }
);
