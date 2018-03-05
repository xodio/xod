// unpack <xodball> <dirPath>   Unpack xodball into new project directory in the workspace

import path from 'path';
import { loadProject, saveProjectEntirely } from 'xod-fs';
import { setProjectName } from 'xod-project';
import * as msg from './messageUtils';

export default (xodball, dir) => {
  const xodballPath = path.resolve(xodball);
  const newProjectName = path.basename(dir);
  const dirPath = path.resolve(dir, '..');

  msg.notice(`Unpacking ${xodballPath}`);
  msg.notice(`into ${dirPath} ...`);

  loadProject([], xodballPath)
    .then(setProjectName(newProjectName))
    .then(saveProjectEntirely(dirPath))
    .then(() => {
      msg.success('Done!');
      process.exit(0);
    })
    .catch(err => {
      msg.error(err);
      process.exit(1);
    });
};
