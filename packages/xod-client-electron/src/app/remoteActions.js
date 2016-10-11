import { saver } from 'xod-fs';
import { divided } from 'xod-core';

export const saveProject = (json, workspace, onFinish) => {
  const data = divided(JSON.parse(json));
  return saver(
    data,
    workspace,
    onFinish,
    (err) => { throw err; }
  );
};

export default {
  saveProject,
};
