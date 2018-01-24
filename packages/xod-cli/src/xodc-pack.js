// pack <projectDir> <output>   Pack project directory into xodball
/* eslint-disable no-console */

import path from 'path';
import { loadProjectWithoutLibs, pack, writeJSON } from 'xod-fs';
import * as msg from './messageUtils';

export default (projectDir, output) => {
  const projectPath = path.resolve(projectDir);
  const dirName = projectDir.split('/').filter(f => f !== '').pop();

  msg.notice(`Packing ${dirName} into ${output} ...`);

  loadProjectWithoutLibs(projectPath)
    .then(project => pack(project, {}))
    .then(packed => writeJSON(output, packed))
    .then(() => {
      msg.success(`Packed project successfully written into ${output}`);
    })
    .catch((err) => {
      msg.error(err);
      process.exit(1);
    });
};
