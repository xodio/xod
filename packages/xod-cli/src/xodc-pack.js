// pack <projectDir> <output>   Pack project directory into xodball
/* eslint-disable no-console */

import path from 'path';
import { loadProjectWithLibs, pack, writeJSON } from 'xod-fs';
import * as msg from './messages';

export default (projectDir, output) => {
  const projectPath = path.resolve(projectDir);
  const workspace = path.resolve(projectDir, '..');
  const dirName = projectDir
    .split('/')
    .filter(f => f !== '')
    .pop();

  msg.notice(`Packing ${dirName} into ${output} ...`);

  loadProjectWithLibs([], projectPath, workspace)
    .then(({ project, libs }) => pack(project, libs))
    .then(packed => writeJSON(output, packed))
    .then(() => {
      msg.success(`Packed project successfully written into ${output}`);
    })
    .catch(err => {
      msg.error(err);
      process.exit(1);
    });
};
